using FutbolStats.Api.Common.Exceptions;
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

        if (match.Status == Common.MatchStatus.Live || match.Status == Common.MatchStatus.HalfTime)
        {
            throw new InvalidOperationException("No se puede eliminar un partido en curso");
        }

        // Remove related events and lineups
        db.MatchEvents.RemoveRange(match.Events);
        db.MatchLineups.RemoveRange(match.Lineups);
        db.Matches.Remove(match);

        await db.SaveChangesAsync(cancellationToken);
    }
}
