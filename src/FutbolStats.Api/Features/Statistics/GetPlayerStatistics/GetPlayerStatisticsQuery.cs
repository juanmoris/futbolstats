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
    string? PhotoUrl,
    string TeamName,
    string? TeamLogoUrl,
    string Position,
    string? CountryName,
    DateOnly? BirthDate,
    int? Number,
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
    List<ChampionshipStatsDto>? ChampionshipStats,
    List<TeamStatsDto>? TeamStats,
    List<PlayerMatchDto>? RecentMatches
);

public record ChampionshipStatsDto(
    Guid ChampionshipId,
    string ChampionshipName,
    string Season,
    int MatchesPlayed,
    int Goals,
    int Assists,
    int YellowCards,
    int RedCards
);

public record TeamStatsDto(
    Guid TeamId,
    string TeamName,
    string? TeamLogoUrl,
    int MatchesPlayed,
    int MatchesStarted,
    int MatchesAsSub,
    int Goals,
    int Assists,
    int YellowCards,
    int RedCards
);

public record PlayerMatchDto(
    Guid MatchId,
    DateTime MatchDate,
    string ChampionshipName,
    string TeamName,
    string OpponentName,
    string? OpponentLogoUrl,
    bool IsHome,
    int TeamScore,
    int OpponentScore,
    bool IsStarter,
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
            .Include(p => p.Country)
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

        // Get lineup data for matches played with team information
        var lineupsQuery = _context.MatchLineups
            .Include(l => l.Team)
            .Include(l => l.Match)
                .ThenInclude(m => m.Championship)
            .Include(l => l.Match)
                .ThenInclude(m => m.HomeTeam)
            .Include(l => l.Match)
                .ThenInclude(m => m.AwayTeam)
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
        List<TeamStatsDto>? teamStats = null;
        List<PlayerMatchDto>? recentMatches = null;

        if (!request.ChampionshipId.HasValue)
        {
            // Group by championship (using lineups to include all championships where player participated)
            var championships = lineups
                .GroupBy(l => new { l.Match.ChampionshipId, l.Match.Championship.Name, l.Match.Championship.Season })
                .Select(g =>
                {
                    var championshipMatchIds = g.Select(l => l.MatchId).ToHashSet();
                    var championshipEvents = events.Where(e => championshipMatchIds.Contains(e.MatchId)).ToList();
                    return new ChampionshipStatsDto(
                        g.Key.ChampionshipId,
                        g.Key.Name,
                        g.Key.Season,
                        g.Count(),
                        championshipEvents.Count(e => e.EventType == EventType.Goal || e.EventType == EventType.PenaltyScored),
                        championshipEvents.Count(e => e.EventType == EventType.Assist),
                        championshipEvents.Count(e => e.EventType == EventType.YellowCard || e.EventType == EventType.SecondYellow),
                        championshipEvents.Count(e => e.EventType == EventType.RedCard || e.EventType == EventType.SecondYellow)
                    );
                })
                .OrderByDescending(c => c.MatchesPlayed)
                .ToList();

            championshipStats = championships;

            // Group by team (historical stats)
            var teams = lineups
                .GroupBy(l => new { l.TeamId, l.Team.Name, l.Team.LogoUrl })
                .Select(g =>
                {
                    var teamMatchIds = g.Select(l => l.MatchId).ToHashSet();
                    var teamEvents = events.Where(e => teamMatchIds.Contains(e.MatchId)).ToList();
                    return new TeamStatsDto(
                        g.Key.TeamId,
                        g.Key.Name,
                        g.Key.LogoUrl,
                        g.Count(),
                        g.Count(l => l.IsStarter),
                        g.Count(l => !l.IsStarter),
                        teamEvents.Count(e => e.EventType == EventType.Goal || e.EventType == EventType.PenaltyScored),
                        teamEvents.Count(e => e.EventType == EventType.Assist),
                        teamEvents.Count(e => e.EventType == EventType.YellowCard || e.EventType == EventType.SecondYellow),
                        teamEvents.Count(e => e.EventType == EventType.RedCard || e.EventType == EventType.SecondYellow)
                    );
                })
                .OrderByDescending(t => t.MatchesPlayed)
                .ToList();

            teamStats = teams;

            // Build recent matches list
            recentMatches = lineups
                .OrderByDescending(l => l.Match.MatchDate)
                .Take(50)
                .Select(l =>
                {
                    var isHome = l.TeamId == l.Match.HomeTeamId;
                    var opponent = isHome ? l.Match.AwayTeam : l.Match.HomeTeam;
                    var teamScore = isHome ? l.Match.HomeScore : l.Match.AwayScore;
                    var opponentScore = isHome ? l.Match.AwayScore : l.Match.HomeScore;
                    var matchEvents = events.Where(e => e.MatchId == l.MatchId).ToList();

                    return new PlayerMatchDto(
                        l.MatchId,
                        l.Match.MatchDate,
                        l.Match.Championship.Name,
                        l.Team.Name,
                        opponent.Name,
                        opponent.LogoUrl,
                        isHome,
                        teamScore,
                        opponentScore,
                        l.IsStarter,
                        matchEvents.Count(e => e.EventType == EventType.Goal || e.EventType == EventType.PenaltyScored),
                        matchEvents.Count(e => e.EventType == EventType.Assist),
                        matchEvents.Count(e => e.EventType == EventType.YellowCard || e.EventType == EventType.SecondYellow),
                        matchEvents.Count(e => e.EventType == EventType.RedCard || e.EventType == EventType.SecondYellow)
                    );
                })
                .ToList();
        }

        return new PlayerStatisticsResponse(
            player.Id,
            $"{player.FirstName} {player.LastName}",
            player.PhotoUrl,
            player.Team.Name,
            player.Team.LogoUrl,
            player.Position.ToString(),
            player.Country?.Name,
            player.BirthDate,
            player.Number,
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
            championshipStats,
            teamStats,
            recentMatches
        );
    }
}
