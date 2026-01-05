using FluentValidation;
using FutbolStats.Api.Common;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Features.MatchEvents.Entities;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.MatchEvents.RecordSubstitution;

public record RecordSubstitutionCommand(
    Guid MatchId,
    Guid PlayerOutId,
    Guid PlayerInId,
    Guid TeamId,
    int Minute,
    int? ExtraMinute
) : IRequest<RecordSubstitutionResponse>;

public record RecordSubstitutionResponse(Guid SubOutEventId, Guid SubInEventId);

public class RecordSubstitutionHandler(FutbolDbContext db)
    : IRequestHandler<RecordSubstitutionCommand, RecordSubstitutionResponse>
{
    public async Task<RecordSubstitutionResponse> Handle(
        RecordSubstitutionCommand request,
        CancellationToken cancellationToken)
    {
        var match = await db.Matches
            .FirstOrDefaultAsync(m => m.Id == request.MatchId, cancellationToken)
            ?? throw new NotFoundException("Match", request.MatchId);

        if (match.Status != MatchStatus.Live && match.Status != MatchStatus.HalfTime && match.Status != MatchStatus.Finished)
        {
            throw new InvalidOperationException("Solo se pueden registrar eventos en partidos en curso o finalizados");
        }

        // Create substitution out event
        var subOutEvent = new MatchEvent
        {
            Id = Guid.NewGuid(),
            MatchId = request.MatchId,
            PlayerId = request.PlayerOutId,
            TeamId = request.TeamId,
            EventType = EventType.SubstitutionOut,
            Minute = request.Minute,
            ExtraMinute = request.ExtraMinute,
            SecondPlayerId = request.PlayerInId,
            CreatedAt = DateTime.UtcNow
        };

        // Create substitution in event
        var subInEvent = new MatchEvent
        {
            Id = Guid.NewGuid(),
            MatchId = request.MatchId,
            PlayerId = request.PlayerInId,
            TeamId = request.TeamId,
            EventType = EventType.SubstitutionIn,
            Minute = request.Minute,
            ExtraMinute = request.ExtraMinute,
            SecondPlayerId = request.PlayerOutId,
            CreatedAt = DateTime.UtcNow
        };

        db.MatchEvents.Add(subOutEvent);
        db.MatchEvents.Add(subInEvent);

        await db.SaveChangesAsync(cancellationToken);

        return new RecordSubstitutionResponse(subOutEvent.Id, subInEvent.Id);
    }
}

public class RecordSubstitutionValidator : AbstractValidator<RecordSubstitutionCommand>
{
    public RecordSubstitutionValidator(FutbolDbContext db)
    {
        RuleFor(x => x.MatchId)
            .NotEmpty().WithMessage("Match is required");

        RuleFor(x => x.PlayerOutId)
            .NotEmpty().WithMessage("Player out is required")
            .MustAsync(async (id, ct) => await db.Players.AnyAsync(p => p.Id == id, ct))
            .WithMessage("Player out does not exist");

        RuleFor(x => x.PlayerInId)
            .NotEmpty().WithMessage("Player in is required")
            .NotEqual(x => x.PlayerOutId).WithMessage("Player in and out must be different")
            .MustAsync(async (id, ct) => await db.Players.AnyAsync(p => p.Id == id, ct))
            .WithMessage("Player in does not exist");

        RuleFor(x => x.TeamId)
            .NotEmpty().WithMessage("Team is required");

        RuleFor(x => x.Minute)
            .InclusiveBetween(1, 120).WithMessage("Minute must be between 1 and 120");

        RuleFor(x => x.ExtraMinute)
            .InclusiveBetween(1, 15).WithMessage("Extra minute must be between 1 and 15")
            .When(x => x.ExtraMinute.HasValue);
    }
}
