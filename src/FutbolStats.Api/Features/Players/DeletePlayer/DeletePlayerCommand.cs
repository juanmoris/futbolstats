using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Players.DeletePlayer;

public record DeletePlayerCommand(Guid Id) : IRequest;

public class DeletePlayerHandler(FutbolDbContext db)
    : IRequestHandler<DeletePlayerCommand>
{
    public async Task Handle(DeletePlayerCommand request, CancellationToken cancellationToken)
    {
        var player = await db.Players
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Player", request.Id);

        // Soft delete - just mark as inactive
        player.IsActive = false;
        await db.SaveChangesAsync(cancellationToken);
    }
}
