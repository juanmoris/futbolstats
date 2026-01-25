using FluentValidation;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Coaches.UpdateCoach;

public record UpdateCoachCommand(
    Guid Id,
    string FirstName,
    string LastName,
    Guid? CountryId,
    string? PhotoUrl,
    DateOnly? BirthDate
) : IRequest<UpdateCoachResponse>;

public record UpdateCoachResponse(Guid Id, string FullName);

public class UpdateCoachHandler(FutbolDbContext db)
    : IRequestHandler<UpdateCoachCommand, UpdateCoachResponse>
{
    public async Task<UpdateCoachResponse> Handle(
        UpdateCoachCommand request,
        CancellationToken cancellationToken)
    {
        var coach = await db.Coaches
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Coach", request.Id);

        coach.FirstName = request.FirstName;
        coach.LastName = request.LastName;
        coach.CountryId = request.CountryId;
        coach.PhotoUrl = request.PhotoUrl;
        coach.BirthDate = request.BirthDate;

        await db.SaveChangesAsync(cancellationToken);

        return new UpdateCoachResponse(coach.Id, coach.FullName);
    }
}

public class UpdateCoachValidator : AbstractValidator<UpdateCoachCommand>
{
    public UpdateCoachValidator(FutbolDbContext db)
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El Id es requerido");

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("El nombre es requerido")
            .MaximumLength(100).WithMessage("El nombre no debe exceder 100 caracteres");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("El apellido es requerido")
            .MaximumLength(100).WithMessage("El apellido no debe exceder 100 caracteres");

        RuleFor(x => x.CountryId)
            .MustAsync(async (countryId, ct) =>
                !countryId.HasValue || await db.Countries.AnyAsync(c => c.Id == countryId.Value, ct))
            .WithMessage("El país seleccionado no existe");

        RuleFor(x => x.PhotoUrl)
            .MaximumLength(500).WithMessage("La URL de foto no debe exceder 500 caracteres")
            .When(x => !string.IsNullOrEmpty(x.PhotoUrl));

        RuleFor(x => x.BirthDate)
            .LessThan(DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("La fecha de nacimiento debe ser en el pasado")
            .When(x => x.BirthDate.HasValue);
    }
}
