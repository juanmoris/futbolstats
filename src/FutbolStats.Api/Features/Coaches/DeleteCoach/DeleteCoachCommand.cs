using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Coaches.DeleteCoach;

public record DeleteCoachCommand(Guid Id) : IRequest;

public class DeleteCoachHandler(FutbolDbContext db)
    : IRequestHandler<DeleteCoachCommand>
{
    public async Task Handle(DeleteCoachCommand request, CancellationToken cancellationToken)
    {
        var coach = await db.Coaches
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Coach", request.Id);

        db.Coaches.Remove(coach);
        await db.SaveChangesAsync(cancellationToken);
    }
}
