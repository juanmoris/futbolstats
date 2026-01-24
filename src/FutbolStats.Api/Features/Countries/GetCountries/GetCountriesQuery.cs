using FutbolStats.Api.Common.Models;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Countries.GetCountries;

public record GetCountriesQuery(
    int Page = 1,
    int PageSize = 100,
    string? Search = null
) : IRequest<PagedResult<CountryDto>>;

public record CountryDto(
    Guid Id,
    string Name,
    string Code,
    string? FlagUrl,
    int PlayersCount
);

public class GetCountriesHandler(FutbolDbContext db)
    : IRequestHandler<GetCountriesQuery, PagedResult<CountryDto>>
{
    public async Task<PagedResult<CountryDto>> Handle(
        GetCountriesQuery request,
        CancellationToken cancellationToken)
    {
        var query = db.Countries.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.ToLower();
            query = query.Where(c =>
                c.Name.ToLower().Contains(search) ||
                c.Code.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var pagination = new PaginationParams(request.Page, request.PageSize);

        var items = await query
            .OrderBy(c => c.Name)
            .Skip(pagination.Skip)
            .Take(pagination.PageSize)
            .Select(c => new CountryDto(
                c.Id,
                c.Name,
                c.Code,
                c.FlagUrl,
                c.Players.Count(p => p.IsActive)
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<CountryDto>(items, pagination.Page, pagination.PageSize, totalCount);
    }
}
