using FluentValidation;
using FutbolStats.Api.Common;
using FutbolStats.Api.Features.Championships.Entities;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Championships.CreateChampionship;

public record CreateChampionshipCommand(
    string Name,
    string Season,
    DateOnly StartDate,
    DateOnly EndDate
) : IRequest<CreateChampionshipResponse>;

public record CreateChampionshipResponse(Guid Id, string Name, string Season);

public class CreateChampionshipHandler(FutbolDbContext db)
    : IRequestHandler<CreateChampionshipCommand, CreateChampionshipResponse>
{
    public async Task<CreateChampionshipResponse> Handle(
        CreateChampionshipCommand request,
        CancellationToken cancellationToken)
    {
        var championship = new Championship
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Season = request.Season,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Status = ChampionshipStatus.Upcoming
        };

        db.Championships.Add(championship);
        await db.SaveChangesAsync(cancellationToken);

        return new CreateChampionshipResponse(championship.Id, championship.Name, championship.Season);
    }
}

public class CreateChampionshipValidator : AbstractValidator<CreateChampionshipCommand>
{
    public CreateChampionshipValidator(FutbolDbContext db)
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("El nombre es requerido")
            .MaximumLength(200).WithMessage("El nombre no debe exceder 200 caracteres");

        RuleFor(x => x.Season)
            .NotEmpty().WithMessage("La temporada es requerida")
            .MaximumLength(20).WithMessage("La temporada no debe exceder 20 caracteres")
            .Matches(@"^\d{4}(-\d{4})?$").WithMessage("La temporada debe tener formato YYYY (ej: 2024) o YYYY-YYYY (ej: 2024-2025)");

        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage("La fecha de inicio es requerida");

        RuleFor(x => x.EndDate)
            .NotEmpty().WithMessage("La fecha de fin es requerida")
            .GreaterThan(x => x.StartDate).WithMessage("La fecha de fin debe ser posterior a la fecha de inicio");

        RuleFor(x => x)
            .MustAsync(async (cmd, ct) =>
                !await db.Championships.AnyAsync(c => c.Name == cmd.Name && c.Season == cmd.Season, ct))
            .WithMessage("Ya existe un campeonato con este nombre y temporada");
    }
}
