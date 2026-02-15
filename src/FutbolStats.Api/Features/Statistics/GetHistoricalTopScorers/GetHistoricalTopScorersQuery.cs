using FutbolStats.Api.Common;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Statistics.GetHistoricalTopScorers;

public record GetHistoricalTopScorersQuery(
    int Page = 1,
    int PageSize = 20,
    Guid? CountryId = null,
    string? Search = null
) : IRequest<HistoricalTopScorersResponse>;

public record HistoricalTopScorersResponse(
    List<HistoricalScorerDto> Scorers,
    int Page,
    int PageSize,
    int TotalCount,
    bool HasNextPage
);

public record HistoricalScorerDto(
    int Rank,
    Guid PlayerId,
    string PlayerName,
    string? PhotoUrl,
    string? CountryName,
    string? CountryFlagUrl,
    Guid TeamId,
    string TeamName,
    string? TeamLogoUrl,
    int Goals,
    int PenaltyGoals,
    int Assists,
    int MatchesPlayed,
    List<ScorerTeamBreakdownDto> TeamBreakdowns
);

public record ScorerTeamBreakdownDto(
    Guid TeamId,
    string TeamName,
    string? TeamLogoUrl,
    int Goals,
    int PenaltyGoals,
    int Assists,
    int MatchesPlayed
);

public class GetHistoricalTopScorersQueryHandler : IRequestHandler<GetHistoricalTopScorersQuery, HistoricalTopScorersResponse>
{
    private readonly FutbolDbContext _context;

    public GetHistoricalTopScorersQueryHandler(FutbolDbContext context)
    {
        _context = context;
    }

    public async Task<HistoricalTopScorersResponse> Handle(GetHistoricalTopScorersQuery request, CancellationToken cancellationToken)
    {
        // Load goal events (lightweight projection)
        var goalEvents = await _context.MatchEvents
            .Where(e => e.PlayerId.HasValue
                        && (e.EventType == EventType.Goal || e.EventType == EventType.PenaltyScored))
            .Select(e => new { PlayerId = e.PlayerId!.Value, e.TeamId, e.EventType })
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var scoringPlayerIds = goalEvents.Select(e => e.PlayerId).Distinct().ToList();

        // Load assist events for scoring players
        var assistEvents = await _context.MatchEvents
            .Where(e => e.PlayerId.HasValue && e.EventType == EventType.Assist
                        && scoringPlayerIds.Contains(e.PlayerId!.Value))
            .Select(e => new { PlayerId = e.PlayerId!.Value, e.TeamId })
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        // Load lineups from finished matches for scoring players
        var lineups = await _context.MatchLineups
            .Where(l => l.Match.Status == MatchStatus.Finished
                        && scoringPlayerIds.Contains(l.PlayerId))
            .Select(l => new { l.PlayerId, l.TeamId, l.Match.MatchDate })
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        // Load players with Country
        var players = await _context.Players
            .Include(p => p.Country)
            .Where(p => scoringPlayerIds.Contains(p.Id))
            .AsNoTracking()
            .ToDictionaryAsync(p => p.Id, cancellationToken);

        // Load all relevant teams
        var teamIds = goalEvents.Select(e => e.TeamId)
            .Union(lineups.Select(l => l.TeamId))
            .Union(players.Values.Select(p => p.TeamId))
            .Distinct().ToList();
        var teams = await _context.Teams
            .Where(t => teamIds.Contains(t.Id))
            .AsNoTracking()
            .ToDictionaryAsync(t => t.Id, cancellationToken);

        // Build scorer data
        var allScorers = goalEvents
            .GroupBy(e => e.PlayerId)
            .Where(g => players.ContainsKey(g.Key))
            .Select(g =>
            {
                var player = players[g.Key];
                var playerId = g.Key;

                // Total stats
                var totalGoals = g.Count();
                var totalPenalties = g.Count(e => e.EventType == EventType.PenaltyScored);
                var totalAssists = assistEvents.Count(a => a.PlayerId == playerId);
                var totalMatches = lineups.Count(l => l.PlayerId == playerId);

                // Per-team breakdowns
                var goalsByTeam = g.GroupBy(e => e.TeamId).ToDictionary(
                    tg => tg.Key,
                    tg => (Goals: tg.Count(), Penalties: tg.Count(e => e.EventType == EventType.PenaltyScored))
                );
                var assistsByTeam = assistEvents.Where(a => a.PlayerId == playerId)
                    .GroupBy(a => a.TeamId)
                    .ToDictionary(ag => ag.Key, ag => ag.Count());
                var matchesByTeam = lineups.Where(l => l.PlayerId == playerId)
                    .GroupBy(l => l.TeamId)
                    .ToDictionary(lg => lg.Key, lg => lg.Count());

                var allPlayerTeamIds = goalsByTeam.Keys
                    .Union(matchesByTeam.Keys)
                    .Distinct()
                    .Where(tid => teams.ContainsKey(tid));

                var teamBreakdowns = allPlayerTeamIds.Select(tid =>
                {
                    var team = teams[tid];
                    goalsByTeam.TryGetValue(tid, out var goals);
                    assistsByTeam.TryGetValue(tid, out var assists);
                    matchesByTeam.TryGetValue(tid, out var matches);
                    return new ScorerTeamBreakdownDto(
                        tid, team.Name, team.LogoUrl,
                        goals.Goals, goals.Penalties, assists, matches
                    );
                })
                .OrderByDescending(t => t.Goals)
                .ToList();

                // Determine last team from most recent lineup
                var lastLineup = lineups
                    .Where(l => l.PlayerId == playerId)
                    .OrderByDescending(l => l.MatchDate)
                    .FirstOrDefault();
                var lastTeamId = lastLineup?.TeamId ?? player.TeamId;
                var lastTeam = teams.GetValueOrDefault(lastTeamId);

                return new
                {
                    Player = player,
                    LastTeamId = lastTeamId,
                    LastTeamName = lastTeam?.Name ?? "",
                    LastTeamLogoUrl = lastTeam?.LogoUrl,
                    Goals = totalGoals,
                    PenaltyGoals = totalPenalties,
                    Assists = totalAssists,
                    MatchesPlayed = totalMatches,
                    TeamBreakdowns = teamBreakdowns
                };
            })
            .OrderByDescending(x => x.Goals)
            .ThenByDescending(x => x.Assists)
            .ThenBy(x => x.MatchesPlayed)
            .ToList();

        // Filter by country
        if (request.CountryId.HasValue)
        {
            allScorers = allScorers.Where(x => x.Player.CountryId == request.CountryId.Value).ToList();
        }

        // Filter by player name
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var searchLower = request.Search.ToLower();
            allScorers = allScorers.Where(x =>
                x.Player.FirstName.ToLower().Contains(searchLower) ||
                x.Player.LastName.ToLower().Contains(searchLower)
            ).ToList();
        }

        var totalCount = allScorers.Count;
        var skip = (request.Page - 1) * request.PageSize;

        var scorers = allScorers
            .Skip(skip)
            .Take(request.PageSize)
            .Select((x, index) => new HistoricalScorerDto(
                skip + index + 1,
                x.Player.Id,
                $"{x.Player.FirstName} {x.Player.LastName}",
                x.Player.PhotoUrl,
                x.Player.Country?.Name,
                x.Player.Country?.FlagUrl,
                x.LastTeamId,
                x.LastTeamName,
                x.LastTeamLogoUrl,
                x.Goals,
                x.PenaltyGoals,
                x.Assists,
                x.MatchesPlayed,
                x.TeamBreakdowns
            ))
            .ToList();

        var hasNextPage = skip + scorers.Count < totalCount;

        return new HistoricalTopScorersResponse(
            scorers,
            request.Page,
            request.PageSize,
            totalCount,
            hasNextPage
        );
    }
}
