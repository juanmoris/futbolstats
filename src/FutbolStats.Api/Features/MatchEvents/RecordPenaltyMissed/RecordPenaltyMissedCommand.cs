using FluentValidation;
using FutbolStats.Api.Common;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Features.MatchEvents.Entities;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.MatchEvents.RecordPenaltyMissed;

public record RecordPenaltyMissedCommand(
    Guid MatchId,
    Guid PlayerId,
    Guid TeamId,
    int Minute,
    int? ExtraMinute,
    string? Description
) : IRequest<RecordPenaltyMissedResponse>;

public record RecordPenaltyMissedResponse(Guid EventId);

public class RecordPenaltyMissedHandler(FutbolDbContext db)
    : IRequestHandler<RecordPenaltyMissedCommand, RecordPenaltyMissedResponse>
{
    public async Task<RecordPenaltyMissedResponse> Handle(
        RecordPenaltyMissedCommand request,
        CancellationToken cancellationToken)
    {
        var match = await db.Matches
            .FirstOrDefaultAsync(m => m.Id == request.MatchId, cancellationToken)
            ?? throw new NotFoundException("Match", request.MatchId);

        if (match.Status != MatchStatus.Live && match.Status != MatchStatus.HalfTime && match.Status != MatchStatus.Finished)
        {
            throw new InvalidOperationException("Solo se pueden registrar eventos en partidos en curso o finalizados");
        }

        var penaltyEvent = new MatchEvent
        {
            Id = Guid.NewGuid(),
            MatchId = request.MatchId,
            PlayerId = request.PlayerId,
            TeamId = request.TeamId,
            EventType = EventType.PenaltyMissed,
            Minute = request.Minute,
            ExtraMinute = request.ExtraMinute,
            Description = request.Description,
            CreatedAt = DateTime.UtcNow
        };

        db.MatchEvents.Add(penaltyEvent);
        await db.SaveChangesAsync(cancellationToken);

        return new RecordPenaltyMissedResponse(penaltyEvent.Id);
    }
}

public class RecordPenaltyMissedValidator : AbstractValidator<RecordPenaltyMissedCommand>
{
    public RecordPenaltyMissedValidator(FutbolDbContext db)
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

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.Description));
    }
}
