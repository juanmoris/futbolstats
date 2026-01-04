using FluentValidation;
using FutbolStats.Api.Common;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Championships.UpdateChampionship;

public record UpdateChampionshipCommand(
    Guid Id,
    string Name,
    string Season,
    DateOnly StartDate,
    DateOnly EndDate,
    ChampionshipStatus Status
) : IRequest<UpdateChampionshipResponse>;

public record UpdateChampionshipResponse(Guid Id, string Name, string Season);

public class UpdateChampionshipHandler(FutbolDbContext db)
    : IRequestHandler<UpdateChampionshipCommand, UpdateChampionshipResponse>
{
    public async Task<UpdateChampionshipResponse> Handle(
        UpdateChampionshipCommand request,
        CancellationToken cancellationToken)
    {
        var championship = await db.Championships
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Championship", request.Id);

        championship.Name = request.Name;
        championship.Season = request.Season;
        championship.StartDate = request.StartDate;
        championship.EndDate = request.EndDate;
        championship.Status = request.Status;

        await db.SaveChangesAsync(cancellationToken);

        return new UpdateChampionshipResponse(championship.Id, championship.Name, championship.Season);
    }
}

public class UpdateChampionshipValidator : AbstractValidator<UpdateChampionshipCommand>
{
    public UpdateChampionshipValidator(FutbolDbContext db)
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El Id es requerido");

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
                !await db.Championships.AnyAsync(c =>
                    c.Name == cmd.Name && c.Season == cmd.Season && c.Id != cmd.Id, ct))
            .WithMessage("Ya existe un campeonato con este nombre y temporada");
    }
}
