using FutbolStats.Api.Common;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Matches.EndMatch;

public record EndMatchCommand(Guid MatchId) : IRequest<EndMatchResponse>;

public record EndMatchResponse(Guid Id, MatchStatus Status, int HomeScore, int AwayScore);

public class EndMatchHandler(FutbolDbContext db)
    : IRequestHandler<EndMatchCommand, EndMatchResponse>
{
    public async Task<EndMatchResponse> Handle(
        EndMatchCommand request,
        CancellationToken cancellationToken)
    {
        var match = await db.Matches
            .FirstOrDefaultAsync(m => m.Id == request.MatchId, cancellationToken)
            ?? throw new NotFoundException("Match", request.MatchId);

        if (match.Status != MatchStatus.Live && match.Status != MatchStatus.HalfTime)
        {
            throw new InvalidOperationException(
                $"Cannot end match. Current status: {match.Status}");
        }

        match.Status = MatchStatus.Finished;
        match.CurrentMinute = 90;

        // Update championship standings
        await UpdateStandingsAsync(match, cancellationToken);

        await db.SaveChangesAsync(cancellationToken);

        return new EndMatchResponse(match.Id, match.Status, match.HomeScore, match.AwayScore);
    }

    private async Task UpdateStandingsAsync(Entities.Match match, CancellationToken cancellationToken)
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
            return; // Teams not in championship standings
        }

        // Update games played
        homeTeamStanding.GamesPlayed++;
        awayTeamStanding.GamesPlayed++;

        // Update goals
        homeTeamStanding.GoalsFor += match.HomeScore;
        homeTeamStanding.GoalsAgainst += match.AwayScore;
        awayTeamStanding.GoalsFor += match.AwayScore;
        awayTeamStanding.GoalsAgainst += match.HomeScore;

        // Update wins/draws/losses and points
        if (match.HomeScore > match.AwayScore)
        {
            // Home team wins
            homeTeamStanding.Wins++;
            homeTeamStanding.Points += 3;
            awayTeamStanding.Losses++;
        }
        else if (match.AwayScore > match.HomeScore)
        {
            // Away team wins
            awayTeamStanding.Wins++;
            awayTeamStanding.Points += 3;
            homeTeamStanding.Losses++;
        }
        else
        {
            // Draw
            homeTeamStanding.Draws++;
            homeTeamStanding.Points += 1;
            awayTeamStanding.Draws++;
            awayTeamStanding.Points += 1;
        }
    }
}
