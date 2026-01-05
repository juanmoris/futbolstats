using FutbolStats.Api.Common;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Championships.RecalculateStandings;

public record RecalculateStandingsCommand(Guid ChampionshipId) : IRequest<RecalculateStandingsResponse>;

public record RecalculateStandingsResponse(int TeamsUpdated, int MatchesProcessed);

public class RecalculateStandingsHandler(FutbolDbContext db)
    : IRequestHandler<RecalculateStandingsCommand, RecalculateStandingsResponse>
{
    public async Task<RecalculateStandingsResponse> Handle(
        RecalculateStandingsCommand request,
        CancellationToken cancellationToken)
    {
        var championship = await db.Championships
            .Include(c => c.Teams)
            .FirstOrDefaultAsync(c => c.Id == request.ChampionshipId, cancellationToken)
            ?? throw new NotFoundException("Championship", request.ChampionshipId);

        // Reset all team standings
        foreach (var team in championship.Teams)
        {
            team.Points = 0;
            team.GamesPlayed = 0;
            team.Wins = 0;
            team.Draws = 0;
            team.Losses = 0;
            team.GoalsFor = 0;
            team.GoalsAgainst = 0;
        }

        // Get all finished matches for this championship
        var finishedMatches = await db.Matches
            .Where(m => m.ChampionshipId == request.ChampionshipId && m.Status == MatchStatus.Finished)
            .ToListAsync(cancellationToken);

        // Recalculate standings from finished matches
        foreach (var match in finishedMatches)
        {
            var homeTeam = championship.Teams.FirstOrDefault(t => t.TeamId == match.HomeTeamId);
            var awayTeam = championship.Teams.FirstOrDefault(t => t.TeamId == match.AwayTeamId);

            if (homeTeam == null || awayTeam == null)
            {
                continue;
            }

            // Update games played
            homeTeam.GamesPlayed++;
            awayTeam.GamesPlayed++;

            // Update goals
            homeTeam.GoalsFor += match.HomeScore;
            homeTeam.GoalsAgainst += match.AwayScore;
            awayTeam.GoalsFor += match.AwayScore;
            awayTeam.GoalsAgainst += match.HomeScore;

            // Update wins/draws/losses and points
            if (match.HomeScore > match.AwayScore)
            {
                homeTeam.Wins++;
                homeTeam.Points += 3;
                awayTeam.Losses++;
            }
            else if (match.AwayScore > match.HomeScore)
            {
                awayTeam.Wins++;
                awayTeam.Points += 3;
                homeTeam.Losses++;
            }
            else
            {
                homeTeam.Draws++;
                homeTeam.Points += 1;
                awayTeam.Draws++;
                awayTeam.Points += 1;
            }
        }

        await db.SaveChangesAsync(cancellationToken);

        return new RecalculateStandingsResponse(championship.Teams.Count, finishedMatches.Count);
    }
}
