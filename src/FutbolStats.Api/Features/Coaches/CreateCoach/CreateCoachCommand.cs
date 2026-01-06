using FluentValidation;
using FutbolStats.Api.Features.Coaches.Entities;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;

namespace FutbolStats.Api.Features.Coaches.CreateCoach;

public record CreateCoachCommand(
    string FirstName,
    string LastName,
    string? Nationality,
    string? PhotoUrl,
    DateOnly? BirthDate
) : IRequest<CreateCoachResponse>;

public record CreateCoachResponse(Guid Id, string FullName);

public class CreateCoachHandler(FutbolDbContext db)
    : IRequestHandler<CreateCoachCommand, CreateCoachResponse>
{
    public async Task<CreateCoachResponse> Handle(
        CreateCoachCommand request,
        CancellationToken cancellationToken)
    {
        var coach = new Coach
        {
            Id = Guid.NewGuid(),
            FirstName = request.FirstName,
            LastName = request.LastName,
            Nationality = request.Nationality,
            PhotoUrl = request.PhotoUrl,
            BirthDate = request.BirthDate
        };

        db.Coaches.Add(coach);
        await db.SaveChangesAsync(cancellationToken);

        return new CreateCoachResponse(coach.Id, coach.FullName);
    }
}

public class CreateCoachValidator : AbstractValidator<CreateCoachCommand>
{
    public CreateCoachValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("El nombre es requerido")
            .MaximumLength(100).WithMessage("El nombre no debe exceder 100 caracteres");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("El apellido es requerido")
            .MaximumLength(100).WithMessage("El apellido no debe exceder 100 caracteres");

        RuleFor(x => x.Nationality)
            .MaximumLength(100).WithMessage("La nacionalidad no debe exceder 100 caracteres")
            .When(x => !string.IsNullOrEmpty(x.Nationality));

        RuleFor(x => x.PhotoUrl)
            .MaximumLength(500).WithMessage("La URL de foto no debe exceder 500 caracteres")
            .When(x => !string.IsNullOrEmpty(x.PhotoUrl));

        RuleFor(x => x.BirthDate)
            .LessThan(DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("La fecha de nacimiento debe ser en el pasado")
            .When(x => x.BirthDate.HasValue);
    }
}
