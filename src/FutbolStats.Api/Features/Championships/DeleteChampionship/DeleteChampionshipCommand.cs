using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Championships.DeleteChampionship;

public record DeleteChampionshipCommand(Guid Id) : IRequest;

public class DeleteChampionshipHandler(FutbolDbContext db)
    : IRequestHandler<DeleteChampionshipCommand>
{
    public async Task Handle(DeleteChampionshipCommand request, CancellationToken cancellationToken)
    {
        var championship = await db.Championships
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Championship", request.Id);

        db.Championships.Remove(championship);
        await db.SaveChangesAsync(cancellationToken);
    }
}
