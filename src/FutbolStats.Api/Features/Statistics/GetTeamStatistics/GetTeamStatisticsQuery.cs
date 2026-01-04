using FutbolStats.Api.Common;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Statistics.GetTeamStatistics;

public record GetTeamStatisticsQuery(Guid TeamId, Guid? ChampionshipId = null) : IRequest<TeamStatisticsResponse>;

public record TeamStatisticsResponse(
    Guid TeamId,
    string TeamName,
    string? LogoUrl,
    int MatchesPlayed,
    int Wins,
    int Draws,
    int Losses,
    int GoalsFor,
    int GoalsAgainst,
    int GoalDifference,
    int Points,
    int YellowCards,
    int RedCards,
    int CleanSheets,
    List<TopScorerDto> TopScorers,
    List<ChampionshipSummaryDto>? ChampionshipSummaries
);

public record TopScorerDto(
    Guid PlayerId,
    string PlayerName,
    int Goals
);

public record ChampionshipSummaryDto(
    Guid ChampionshipId,
    string ChampionshipName,
    int Position,
    int MatchesPlayed,
    int Points,
    int GoalsFor,
    int GoalsAgainst
);

public class GetTeamStatisticsQueryHandler : IRequestHandler<GetTeamStatisticsQuery, TeamStatisticsResponse>
{
    private readonly FutbolDbContext _context;

    public GetTeamStatisticsQueryHandler(FutbolDbContext context)
    {
        _context = context;
    }

    public async Task<TeamStatisticsResponse> Handle(GetTeamStatisticsQuery request, CancellationToken cancellationToken)
    {
        var team = await _context.Teams
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == request.TeamId, cancellationToken);

        if (team == null)
        {
            throw new NotFoundException("Team", request.TeamId);
        }

        // Get matches where this team played
        var matchesQuery = _context.Matches
            .Include(m => m.Championship)
            .Where(m => (m.HomeTeamId == request.TeamId || m.AwayTeamId == request.TeamId)
                        && m.Status == MatchStatus.Finished);

        if (request.ChampionshipId.HasValue)
        {
            matchesQuery = matchesQuery.Where(m => m.ChampionshipId == request.ChampionshipId.Value);
        }

        var matches = await matchesQuery.AsNoTracking().ToListAsync(cancellationToken);

        int wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0, cleanSheets = 0;

        foreach (var match in matches)
        {
            bool isHome = match.HomeTeamId == request.TeamId;
            int teamGoals = isHome ? match.HomeScore : match.AwayScore;
            int opponentGoals = isHome ? match.AwayScore : match.HomeScore;

            goalsFor += teamGoals;
            goalsAgainst += opponentGoals;

            if (opponentGoals == 0) cleanSheets++;

            if (teamGoals > opponentGoals) wins++;
            else if (teamGoals < opponentGoals) losses++;
            else draws++;
        }

        // Get events for cards
        var eventsQuery = _context.MatchEvents
            .Include(e => e.Match)
            .Where(e => e.TeamId == request.TeamId && e.Match.Status == MatchStatus.Finished);

        if (request.ChampionshipId.HasValue)
        {
            eventsQuery = eventsQuery.Where(e => e.Match.ChampionshipId == request.ChampionshipId.Value);
        }

        var events = await eventsQuery.AsNoTracking().ToListAsync(cancellationToken);

        var yellowCards = events.Count(e => e.EventType == EventType.YellowCard || e.EventType == EventType.SecondYellow);
        var redCards = events.Count(e => e.EventType == EventType.RedCard || e.EventType == EventType.SecondYellow);

        // Top scorers for the team
        var topScorers = events
            .Where(e => e.EventType == EventType.Goal || e.EventType == EventType.PenaltyScored)
            .GroupBy(e => e.PlayerId)
            .Select(g => new { PlayerId = g.Key, Goals = g.Count() })
            .OrderByDescending(x => x.Goals)
            .Take(5)
            .ToList();

        var playerIds = topScorers.Select(ts => ts.PlayerId).ToList();
        var players = await _context.Players
            .Where(p => playerIds.Contains(p.Id))
            .AsNoTracking()
            .ToDictionaryAsync(p => p.Id, cancellationToken);

        var topScorerDtos = topScorers
            .Where(ts => players.ContainsKey(ts.PlayerId))
            .Select(ts => new TopScorerDto(
                ts.PlayerId,
                $"{players[ts.PlayerId].FirstName} {players[ts.PlayerId].LastName}",
                ts.Goals
            ))
            .ToList();

        List<ChampionshipSummaryDto>? championshipSummaries = null;

        if (!request.ChampionshipId.HasValue)
        {
            var championshipTeams = await _context.ChampionshipTeams
                .Include(ct => ct.Championship)
                .Where(ct => ct.TeamId == request.TeamId)
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            championshipSummaries = new List<ChampionshipSummaryDto>();

            foreach (var ct in championshipTeams)
            {
                // Calculate position
                var standings = await _context.ChampionshipTeams
                    .Where(x => x.ChampionshipId == ct.ChampionshipId)
                    .OrderByDescending(x => x.Points)
                    .ThenByDescending(x => x.GoalsFor - x.GoalsAgainst)
                    .ThenByDescending(x => x.GoalsFor)
                    .AsNoTracking()
                    .ToListAsync(cancellationToken);

                var position = standings.FindIndex(x => x.TeamId == request.TeamId) + 1;

                championshipSummaries.Add(new ChampionshipSummaryDto(
                    ct.ChampionshipId,
                    ct.Championship.Name,
                    position,
                    ct.GamesPlayed,
                    ct.Points,
                    ct.GoalsFor,
                    ct.GoalsAgainst
                ));
            }
        }

        return new TeamStatisticsResponse(
            team.Id,
            team.Name,
            team.LogoUrl,
            matches.Count,
            wins,
            draws,
            losses,
            goalsFor,
            goalsAgainst,
            goalsFor - goalsAgainst,
            wins * 3 + draws,
            yellowCards,
            redCards,
            cleanSheets,
            topScorerDtos,
            championshipSummaries
        );
    }
}
