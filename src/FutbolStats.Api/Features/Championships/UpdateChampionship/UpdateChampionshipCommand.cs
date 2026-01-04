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
            .NotEmpty().WithMessage("Id is required");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters");

        RuleFor(x => x.Season)
            .NotEmpty().WithMessage("Season is required")
            .MaximumLength(20).WithMessage("Season must not exceed 20 characters")
            .Matches(@"^\d{4}-\d{4}$").WithMessage("Season must be in format YYYY-YYYY");

        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage("Start date is required");

        RuleFor(x => x.EndDate)
            .NotEmpty().WithMessage("End date is required")
            .GreaterThan(x => x.StartDate).WithMessage("End date must be after start date");

        RuleFor(x => x)
            .MustAsync(async (cmd, ct) =>
                !await db.Championships.AnyAsync(c =>
                    c.Name == cmd.Name && c.Season == cmd.Season && c.Id != cmd.Id, ct))
            .WithMessage("A championship with this name and season already exists");
    }
}
