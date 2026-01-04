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
            .NotEmpty().WithMessage("Id is required");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters")
            .MustAsync(async (cmd, name, ct) =>
                !await db.Teams.AnyAsync(t => t.Name == name && t.Id != cmd.Id, ct))
            .WithMessage("A team with this name already exists");

        RuleFor(x => x.ShortName)
            .NotEmpty().WithMessage("Short name is required")
            .MaximumLength(5).WithMessage("Short name must not exceed 5 characters")
            .MustAsync(async (cmd, shortName, ct) =>
                !await db.Teams.AnyAsync(t =>
                    t.ShortName == shortName.ToUpperInvariant() && t.Id != cmd.Id, ct))
            .WithMessage("A team with this short name already exists");

        RuleFor(x => x.LogoUrl)
            .MaximumLength(500).WithMessage("Logo URL must not exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.LogoUrl));

        RuleFor(x => x.Stadium)
            .MaximumLength(200).WithMessage("Stadium must not exceed 200 characters")
            .When(x => !string.IsNullOrEmpty(x.Stadium));

        RuleFor(x => x.FoundedYear)
            .InclusiveBetween(1800, DateTime.UtcNow.Year)
            .WithMessage($"Founded year must be between 1800 and {DateTime.UtcNow.Year}")
            .When(x => x.FoundedYear.HasValue);
    }
}
