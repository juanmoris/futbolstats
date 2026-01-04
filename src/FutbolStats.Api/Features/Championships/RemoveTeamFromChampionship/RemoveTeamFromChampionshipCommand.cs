using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Championships.RemoveTeamFromChampionship;

public record RemoveTeamFromChampionshipCommand(
    Guid ChampionshipId,
    Guid TeamId
) : IRequest;

public class RemoveTeamFromChampionshipHandler(FutbolDbContext db)
    : IRequestHandler<RemoveTeamFromChampionshipCommand>
{
    public async Task Handle(
        RemoveTeamFromChampionshipCommand request,
        CancellationToken cancellationToken)
    {
        var championshipTeam = await db.ChampionshipTeams
            .FirstOrDefaultAsync(ct =>
                ct.ChampionshipId == request.ChampionshipId && ct.TeamId == request.TeamId, cancellationToken)
            ?? throw new NotFoundException("Equipo en campeonato", $"{request.ChampionshipId}/{request.TeamId}");

        db.ChampionshipTeams.Remove(championshipTeam);
        await db.SaveChangesAsync(cancellationToken);
    }
}
