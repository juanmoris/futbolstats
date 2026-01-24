using FutbolStats.Api.Common;
using FutbolStats.Api.Common.Models;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Players.GetPlayers;

public record GetPlayersQuery(
    int Page = 1,
    int PageSize = 10,
    Guid? TeamId = null,
    PlayerPosition? Position = null,
    string? Search = null,
    bool OnlyActive = true
) : IRequest<PagedResult<PlayerDto>>;

public record PlayerDto(
    Guid Id,
    string FirstName,
    string LastName,
    string FullName,
    int? Number,
    PlayerPosition Position,
    DateOnly? BirthDate,
    string? Nationality,
    string? PhotoUrl,
    Guid TeamId,
    string TeamName,
    string? TeamLogoUrl,
    bool IsActive
);

public class GetPlayersHandler(FutbolDbContext db)
    : IRequestHandler<GetPlayersQuery, PagedResult<PlayerDto>>
{
    public async Task<PagedResult<PlayerDto>> Handle(
        GetPlayersQuery request,
        CancellationToken cancellationToken)
    {
        var query = db.Players.Include(p => p.Team).AsQueryable();

        if (request.OnlyActive)
        {
            query = query.Where(p => p.IsActive);
        }

        if (request.TeamId.HasValue)
        {
            query = query.Where(p => p.TeamId == request.TeamId.Value);
        }

        if (request.Position.HasValue)
        {
            query = query.Where(p => p.Position == request.Position.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.ToLower();
            query = query.Where(p =>
                p.FirstName.ToLower().Contains(search) ||
                p.LastName.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var pagination = new PaginationParams(request.Page, request.PageSize);

        var items = await query
            .OrderBy(p => p.Team.Name)
            .ThenBy(p => p.Number)
            .Skip(pagination.Skip)
            .Take(pagination.PageSize)
            .Select(p => new PlayerDto(
                p.Id,
                p.FirstName,
                p.LastName,
                p.FirstName + " " + p.LastName,
                p.Number,
                p.Position,
                p.BirthDate,
                p.Nationality,
                p.PhotoUrl,
                p.TeamId,
                p.Team.Name,
                p.Team.LogoUrl,
                p.IsActive
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<PlayerDto>(items, pagination.Page, pagination.PageSize, totalCount);
    }
}
