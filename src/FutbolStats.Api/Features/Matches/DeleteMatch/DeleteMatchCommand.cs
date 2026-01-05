using FutbolStats.Api.Common;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Features.Matches.Entities;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Matches.DeleteMatch;

public record DeleteMatchCommand(Guid Id) : IRequest;

public class DeleteMatchHandler(FutbolDbContext db)
    : IRequestHandler<DeleteMatchCommand>
{
    public async Task Handle(
        DeleteMatchCommand request,
        CancellationToken cancellationToken)
    {
        var match = await db.Matches
            .Include(m => m.Events)
            .Include(m => m.Lineups)
            .FirstOrDefaultAsync(m => m.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Match", request.Id);

        if (match.Status == MatchStatus.Live || match.Status == MatchStatus.HalfTime)
        {
            throw new InvalidOperationException("No se puede eliminar un partido en curso");
        }

        // Revert standings if match was finished
        if (match.Status == MatchStatus.Finished)
        {
            await RevertStandingsAsync(match, cancellationToken);
        }

        // Remove related events and lineups
        db.MatchEvents.RemoveRange(match.Events);
        db.MatchLineups.RemoveRange(match.Lineups);
        db.Matches.Remove(match);

        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task RevertStandingsAsync(Match match, CancellationToken cancellationToken)
    {
        var homeTeamStanding = await db.ChampionshipTeams
            .FirstOrDefaultAsync(ct =>
                ct.ChampionshipId == match.ChampionshipId &&
                ct.TeamId == match.HomeTeamId, cancellationToken);

        var awayTeamStanding = await db.ChampionshipTeams
            .FirstOrDefaultAsync(ct =>
                ct.ChampionshipId == match.ChampionshipId &&
                ct.TeamId == match.AwayTeamId, cancellationToken);

        if (homeTeamStanding == null || awayTeamStanding == null)
        {
            return;
        }

        // Revert games played
        homeTeamStanding.GamesPlayed--;
        awayTeamStanding.GamesPlayed--;

        // Revert goals
        homeTeamStanding.GoalsFor -= match.HomeScore;
        homeTeamStanding.GoalsAgainst -= match.AwayScore;
        awayTeamStanding.GoalsFor -= match.AwayScore;
        awayTeamStanding.GoalsAgainst -= match.HomeScore;

        // Revert wins/draws/losses and points
        if (match.HomeScore > match.AwayScore)
        {
            // Home team won
            homeTeamStanding.Wins--;
            homeTeamStanding.Points -= 3;
            awayTeamStanding.Losses--;
        }
        else if (match.AwayScore > match.HomeScore)
        {
            // Away team won
            awayTeamStanding.Wins--;
            awayTeamStanding.Points -= 3;
            homeTeamStanding.Losses--;
        }
        else
        {
            // Draw
            homeTeamStanding.Draws--;
            homeTeamStanding.Points -= 1;
            awayTeamStanding.Draws--;
            awayTeamStanding.Points -= 1;
        }
    }
}
