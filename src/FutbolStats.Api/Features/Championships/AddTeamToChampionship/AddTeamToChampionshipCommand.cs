using FluentValidation;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Features.Championships.Entities;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Championships.AddTeamToChampionship;

public record AddTeamToChampionshipCommand(
    Guid ChampionshipId,
    Guid TeamId
) : IRequest<AddTeamToChampionshipResponse>;

public record AddTeamToChampionshipResponse(Guid ChampionshipId, Guid TeamId, string TeamName);

public class AddTeamToChampionshipHandler(FutbolDbContext db)
    : IRequestHandler<AddTeamToChampionshipCommand, AddTeamToChampionshipResponse>
{
    public async Task<AddTeamToChampionshipResponse> Handle(
        AddTeamToChampionshipCommand request,
        CancellationToken cancellationToken)
    {
        var championship = await db.Championships
            .FirstOrDefaultAsync(c => c.Id == request.ChampionshipId, cancellationToken)
            ?? throw new NotFoundException("Campeonato", request.ChampionshipId);

        var team = await db.Teams
            .FirstOrDefaultAsync(t => t.Id == request.TeamId, cancellationToken)
            ?? throw new NotFoundException("Equipo", request.TeamId);

        var championshipTeam = new ChampionshipTeam
        {
            Id = Guid.NewGuid(),
            ChampionshipId = request.ChampionshipId,
            TeamId = request.TeamId,
            Points = 0,
            GamesPlayed = 0,
            Wins = 0,
            Draws = 0,
            Losses = 0,
            GoalsFor = 0,
            GoalsAgainst = 0
        };

        db.ChampionshipTeams.Add(championshipTeam);
        await db.SaveChangesAsync(cancellationToken);

        return new AddTeamToChampionshipResponse(request.ChampionshipId, request.TeamId, team.Name);
    }
}

public class AddTeamToChampionshipValidator : AbstractValidator<AddTeamToChampionshipCommand>
{
    public AddTeamToChampionshipValidator(FutbolDbContext db)
    {
        RuleFor(x => x.ChampionshipId)
            .NotEmpty().WithMessage("El Id del campeonato es requerido");

        RuleFor(x => x.TeamId)
            .NotEmpty().WithMessage("El Id del equipo es requerido");

        RuleFor(x => x)
            .MustAsync(async (cmd, ct) =>
                !await db.ChampionshipTeams.AnyAsync(ct =>
                    ct.ChampionshipId == cmd.ChampionshipId && ct.TeamId == cmd.TeamId, ct))
            .WithMessage("El equipo ya está registrado en este campeonato");
    }
}
