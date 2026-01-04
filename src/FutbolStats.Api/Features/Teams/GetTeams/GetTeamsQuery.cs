using FutbolStats.Api.Common.Models;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Teams.GetTeams;

public record GetTeamsQuery(
    int Page = 1,
    int PageSize = 10,
    string? Search = null
) : IRequest<PagedResult<TeamDto>>;

public record TeamDto(
    Guid Id,
    string Name,
    string ShortName,
    string? LogoUrl,
    int? FoundedYear,
    string? Stadium,
    int PlayersCount
);

public class GetTeamsHandler(FutbolDbContext db)
    : IRequestHandler<GetTeamsQuery, PagedResult<TeamDto>>
{
    public async Task<PagedResult<TeamDto>> Handle(
        GetTeamsQuery request,
        CancellationToken cancellationToken)
    {
        var query = db.Teams.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.ToLower();
            query = query.Where(t =>
                t.Name.ToLower().Contains(search) ||
                t.ShortName.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var pagination = new PaginationParams(request.Page, request.PageSize);

        var items = await query
            .OrderBy(t => t.Name)
            .Skip(pagination.Skip)
            .Take(pagination.PageSize)
            .Select(t => new TeamDto(
                t.Id,
                t.Name,
                t.ShortName,
                t.LogoUrl,
                t.FoundedYear,
                t.Stadium,
                t.Players.Count(p => p.IsActive)
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<TeamDto>(items, pagination.Page, pagination.PageSize, totalCount);
    }
}
