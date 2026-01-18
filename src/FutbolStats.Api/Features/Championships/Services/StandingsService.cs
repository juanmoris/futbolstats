using FutbolStats.Api.Common;
using FutbolStats.Api.Features.Championships.Entities;
using FutbolStats.Api.Features.Matches.Entities;
using FutbolStats.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Championships.Services;

public class StandingsService : IStandingsService
{
    private readonly FutbolDbContext _context;

    public StandingsService(FutbolDbContext context)
    {
        _context = context;
    }

    public async Task<List<ChampionshipTeam>> GetSortedStandingsAsync(
        Guid championshipId,
        ICollection<ChampionshipTeam> teams,
        TiebreakerType tiebreakerType,
        CancellationToken cancellationToken)
    {
        var finishedMatches = await _context.Matches
            .Where(m => m.ChampionshipId == championshipId &&
                        m.Status == MatchStatus.Finished)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return tiebreakerType switch
        {
            TiebreakerType.HeadToHead => SortWithHeadToHeadFirst(teams.ToList(), finishedMatches),
            TiebreakerType.GoalDifference => SortWithGoalDifferenceFirst(teams.ToList()),
            _ => SortWithHeadToHeadFirst(teams.ToList(), finishedMatches)
        };
    }

    private List<ChampionshipTeam> SortWithHeadToHeadFirst(
        List<ChampionshipTeam> teams,
        List<Match> matches)
    {
        var sortedTeams = new List<ChampionshipTeam>();
        var pointGroups = teams.GroupBy(t => t.Points)
                               .OrderByDescending(g => g.Key);

        foreach (var group in pointGroups)
        {
            if (group.Count() == 1)
            {
                sortedTeams.Add(group.First());
            }
            else
            {
                var tiedTeams = group.ToList();
                var tiedTeamIds = tiedTeams.Select(t => t.TeamId).ToHashSet();

                var sorted = tiedTeams
                    .OrderByDescending(t => GetHeadToHeadWins(t.TeamId, tiedTeamIds, matches))
                    .ThenByDescending(t => GetHeadToHeadGoalDiff(t.TeamId, tiedTeamIds, matches))
                    .ThenByDescending(t => t.GoalDifference)
                    .ThenByDescending(t => t.GoalsFor)
                    .ThenBy(t => t.Team.Name);

                sortedTeams.AddRange(sorted);
            }
        }

        return sortedTeams;
    }

    private static List<ChampionshipTeam> SortWithGoalDifferenceFirst(List<ChampionshipTeam> teams)
    {
        return teams
            .OrderByDescending(t => t.Points)
            .ThenByDescending(t => t.GoalDifference)
            .ThenByDescending(t => t.GoalsFor)
            .ThenBy(t => t.Team.Name)
            .ToList();
    }

    private static int GetHeadToHeadWins(Guid teamId, HashSet<Guid> tiedTeamIds, List<Match> matches)
    {
        int wins = 0;
        foreach (var match in matches)
        {
            if (match.HomeTeamId == teamId && tiedTeamIds.Contains(match.AwayTeamId))
            {
                if (match.HomeScore > match.AwayScore) wins++;
            }
            else if (match.AwayTeamId == teamId && tiedTeamIds.Contains(match.HomeTeamId))
            {
                if (match.AwayScore > match.HomeScore) wins++;
            }
        }
        return wins;
    }

    private static int GetHeadToHeadGoalDiff(Guid teamId, HashSet<Guid> tiedTeamIds, List<Match> matches)
    {
        int diff = 0;
        foreach (var match in matches)
        {
            if (match.HomeTeamId == teamId && tiedTeamIds.Contains(match.AwayTeamId))
            {
                diff += match.HomeScore - match.AwayScore;
            }
            else if (match.AwayTeamId == teamId && tiedTeamIds.Contains(match.HomeTeamId))
            {
                diff += match.AwayScore - match.HomeScore;
            }
        }
        return diff;
    }
}
