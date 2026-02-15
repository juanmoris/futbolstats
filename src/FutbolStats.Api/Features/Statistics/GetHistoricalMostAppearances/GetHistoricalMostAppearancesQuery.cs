using FutbolStats.Api.Common;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Statistics.GetHistoricalMostAppearances;

public record GetHistoricalMostAppearancesQuery(
    int Page = 1,
    int PageSize = 20,
    Guid? CountryId = null,
    string? Search = null
) : IRequest<HistoricalMostAppearancesResponse>;

public record HistoricalMostAppearancesResponse(
    List<HistoricalAppearanceDto> Players,
    int Page,
    int PageSize,
    int TotalCount,
    bool HasNextPage
);

public record HistoricalAppearanceDto(
    int Rank,
    Guid PlayerId,
    string PlayerName,
    string? PhotoUrl,
    string? CountryName,
    string? CountryFlagUrl,
    Guid TeamId,
    string TeamName,
    string? TeamLogoUrl,
    int MatchesPlayed,
    int MatchesAsStarter,
    int MatchesAsSub,
    List<AppearanceTeamBreakdownDto> TeamBreakdowns
);

public record AppearanceTeamBreakdownDto(
    Guid TeamId,
    string TeamName,
    string? TeamLogoUrl,
    int MatchesPlayed,
    int MatchesAsStarter,
    int MatchesAsSub
);

public class GetHistoricalMostAppearancesQueryHandler : IRequestHandler<GetHistoricalMostAppearancesQuery, HistoricalMostAppearancesResponse>
{
    private readonly FutbolDbContext _context;

    public GetHistoricalMostAppearancesQueryHandler(FutbolDbContext context)
    {
        _context = context;
    }

    public async Task<HistoricalMostAppearancesResponse> Handle(GetHistoricalMostAppearancesQuery request, CancellationToken cancellationToken)
    {
        // Load all lineups from finished matches (lightweight projection)
        var allLineups = await _context.MatchLineups
            .Where(l => l.Match.Status == MatchStatus.Finished)
            .Select(l => new { l.PlayerId, l.TeamId, l.IsStarter, l.Match.MatchDate })
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        // Load player data
        var playerIds = allLineups.Select(l => l.PlayerId).Distinct().ToList();
        var players = await _context.Players
            .Include(p => p.Country)
            .Where(p => playerIds.Contains(p.Id))
            .AsNoTracking()
            .ToDictionaryAsync(p => p.Id, cancellationToken);

        // Load team data
        var teamIds = allLineups.Select(l => l.TeamId).Distinct().ToList();
        var teams = await _context.Teams
            .Where(t => teamIds.Contains(t.Id))
            .AsNoTracking()
            .ToDictionaryAsync(t => t.Id, cancellationToken);

        // Group by player
        var allPlayers = allLineups
            .GroupBy(l => l.PlayerId)
            .Where(g => players.ContainsKey(g.Key))
            .Select(g =>
            {
                var player = players[g.Key];

                // Determine last team from most recent lineup
                var lastEntry = g.OrderByDescending(l => l.MatchDate).First();
                var lastTeamId = lastEntry.TeamId;
                var lastTeam = teams.GetValueOrDefault(lastTeamId);

                // Per-team breakdowns
                var teamBreakdowns = g
                    .GroupBy(l => l.TeamId)
                    .Where(tg => teams.ContainsKey(tg.Key))
                    .Select(tg =>
                    {
                        var team = teams[tg.Key];
                        return new AppearanceTeamBreakdownDto(
                            tg.Key,
                            team.Name,
                            team.LogoUrl,
                            tg.Count(),
                            tg.Count(l => l.IsStarter),
                            tg.Count(l => !l.IsStarter)
                        );
                    })
                    .OrderByDescending(t => t.MatchesPlayed)
                    .ToList();

                return new
                {
                    Player = player,
                    LastTeamId = lastTeamId,
                    LastTeamName = lastTeam?.Name ?? "",
                    LastTeamLogoUrl = lastTeam?.LogoUrl,
                    MatchesPlayed = g.Count(),
                    MatchesAsStarter = g.Count(l => l.IsStarter),
                    MatchesAsSub = g.Count(l => !l.IsStarter),
                    TeamBreakdowns = teamBreakdowns
                };
            })
            .OrderByDescending(x => x.MatchesPlayed)
            .ThenByDescending(x => x.MatchesAsStarter)
            .ThenBy(x => x.Player.LastName)
            .ToList();

        // Filter by country
        if (request.CountryId.HasValue)
        {
            allPlayers = allPlayers.Where(x => x.Player.CountryId == request.CountryId.Value).ToList();
        }

        // Filter by player name
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var searchLower = request.Search.ToLower();
            allPlayers = allPlayers.Where(x =>
                x.Player.FirstName.ToLower().Contains(searchLower) ||
                x.Player.LastName.ToLower().Contains(searchLower)
            ).ToList();
        }

        var totalCount = allPlayers.Count;
        var skip = (request.Page - 1) * request.PageSize;

        var result = allPlayers
            .Skip(skip)
            .Take(request.PageSize)
            .Select((x, index) => new HistoricalAppearanceDto(
                skip + index + 1,
                x.Player.Id,
                $"{x.Player.FirstName} {x.Player.LastName}",
                x.Player.PhotoUrl,
                x.Player.Country?.Name,
                x.Player.Country?.FlagUrl,
                x.LastTeamId,
                x.LastTeamName,
                x.LastTeamLogoUrl,
                x.MatchesPlayed,
                x.MatchesAsStarter,
                x.MatchesAsSub,
                x.TeamBreakdowns
            ))
            .ToList();

        var hasNextPage = skip + result.Count < totalCount;

        return new HistoricalMostAppearancesResponse(
            result,
            request.Page,
            request.PageSize,
            totalCount,
            hasNextPage
        );
    }
}
