using FluentValidation;
using FutbolStats.Api.Common;
using FutbolStats.Api.Features.Players.Entities;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Players.CreatePlayer;

public record CreatePlayerCommand(
    string FirstName,
    string LastName,
    int Number,
    PlayerPosition Position,
    DateOnly? BirthDate,
    string? Nationality,
    string? PhotoUrl,
    Guid TeamId
) : IRequest<CreatePlayerResponse>;

public record CreatePlayerResponse(Guid Id, string FullName, int Number, Guid TeamId);

public class CreatePlayerHandler(FutbolDbContext db)
    : IRequestHandler<CreatePlayerCommand, CreatePlayerResponse>
{
    public async Task<CreatePlayerResponse> Handle(
        CreatePlayerCommand request,
        CancellationToken cancellationToken)
    {
        var player = new Player
        {
            Id = Guid.NewGuid(),
            FirstName = request.FirstName,
            LastName = request.LastName,
            Number = request.Number,
            Position = request.Position,
            BirthDate = request.BirthDate,
            Nationality = request.Nationality,
            PhotoUrl = request.PhotoUrl,
            TeamId = request.TeamId,
            IsActive = true
        };

        db.Players.Add(player);
        await db.SaveChangesAsync(cancellationToken);

        return new CreatePlayerResponse(player.Id, player.FullName, player.Number, player.TeamId);
    }
}

public class CreatePlayerValidator : AbstractValidator<CreatePlayerCommand>
{
    public CreatePlayerValidator(FutbolDbContext db)
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required")
            .MaximumLength(100).WithMessage("First name must not exceed 100 characters");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required")
            .MaximumLength(100).WithMessage("Last name must not exceed 100 characters");

        RuleFor(x => x.Number)
            .InclusiveBetween(1, 99).WithMessage("Number must be between 1 and 99");

        RuleFor(x => x.Position)
            .IsInEnum().WithMessage("Invalid position");

        RuleFor(x => x.TeamId)
            .NotEmpty().WithMessage("Team is required")
            .MustAsync(async (teamId, ct) => await db.Teams.AnyAsync(t => t.Id == teamId, ct))
            .WithMessage("Team does not exist");

        RuleFor(x => x)
            .MustAsync(async (cmd, ct) =>
                !await db.Players.AnyAsync(p =>
                    p.TeamId == cmd.TeamId &&
                    p.Number == cmd.Number &&
                    p.IsActive, ct))
            .WithMessage("A player with this number already exists in the team");

        RuleFor(x => x.BirthDate)
            .LessThan(DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("Birth date must be in the past")
            .When(x => x.BirthDate.HasValue);

        RuleFor(x => x.Nationality)
            .MaximumLength(100).WithMessage("Nationality must not exceed 100 characters")
            .When(x => !string.IsNullOrEmpty(x.Nationality));

        RuleFor(x => x.PhotoUrl)
            .MaximumLength(500).WithMessage("Photo URL must not exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.PhotoUrl));
    }
}
