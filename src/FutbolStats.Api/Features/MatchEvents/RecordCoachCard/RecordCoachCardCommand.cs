using FluentValidation;
using FutbolStats.Api.Common;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Features.MatchEvents.Entities;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.MatchEvents.RecordCoachCard;

public record RecordCoachCardCommand(
    Guid MatchId,
    Guid CoachId,
    Guid TeamId,
    int Minute,
    int? ExtraMinute,
    bool IsRed,
    string? Reason
) : IRequest<RecordCoachCardResponse>;

public record RecordCoachCardResponse(Guid EventId, EventType CardType);

public class RecordCoachCardHandler(FutbolDbContext db)
    : IRequestHandler<RecordCoachCardCommand, RecordCoachCardResponse>
{
    public async Task<RecordCoachCardResponse> Handle(
        RecordCoachCardCommand request,
        CancellationToken cancellationToken)
    {
        var match = await db.Matches
            .Include(m => m.Events)
            .FirstOrDefaultAsync(m => m.Id == request.MatchId, cancellationToken)
            ?? throw new NotFoundException("Match", request.MatchId);

        if (match.Status != MatchStatus.Live && match.Status != MatchStatus.HalfTime && match.Status != MatchStatus.Finished)
        {
            throw new InvalidOperationException("Solo se pueden registrar eventos en partidos en curso o finalizados");
        }

        // Verify coach is assigned to this match
        if (match.HomeCoachId != request.CoachId && match.AwayCoachId != request.CoachId)
        {
            throw new InvalidOperationException("El entrenador no esta asignado a este partido");
        }

        EventType cardType = request.IsRed ? EventType.CoachRedCard : EventType.CoachYellowCard;

        var cardEvent = new MatchEvent
        {
            Id = Guid.NewGuid(),
            MatchId = request.MatchId,
            CoachId = request.CoachId,
            TeamId = request.TeamId,
            EventType = cardType,
            Minute = request.Minute,
            ExtraMinute = request.ExtraMinute,
            Description = request.Reason,
            CreatedAt = DateTime.UtcNow
        };

        db.MatchEvents.Add(cardEvent);
        await db.SaveChangesAsync(cancellationToken);

        return new RecordCoachCardResponse(cardEvent.Id, cardType);
    }
}

public class RecordCoachCardValidator : AbstractValidator<RecordCoachCardCommand>
{
    public RecordCoachCardValidator(FutbolDbContext db)
    {
        RuleFor(x => x.MatchId)
            .NotEmpty().WithMessage("Match is required");

        RuleFor(x => x.CoachId)
            .NotEmpty().WithMessage("Coach is required")
            .MustAsync(async (id, ct) => await db.Coaches.AnyAsync(c => c.Id == id, ct))
            .WithMessage("Coach does not exist");

        RuleFor(x => x.TeamId)
            .NotEmpty().WithMessage("Team is required");

        RuleFor(x => x.Minute)
            .InclusiveBetween(1, 120).WithMessage("Minute must be between 1 and 120");

        RuleFor(x => x.ExtraMinute)
            .InclusiveBetween(1, 15).WithMessage("Extra minute must be between 1 and 15")
            .When(x => x.ExtraMinute.HasValue);

        RuleFor(x => x.Reason)
            .MaximumLength(500).WithMessage("Reason must not exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.Reason));
    }
}
