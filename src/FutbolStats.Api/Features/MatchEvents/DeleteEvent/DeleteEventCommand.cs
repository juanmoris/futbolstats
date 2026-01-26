using FutbolStats.Api.Common;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.MatchEvents.DeleteEvent;

public record DeleteEventCommand(Guid MatchId, Guid EventId) : IRequest;

public class DeleteEventHandler(FutbolDbContext db)
    : IRequestHandler<DeleteEventCommand>
{
    public async Task Handle(DeleteEventCommand request, CancellationToken cancellationToken)
    {
        var matchEvent = await db.MatchEvents
            .Include(e => e.Match)
            .FirstOrDefaultAsync(e => e.Id == request.EventId && e.MatchId == request.MatchId, cancellationToken)
            ?? throw new NotFoundException("Event", request.EventId);

        var match = matchEvent.Match;

        // Save previous score if match is finished (for standings update)
        var wasFinished = match.Status == MatchStatus.Finished;
        var previousHomeScore = match.HomeScore;
        var previousAwayScore = match.AwayScore;

        // Revert score if it was a goal
        if (matchEvent.EventType == EventType.Goal ||
            matchEvent.EventType == EventType.PenaltyScored)
        {
            if (matchEvent.TeamId == match.HomeTeamId)
                match.HomeScore--;
            else
                match.AwayScore--;
        }
        else if (matchEvent.EventType == EventType.OwnGoal)
        {
            // Own goal scored for the opposing team
            if (matchEvent.TeamId == match.HomeTeamId)
                match.AwayScore--;
            else
                match.HomeScore--;
        }

        // Update standings if match was already finished and score changed
        if (wasFinished && (match.HomeScore != previousHomeScore || match.AwayScore != previousAwayScore))
        {
            await UpdateStandingsAsync(match, previousHomeScore, previousAwayScore, cancellationToken);
        }

        db.MatchEvents.Remove(matchEvent);
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task UpdateStandingsAsync(
        Matches.Entities.Match match,
        int previousHomeScore,
        int previousAwayScore,
        CancellationToken cancellationToken)
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

        // Revert previous result
        RevertMatchResult(homeTeamStanding, awayTeamStanding, previousHomeScore, previousAwayScore);

        // Apply new result
        ApplyMatchResult(homeTeamStanding, awayTeamStanding, match.HomeScore, match.AwayScore);
    }

    private static void RevertMatchResult(
        Championships.Entities.ChampionshipTeam homeTeam,
        Championships.Entities.ChampionshipTeam awayTeam,
        int homeScore,
        int awayScore)
    {
        // Revert goals
        homeTeam.GoalsFor -= homeScore;
        homeTeam.GoalsAgainst -= awayScore;
        awayTeam.GoalsFor -= awayScore;
        awayTeam.GoalsAgainst -= homeScore;

        // Revert result
        if (homeScore > awayScore)
        {
            homeTeam.Wins--;
            homeTeam.Points -= 3;
            awayTeam.Losses--;
        }
        else if (awayScore > homeScore)
        {
            awayTeam.Wins--;
            awayTeam.Points -= 3;
            homeTeam.Losses--;
        }
        else
        {
            homeTeam.Draws--;
            homeTeam.Points -= 1;
            awayTeam.Draws--;
            awayTeam.Points -= 1;
        }
    }

    private static void ApplyMatchResult(
        Championships.Entities.ChampionshipTeam homeTeam,
        Championships.Entities.ChampionshipTeam awayTeam,
        int homeScore,
        int awayScore)
    {
        // Apply goals
        homeTeam.GoalsFor += homeScore;
        homeTeam.GoalsAgainst += awayScore;
        awayTeam.GoalsFor += awayScore;
        awayTeam.GoalsAgainst += homeScore;

        // Apply result
        if (homeScore > awayScore)
        {
            homeTeam.Wins++;
            homeTeam.Points += 3;
            awayTeam.Losses++;
        }
        else if (awayScore > homeScore)
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
}
