using FluentValidation;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Teams.UpdateTeam;

public record UpdateTeamCommand(
    Guid Id,
    string Name,
    string ShortName,
    string? LogoUrl,
    int? FoundedYear,
    string? Stadium
) : IRequest<UpdateTeamResponse>;

public record UpdateTeamResponse(Guid Id, string Name, string ShortName);

public class UpdateTeamHandler(FutbolDbContext db)
    : IRequestHandler<UpdateTeamCommand, UpdateTeamResponse>
{
    public async Task<UpdateTeamResponse> Handle(
        UpdateTeamCommand request,
        CancellationToken cancellationToken)
    {
        var team = await db.Teams
            .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Team", request.Id);

        team.Name = request.Name;
        team.ShortName = request.ShortName.ToUpperInvariant();
        team.LogoUrl = request.LogoUrl;
        team.FoundedYear = request.FoundedYear;
        team.Stadium = request.Stadium;

        await db.SaveChangesAsync(cancellationToken);

        return new UpdateTeamResponse(team.Id, team.Name, team.ShortName);
    }
}

public class UpdateTeamValidator : AbstractValidator<UpdateTeamCommand>
{
    public UpdateTeamValidator(FutbolDbContext db)
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El Id es requerido");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("El nombre es requerido")
            .MaximumLength(200).WithMessage("El nombre no debe exceder 200 caracteres")
            .MustAsync(async (cmd, name, ct) =>
                !await db.Teams.AnyAsync(t => t.Name == name && t.Id != cmd.Id, ct))
            .WithMessage("Ya existe un equipo con este nombre");

        RuleFor(x => x.ShortName)
            .NotEmpty().WithMessage("La abreviatura es requerida")
            .MaximumLength(5).WithMessage("La abreviatura no debe exceder 5 caracteres")
            .MustAsync(async (cmd, shortName, ct) =>
                !await db.Teams.AnyAsync(t =>
                    t.ShortName == shortName.ToUpperInvariant() && t.Id != cmd.Id, ct))
            .WithMessage("Ya existe un equipo con esta abreviatura");

        RuleFor(x => x.LogoUrl)
            .MaximumLength(500).WithMessage("La URL del logo no debe exceder 500 caracteres")
            .When(x => !string.IsNullOrEmpty(x.LogoUrl));

        RuleFor(x => x.Stadium)
            .MaximumLength(200).WithMessage("El estadio no debe exceder 200 caracteres")
            .When(x => !string.IsNullOrEmpty(x.Stadium));

        RuleFor(x => x.FoundedYear)
            .InclusiveBetween(1800, DateTime.UtcNow.Year)
            .WithMessage($"El año de fundación debe estar entre 1800 y {DateTime.UtcNow.Year}")
            .When(x => x.FoundedYear.HasValue);
    }
}
