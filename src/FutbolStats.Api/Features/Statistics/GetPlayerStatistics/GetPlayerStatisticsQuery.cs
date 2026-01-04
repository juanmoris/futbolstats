using FutbolStats.Api.Common;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Statistics.GetPlayerStatistics;

public record GetPlayerStatisticsQuery(Guid PlayerId, Guid? ChampionshipId = null) : IRequest<PlayerStatisticsResponse>;

public record PlayerStatisticsResponse(
    Guid PlayerId,
    string PlayerName,
    string TeamName,
    string Position,
    int MatchesPlayed,
    int MatchesStarted,
    int MatchesAsSub,
    int Goals,
    int Assists,
    int OwnGoals,
    int YellowCards,
    int RedCards,
    int PenaltiesScored,
    int PenaltiesMissed,
    List<ChampionshipStatsDto>? ChampionshipStats
);

public record ChampionshipStatsDto(
    Guid ChampionshipId,
    string ChampionshipName,
    int MatchesPlayed,
    int Goals,
    int Assists,
    int YellowCards,
    int RedCards
);

public class GetPlayerStatisticsQueryHandler : IRequestHandler<GetPlayerStatisticsQuery, PlayerStatisticsResponse>
{
    private readonly FutbolDbContext _context;

    public GetPlayerStatisticsQueryHandler(FutbolDbContext context)
    {
        _context = context;
    }

    public async Task<PlayerStatisticsResponse> Handle(GetPlayerStatisticsQuery request, CancellationToken cancellationToken)
    {
        var player = await _context.Players
            .Include(p => p.Team)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.PlayerId, cancellationToken);

        if (player == null)
        {
            throw new NotFoundException("Player", request.PlayerId);
        }

        // Get all events for this player
        var eventsQuery = _context.MatchEvents
            .Include(e => e.Match)
                .ThenInclude(m => m.Championship)
            .Where(e => e.PlayerId == request.PlayerId);

        if (request.ChampionshipId.HasValue)
        {
            eventsQuery = eventsQuery.Where(e => e.Match.ChampionshipId == request.ChampionshipId.Value);
        }

        var events = await eventsQuery.AsNoTracking().ToListAsync(cancellationToken);

        // Get lineup data for matches played
        var lineupsQuery = _context.MatchLineups
            .Include(l => l.Match)
                .ThenInclude(m => m.Championship)
            .Where(l => l.PlayerId == request.PlayerId && l.Match.Status == MatchStatus.Finished);

        if (request.ChampionshipId.HasValue)
        {
            lineupsQuery = lineupsQuery.Where(l => l.Match.ChampionshipId == request.ChampionshipId.Value);
        }

        var lineups = await lineupsQuery.AsNoTracking().ToListAsync(cancellationToken);

        var matchesPlayed = lineups.Count;
        var matchesStarted = lineups.Count(l => l.IsStarter);
        var matchesAsSub = lineups.Count(l => !l.IsStarter);

        var goals = events.Count(e => e.EventType == EventType.Goal || e.EventType == EventType.PenaltyScored);
        var assists = events.Count(e => e.EventType == EventType.Assist);
        var ownGoals = events.Count(e => e.EventType == EventType.OwnGoal);
        var yellowCards = events.Count(e => e.EventType == EventType.YellowCard || e.EventType == EventType.SecondYellow);
        var redCards = events.Count(e => e.EventType == EventType.RedCard || e.EventType == EventType.SecondYellow);
        var penaltiesScored = events.Count(e => e.EventType == EventType.PenaltyScored);
        var penaltiesMissed = events.Count(e => e.EventType == EventType.PenaltyMissed);

        List<ChampionshipStatsDto>? championshipStats = null;

        if (!request.ChampionshipId.HasValue)
        {
            // Group by championship
            var championships = events
                .GroupBy(e => new { e.Match.ChampionshipId, e.Match.Championship.Name })
                .Select(g => new ChampionshipStatsDto(
                    g.Key.ChampionshipId,
                    g.Key.Name,
                    lineups.Count(l => l.Match.ChampionshipId == g.Key.ChampionshipId),
                    g.Count(e => e.EventType == EventType.Goal || e.EventType == EventType.PenaltyScored),
                    g.Count(e => e.EventType == EventType.Assist),
                    g.Count(e => e.EventType == EventType.YellowCard || e.EventType == EventType.SecondYellow),
                    g.Count(e => e.EventType == EventType.RedCard || e.EventType == EventType.SecondYellow)
                ))
                .ToList();

            championshipStats = championships;
        }

        return new PlayerStatisticsResponse(
            player.Id,
            $"{player.FirstName} {player.LastName}",
            player.Team.Name,
            player.Position.ToString(),
            matchesPlayed,
            matchesStarted,
            matchesAsSub,
            goals,
            assists,
            ownGoals,
            yellowCards,
            redCards,
            penaltiesScored,
            penaltiesMissed,
            championshipStats
        );
    }
}
