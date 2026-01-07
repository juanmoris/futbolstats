using FluentValidation;
using FutbolStats.Api.Features.Teams.Entities;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Teams.CreateTeam;

public record CreateTeamCommand(
    string Name,
    string ShortName,
    string? LogoUrl,
    int? FoundedYear,
    string? Stadium
) : IRequest<CreateTeamResponse>;

public record CreateTeamResponse(Guid Id, string Name, string ShortName);

public class CreateTeamHandler(FutbolDbContext db)
    : IRequestHandler<CreateTeamCommand, CreateTeamResponse>
{
    public async Task<CreateTeamResponse> Handle(
        CreateTeamCommand request,
        CancellationToken cancellationToken)
    {
        var team = new Team
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            ShortName = request.ShortName.ToUpperInvariant(),
            LogoUrl = request.LogoUrl,
            FoundedYear = request.FoundedYear,
            Stadium = request.Stadium
        };

        db.Teams.Add(team);
        await db.SaveChangesAsync(cancellationToken);

        return new CreateTeamResponse(team.Id, team.Name, team.ShortName);
    }
}

public class CreateTeamValidator : AbstractValidator<CreateTeamCommand>
{
    public CreateTeamValidator(FutbolDbContext db)
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("El nombre es requerido")
            .MaximumLength(200).WithMessage("El nombre no debe exceder 200 caracteres")
            .MustAsync(async (name, ct) => !await db.Teams.AnyAsync(t => t.Name == name, ct))
            .WithMessage("Ya existe un equipo con este nombre");

        RuleFor(x => x.ShortName)
            .NotEmpty().WithMessage("La abreviatura es requerida")
            .MaximumLength(5).WithMessage("La abreviatura no debe exceder 5 caracteres")
            .MustAsync(async (shortName, ct) =>
                !await db.Teams.AnyAsync(t => t.ShortName == shortName.ToUpperInvariant(), ct))
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
