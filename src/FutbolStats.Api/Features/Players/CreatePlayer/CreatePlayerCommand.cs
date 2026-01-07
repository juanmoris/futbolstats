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
            .NotEmpty().WithMessage("El nombre es requerido")
            .MaximumLength(100).WithMessage("El nombre no debe exceder 100 caracteres");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("El apellido es requerido")
            .MaximumLength(100).WithMessage("El apellido no debe exceder 100 caracteres");

        RuleFor(x => x.Number)
            .InclusiveBetween(1, 99).WithMessage("El número debe estar entre 1 y 99");

        RuleFor(x => x.Position)
            .IsInEnum().WithMessage("Posición inválida");

        RuleFor(x => x.TeamId)
            .NotEmpty().WithMessage("El equipo es requerido")
            .MustAsync(async (teamId, ct) => await db.Teams.AnyAsync(t => t.Id == teamId, ct))
            .WithMessage("El equipo no existe");

        RuleFor(x => x)
            .MustAsync(async (cmd, ct) =>
                !await db.Players.AnyAsync(p =>
                    p.TeamId == cmd.TeamId &&
                    p.Number == cmd.Number &&
                    p.IsActive, ct))
            .WithMessage("Ya existe un jugador con este número en el equipo");

        RuleFor(x => x.BirthDate)
            .LessThan(DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("La fecha de nacimiento debe ser en el pasado")
            .When(x => x.BirthDate.HasValue);

        RuleFor(x => x.Nationality)
            .MaximumLength(100).WithMessage("La nacionalidad no debe exceder 100 caracteres")
            .When(x => !string.IsNullOrEmpty(x.Nationality));

        RuleFor(x => x.PhotoUrl)
            .MaximumLength(500).WithMessage("La URL de la foto no debe exceder 500 caracteres")
            .When(x => !string.IsNullOrEmpty(x.PhotoUrl));
    }
}
