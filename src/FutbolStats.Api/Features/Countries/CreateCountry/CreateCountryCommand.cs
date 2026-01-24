using FluentValidation;
using FutbolStats.Api.Features.Countries.Entities;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Countries.CreateCountry;

public record CreateCountryCommand(
    string Name,
    string Code,
    string? FlagUrl
) : IRequest<CreateCountryResponse>;

public record CreateCountryResponse(Guid Id, string Name, string Code);

public class CreateCountryHandler(FutbolDbContext db)
    : IRequestHandler<CreateCountryCommand, CreateCountryResponse>
{
    public async Task<CreateCountryResponse> Handle(
        CreateCountryCommand request,
        CancellationToken cancellationToken)
    {
        var country = new Country
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Code = request.Code.ToUpperInvariant(),
            FlagUrl = request.FlagUrl
        };

        db.Countries.Add(country);
        await db.SaveChangesAsync(cancellationToken);

        return new CreateCountryResponse(country.Id, country.Name, country.Code);
    }
}

public class CreateCountryValidator : AbstractValidator<CreateCountryCommand>
{
    public CreateCountryValidator(FutbolDbContext db)
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("El nombre es requerido")
            .MaximumLength(100).WithMessage("El nombre no debe exceder 100 caracteres")
            .MustAsync(async (name, ct) => !await db.Countries.AnyAsync(c => c.Name == name, ct))
            .WithMessage("Ya existe un pais con este nombre");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("El codigo es requerido")
            .MaximumLength(3).WithMessage("El codigo no debe exceder 3 caracteres")
            .MustAsync(async (code, ct) =>
                !await db.Countries.AnyAsync(c => c.Code == code.ToUpperInvariant(), ct))
            .WithMessage("Ya existe un pais con este codigo");

        RuleFor(x => x.FlagUrl)
            .MaximumLength(500).WithMessage("La URL de la bandera no debe exceder 500 caracteres")
            .When(x => !string.IsNullOrEmpty(x.FlagUrl));
    }
}
