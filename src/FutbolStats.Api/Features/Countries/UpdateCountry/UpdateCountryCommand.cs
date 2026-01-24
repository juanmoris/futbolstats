using FluentValidation;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Countries.UpdateCountry;

public record UpdateCountryCommand(
    Guid Id,
    string Name,
    string Code,
    string? FlagUrl
) : IRequest<UpdateCountryResponse>;

public record UpdateCountryResponse(Guid Id, string Name, string Code);

public class UpdateCountryHandler(FutbolDbContext db)
    : IRequestHandler<UpdateCountryCommand, UpdateCountryResponse>
{
    public async Task<UpdateCountryResponse> Handle(
        UpdateCountryCommand request,
        CancellationToken cancellationToken)
    {
        var country = await db.Countries
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Country", request.Id);

        country.Name = request.Name;
        country.Code = request.Code.ToUpperInvariant();
        country.FlagUrl = request.FlagUrl;

        await db.SaveChangesAsync(cancellationToken);

        return new UpdateCountryResponse(country.Id, country.Name, country.Code);
    }
}

public class UpdateCountryValidator : AbstractValidator<UpdateCountryCommand>
{
    public UpdateCountryValidator(FutbolDbContext db)
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El Id es requerido");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("El nombre es requerido")
            .MaximumLength(100).WithMessage("El nombre no debe exceder 100 caracteres")
            .MustAsync(async (cmd, name, ct) =>
                !await db.Countries.AnyAsync(c => c.Name == name && c.Id != cmd.Id, ct))
            .WithMessage("Ya existe un pais con este nombre");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("El codigo es requerido")
            .MaximumLength(3).WithMessage("El codigo no debe exceder 3 caracteres")
            .MustAsync(async (cmd, code, ct) =>
                !await db.Countries.AnyAsync(c =>
                    c.Code == code.ToUpperInvariant() && c.Id != cmd.Id, ct))
            .WithMessage("Ya existe un pais con este codigo");

        RuleFor(x => x.FlagUrl)
            .MaximumLength(500).WithMessage("La URL de la bandera no debe exceder 500 caracteres")
            .When(x => !string.IsNullOrEmpty(x.FlagUrl));
    }
}
