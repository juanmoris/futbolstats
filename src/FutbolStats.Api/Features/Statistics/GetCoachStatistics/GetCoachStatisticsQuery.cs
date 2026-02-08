using FutbolStats.Api.Common;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Statistics.GetCoachStatistics;

public record GetCoachStatisticsQuery(Guid CoachId, Guid? ChampionshipId = null) : IRequest<CoachStatisticsResponse>;

public record CoachStatisticsResponse(
    Guid CoachId,
    string CoachName,
    string? PhotoUrl,
    string? CountryName,
    string? CountryFlagUrl,
    DateOnly? BirthDate,
    string? CurrentTeamName,
    string? CurrentTeamLogo,
    int TotalMatches,
    int Wins,
    int Draws,
    int Losses,
    int GoalsFor,
    int GoalsAgainst,
    decimal WinPercentage,
    List<CoachChampionshipStatsDto>? ChampionshipStats,
    List<CoachTeamStatsDto>? TeamStats
);

public record CoachChampionshipStatsDto(
    Guid ChampionshipId,
    string ChampionshipName,
    string Season,
    int Matches,
    int Wins,
    int Draws,
    int Losses,
    int GoalsFor,
    int GoalsAgainst,
    int Points,
    decimal WinPercentage
);

public record CoachTeamStatsDto(
    Guid TeamId,
    string TeamName,
    string? TeamLogo,
    DateOnly StartDate,
    DateOnly? EndDate,
    bool IsCurrent,
    int Matches,
    int Wins,
    int Draws,
    int Losses,
    int GoalsFor,
    int GoalsAgainst,
    int Points,
    decimal WinPercentage
);

public class GetCoachStatisticsQueryHandler : IRequestHandler<GetCoachStatisticsQuery, CoachStatisticsResponse>
{
    private readonly FutbolDbContext _context;

    public GetCoachStatisticsQueryHandler(FutbolDbContext context)
    {
        _context = context;
    }

    public async Task<CoachStatisticsResponse> Handle(GetCoachStatisticsQuery request, CancellationToken cancellationToken)
    {
        var coach = await _context.Coaches
            .Include(c => c.Country)
            .Include(c => c.TeamAssignments)
                .ThenInclude(ta => ta.Team)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == request.CoachId, cancellationToken);

        if (coach == null)
        {
            throw new NotFoundException("Coach", request.CoachId);
        }

        // Get all finished matches where the coach was involved
        var matchesQuery = _context.Matches
            .Include(m => m.HomeTeam)
            .Include(m => m.AwayTeam)
            .Include(m => m.Championship)
            .Where(m => m.Status == MatchStatus.Finished &&
                       (m.HomeCoachId == request.CoachId || m.AwayCoachId == request.CoachId));

        if (request.ChampionshipId.HasValue)
        {
            matchesQuery = matchesQuery.Where(m => m.ChampionshipId == request.ChampionshipId.Value);
        }

        var matches = await matchesQuery.AsNoTracking().ToListAsync(cancellationToken);

        var currentAssignment = coach.TeamAssignments
            .FirstOrDefault(ta => ta.EndDate == null);

        // Calculate totals
        int totalWins = 0, totalDraws = 0, totalLosses = 0, totalGoalsFor = 0, totalGoalsAgainst = 0;

        foreach (var match in matches)
        {
            bool isHome = match.HomeCoachId == request.CoachId;
            int teamGoals = isHome ? match.HomeScore : match.AwayScore;
            int opponentGoals = isHome ? match.AwayScore : match.HomeScore;

            totalGoalsFor += teamGoals;
            totalGoalsAgainst += opponentGoals;

            if (teamGoals > opponentGoals) totalWins++;
            else if (teamGoals == opponentGoals) totalDraws++;
            else totalLosses++;
        }

        var totalMatches = matches.Count;
        var totalPoints = totalWins * 3 + totalDraws;
        var totalPointsPercentage = totalMatches > 0 ? Math.Round((decimal)totalPoints / (totalMatches * 3) * 100, 1) : 0;

        List<CoachChampionshipStatsDto>? championshipStats = null;
        List<CoachTeamStatsDto>? teamStats = null;

        // Group by championship (only when no filter)
        if (!request.ChampionshipId.HasValue)
        {
            championshipStats = matches
                .GroupBy(m => new { m.ChampionshipId, m.Championship.Name, m.Championship.Season, m.Championship.Status })
                .Select(g =>
                {
                    int wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;

                    foreach (var match in g)
                    {
                        bool isHome = match.HomeCoachId == request.CoachId;
                        int teamGoals = isHome ? match.HomeScore : match.AwayScore;
                        int opponentGoals = isHome ? match.AwayScore : match.HomeScore;

                        goalsFor += teamGoals;
                        goalsAgainst += opponentGoals;

                        if (teamGoals > opponentGoals) wins++;
                        else if (teamGoals == opponentGoals) draws++;
                        else losses++;
                    }

                    var matchCount = g.Count();
                    var points = wins * 3 + draws;
                    var pointsPercentage = matchCount > 0 ? Math.Round((decimal)points / (matchCount * 3) * 100, 1) : 0;

                    return new
                    {
                        Stats = new CoachChampionshipStatsDto(
                            g.Key.ChampionshipId,
                            g.Key.Name,
                            g.Key.Season,
                            matchCount,
                            wins,
                            draws,
                            losses,
                            goalsFor,
                            goalsAgainst,
                            points,
                            pointsPercentage
                        ),
                        Status = g.Key.Status
                    };
                })
                .OrderByDescending(c => c.Status == ChampionshipStatus.InProgress)
                .ThenByDescending(c => c.Stats.Matches)
                .Select(c => c.Stats)
                .ToList();
        }

        // Group by team - based on actual matches, not assignment dates
        // This matches the logic used in GetTeamStatisticsQuery
        teamStats = new List<CoachTeamStatsDto>();

        // Get distinct teams from matches where this coach actually managed
        var teamsFromMatches = matches
            .Select(m => m.HomeCoachId == request.CoachId ? m.HomeTeamId : m.AwayTeamId)
            .Distinct()
            .ToList();

        // Get team info for these teams
        var teamsData = await _context.Teams
            .Where(t => teamsFromMatches.Contains(t.Id))
            .AsNoTracking()
            .ToDictionaryAsync(t => t.Id, cancellationToken);

        foreach (var teamId in teamsFromMatches)
        {
            if (!teamsData.TryGetValue(teamId, out var team)) continue;

            var teamMatches = matches.Where(m =>
            {
                bool isHome = m.HomeTeamId == teamId;
                var coachId = isHome ? m.HomeCoachId : m.AwayCoachId;
                return coachId == request.CoachId;
            }).ToList();

            if (teamMatches.Count == 0) continue;

            int wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;

            foreach (var match in teamMatches)
            {
                bool isHome = match.HomeTeamId == teamId;
                int teamGoals = isHome ? match.HomeScore : match.AwayScore;
                int opponentGoals = isHome ? match.AwayScore : match.HomeScore;

                goalsFor += teamGoals;
                goalsAgainst += opponentGoals;

                if (teamGoals > opponentGoals) wins++;
                else if (teamGoals == opponentGoals) draws++;
                else losses++;
            }

            var matchCount = teamMatches.Count;
            var points = wins * 3 + draws;
            var pointsPercentage = matchCount > 0 ? Math.Round((decimal)points / (matchCount * 3) * 100, 1) : 0;

            // Get assignment info for dates (if exists)
            var assignment = coach.TeamAssignments.FirstOrDefault(ta => ta.TeamId == teamId);
            var firstMatchDate = teamMatches.OrderBy(m => m.MatchDate).First().MatchDate;
            var lastMatchDate = teamMatches.OrderByDescending(m => m.MatchDate).First().MatchDate;

            teamStats.Add(new CoachTeamStatsDto(
                teamId,
                team.Name,
                team.LogoUrl,
                assignment?.StartDate ?? DateOnly.FromDateTime(firstMatchDate),
                assignment?.EndDate,
                assignment?.EndDate == null,
                matchCount,
                wins,
                draws,
                losses,
                goalsFor,
                goalsAgainst,
                points,
                pointsPercentage
            ));
        }

        // Sort by most recent first (based on match dates)
        teamStats = teamStats.OrderByDescending(t => t.IsCurrent).ThenByDescending(t => t.Matches).ToList();

        return new CoachStatisticsResponse(
            coach.Id,
            coach.FullName,
            coach.PhotoUrl,
            coach.Country?.Name,
            coach.Country?.FlagUrl,
            coach.BirthDate,
            currentAssignment?.Team.Name,
            currentAssignment?.Team.LogoUrl,
            totalMatches,
            totalWins,
            totalDraws,
            totalLosses,
            totalGoalsFor,
            totalGoalsAgainst,
            totalPointsPercentage,
            championshipStats,
            teamStats
        );
    }
}
