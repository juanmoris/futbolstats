using FluentValidation;
using FutbolStats.Api.Common;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Features.MatchEvents.Entities;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.MatchEvents.RecordGoal;

public record RecordGoalCommand(
    Guid MatchId,
    Guid ScorerId,
    Guid TeamId,
    int Minute,
    int? ExtraMinute,
    Guid? AssistPlayerId,
    bool IsOwnGoal = false,
    bool IsPenalty = false
) : IRequest<RecordGoalResponse>;

public record RecordGoalResponse(Guid EventId, int HomeScore, int AwayScore);

public class RecordGoalHandler(FutbolDbContext db)
    : IRequestHandler<RecordGoalCommand, RecordGoalResponse>
{
    public async Task<RecordGoalResponse> Handle(
        RecordGoalCommand request,
        CancellationToken cancellationToken)
    {
        var match = await db.Matches
            .FirstOrDefaultAsync(m => m.Id == request.MatchId, cancellationToken)
            ?? throw new NotFoundException("Match", request.MatchId);

        if (match.Status != MatchStatus.Live && match.Status != MatchStatus.HalfTime && match.Status != MatchStatus.Finished)
        {
            throw new InvalidOperationException("Solo se pueden registrar eventos en partidos en curso o finalizados");
        }

        // Save previous score if match is finished (for standings update)
        var wasFinished = match.Status == MatchStatus.Finished;
        var previousHomeScore = match.HomeScore;
        var previousAwayScore = match.AwayScore;

        // Determine event type
        var eventType = request.IsOwnGoal ? EventType.OwnGoal
            : request.IsPenalty ? EventType.PenaltyScored
            : EventType.Goal;

        // Create goal event
        var goalEvent = new MatchEvent
        {
            Id = Guid.NewGuid(),
            MatchId = request.MatchId,
            PlayerId = request.ScorerId,
            TeamId = request.TeamId,
            EventType = eventType,
            Minute = request.Minute,
            ExtraMinute = request.ExtraMinute,
            CreatedAt = DateTime.UtcNow
        };

        db.MatchEvents.Add(goalEvent);

        // Create assist event if exists and not own goal/penalty
        if (request.AssistPlayerId.HasValue && !request.IsOwnGoal && !request.IsPenalty)
        {
            var assistEvent = new MatchEvent
            {
                Id = Guid.NewGuid(),
                MatchId = request.MatchId,
                PlayerId = request.AssistPlayerId.Value,
                TeamId = request.TeamId,
                EventType = EventType.Assist,
                Minute = request.Minute,
                ExtraMinute = request.ExtraMinute,
                SecondPlayerId = request.ScorerId,
                CreatedAt = DateTime.UtcNow
            };
            db.MatchEvents.Add(assistEvent);
        }

        // Update score
        // For own goals, the scoring team is the opponent
        if (request.IsOwnGoal)
        {
            if (request.TeamId == match.HomeTeamId)
                match.AwayScore++;
            else
                match.HomeScore++;
        }
        else
        {
            if (request.TeamId == match.HomeTeamId)
                match.HomeScore++;
            else
                match.AwayScore++;
        }

        // Update standings if match was already finished
        if (wasFinished)
        {
            await UpdateStandingsAsync(match, previousHomeScore, previousAwayScore, cancellationToken);
        }

        await db.SaveChangesAsync(cancellationToken);

        return new RecordGoalResponse(goalEvent.Id, match.HomeScore, match.AwayScore);
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

public class RecordGoalValidator : AbstractValidator<RecordGoalCommand>
{
    public RecordGoalValidator(FutbolDbContext db)
    {
        RuleFor(x => x.MatchId)
            .NotEmpty().WithMessage("Match is required");

        RuleFor(x => x.ScorerId)
            .NotEmpty().WithMessage("Scorer is required")
            .MustAsync(async (id, ct) => await db.Players.AnyAsync(p => p.Id == id, ct))
            .WithMessage("Player does not exist");

        RuleFor(x => x.TeamId)
            .NotEmpty().WithMessage("Team is required");

        RuleFor(x => x.Minute)
            .InclusiveBetween(1, 120).WithMessage("Minute must be between 1 and 120");

        RuleFor(x => x.ExtraMinute)
            .InclusiveBetween(1, 15).WithMessage("Extra minute must be between 1 and 15")
            .When(x => x.ExtraMinute.HasValue);

        RuleFor(x => x.AssistPlayerId)
            .MustAsync(async (id, ct) => !id.HasValue || await db.Players.AnyAsync(p => p.Id == id, ct))
            .WithMessage("Assist player does not exist")
            .When(x => x.AssistPlayerId.HasValue);
    }
}
