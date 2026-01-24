using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Countries.DeleteCountry;

public record DeleteCountryCommand(Guid Id) : IRequest;

public class DeleteCountryHandler(FutbolDbContext db)
    : IRequestHandler<DeleteCountryCommand>
{
    public async Task Handle(DeleteCountryCommand request, CancellationToken cancellationToken)
    {
        var country = await db.Countries
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Country", request.Id);

        db.Countries.Remove(country);
        await db.SaveChangesAsync(cancellationToken);
    }
}
