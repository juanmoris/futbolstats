using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Teams.DeleteTeam;

public record DeleteTeamCommand(Guid Id) : IRequest;

public class DeleteTeamHandler(FutbolDbContext db)
    : IRequestHandler<DeleteTeamCommand>
{
    public async Task Handle(DeleteTeamCommand request, CancellationToken cancellationToken)
    {
        var team = await db.Teams
            .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Team", request.Id);

        db.Teams.Remove(team);
        await db.SaveChangesAsync(cancellationToken);
    }
}
