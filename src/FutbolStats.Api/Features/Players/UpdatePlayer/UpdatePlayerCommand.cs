using FluentValidation;
using FutbolStats.Api.Common;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Players.UpdatePlayer;

public record UpdatePlayerCommand(
    Guid Id,
    string FirstName,
    string LastName,
    int Number,
    PlayerPosition Position,
    DateOnly? BirthDate,
    string? Nationality,
    string? PhotoUrl,
    Guid TeamId,
    bool IsActive
) : IRequest<UpdatePlayerResponse>;

public record UpdatePlayerResponse(Guid Id, string FullName, int Number, Guid TeamId);

public class UpdatePlayerHandler(FutbolDbContext db)
    : IRequestHandler<UpdatePlayerCommand, UpdatePlayerResponse>
{
    public async Task<UpdatePlayerResponse> Handle(
        UpdatePlayerCommand request,
        CancellationToken cancellationToken)
    {
        var player = await db.Players
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Player", request.Id);

        player.FirstName = request.FirstName;
        player.LastName = request.LastName;
        player.Number = request.Number;
        player.Position = request.Position;
        player.BirthDate = request.BirthDate;
        player.Nationality = request.Nationality;
        player.PhotoUrl = request.PhotoUrl;
        player.TeamId = request.TeamId;
        player.IsActive = request.IsActive;

        await db.SaveChangesAsync(cancellationToken);

        return new UpdatePlayerResponse(player.Id, player.FullName, player.Number, player.TeamId);
    }
}

public class UpdatePlayerValidator : AbstractValidator<UpdatePlayerCommand>
{
    public UpdatePlayerValidator(FutbolDbContext db)
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id is required");

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
                    p.IsActive &&
                    p.Id != cmd.Id, ct))
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
