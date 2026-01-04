using FluentValidation;
using FutbolStats.Api.Common;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Features.MatchEvents.Entities;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.MatchEvents.RecordCard;

public record RecordCardCommand(
    Guid MatchId,
    Guid PlayerId,
    Guid TeamId,
    int Minute,
    int? ExtraMinute,
    bool IsRed,
    string? Reason
) : IRequest<RecordCardResponse>;

public record RecordCardResponse(Guid EventId, EventType CardType);

public class RecordCardHandler(FutbolDbContext db)
    : IRequestHandler<RecordCardCommand, RecordCardResponse>
{
    public async Task<RecordCardResponse> Handle(
        RecordCardCommand request,
        CancellationToken cancellationToken)
    {
        var match = await db.Matches
            .Include(m => m.Events)
            .FirstOrDefaultAsync(m => m.Id == request.MatchId, cancellationToken)
            ?? throw new NotFoundException("Match", request.MatchId);

        if (match.Status != MatchStatus.Live && match.Status != MatchStatus.HalfTime)
        {
            throw new InvalidOperationException("Cannot record events for non-live matches");
        }

        // Check if this is a second yellow
        var hasYellowCard = match.Events.Any(e =>
            e.PlayerId == request.PlayerId &&
            e.EventType == EventType.YellowCard);

        EventType cardType;
        if (request.IsRed)
        {
            cardType = EventType.RedCard;
        }
        else if (hasYellowCard)
        {
            cardType = EventType.SecondYellow;
        }
        else
        {
            cardType = EventType.YellowCard;
        }

        var cardEvent = new MatchEvent
        {
            Id = Guid.NewGuid(),
            MatchId = request.MatchId,
            PlayerId = request.PlayerId,
            TeamId = request.TeamId,
            EventType = cardType,
            Minute = request.Minute,
            ExtraMinute = request.ExtraMinute,
            Description = request.Reason,
            CreatedAt = DateTime.UtcNow
        };

        db.MatchEvents.Add(cardEvent);
        await db.SaveChangesAsync(cancellationToken);

        return new RecordCardResponse(cardEvent.Id, cardType);
    }
}

public class RecordCardValidator : AbstractValidator<RecordCardCommand>
{
    public RecordCardValidator(FutbolDbContext db)
    {
        RuleFor(x => x.MatchId)
            .NotEmpty().WithMessage("Match is required");

        RuleFor(x => x.PlayerId)
            .NotEmpty().WithMessage("Player is required")
            .MustAsync(async (id, ct) => await db.Players.AnyAsync(p => p.Id == id, ct))
            .WithMessage("Player does not exist");

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
