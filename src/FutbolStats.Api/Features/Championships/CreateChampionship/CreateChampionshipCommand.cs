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
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters");

        RuleFor(x => x.Season)
            .NotEmpty().WithMessage("Season is required")
            .MaximumLength(20).WithMessage("Season must not exceed 20 characters")
            .Matches(@"^\d{4}-\d{4}$").WithMessage("Season must be in format YYYY-YYYY (e.g., 2024-2025)");

        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage("Start date is required");

        RuleFor(x => x.EndDate)
            .NotEmpty().WithMessage("End date is required")
            .GreaterThan(x => x.StartDate).WithMessage("End date must be after start date");

        RuleFor(x => x)
            .MustAsync(async (cmd, ct) =>
                !await db.Championships.AnyAsync(c => c.Name == cmd.Name && c.Season == cmd.Season, ct))
            .WithMessage("A championship with this name and season already exists");
    }
}
