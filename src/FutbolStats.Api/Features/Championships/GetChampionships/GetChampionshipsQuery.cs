using FutbolStats.Api.Common;
using FutbolStats.Api.Common.Models;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Championships.GetChampionships;

public record GetChampionshipsQuery(
    int Page = 1,
    int PageSize = 10,
    ChampionshipStatus? Status = null
) : IRequest<PagedResult<ChampionshipDto>>;

public record ChampionshipDto(
    Guid Id,
    string Name,
    string Season,
    DateOnly StartDate,
    DateOnly EndDate,
    ChampionshipStatus Status,
    int TeamsCount
);

public class GetChampionshipsHandler(FutbolDbContext db)
    : IRequestHandler<GetChampionshipsQuery, PagedResult<ChampionshipDto>>
{
    public async Task<PagedResult<ChampionshipDto>> Handle(
        GetChampionshipsQuery request,
        CancellationToken cancellationToken)
    {
        var query = db.Championships.AsQueryable();

        if (request.Status.HasValue)
        {
            query = query.Where(c => c.Status == request.Status.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var pagination = new PaginationParams(request.Page, request.PageSize);

        var items = await query
            .OrderByDescending(c => c.StartDate)
            .Skip(pagination.Skip)
            .Take(pagination.PageSize)
            .Select(c => new ChampionshipDto(
                c.Id,
                c.Name,
                c.Season,
                c.StartDate,
                c.EndDate,
                c.Status,
                c.Teams.Count
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<ChampionshipDto>(items, pagination.Page, pagination.PageSize, totalCount);
    }
}
