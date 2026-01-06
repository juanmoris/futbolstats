using FutbolStats.Api.Common.Models;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Coaches.GetCoaches;

public record GetCoachesQuery(
    int Page = 1,
    int PageSize = 10,
    string? Search = null
) : IRequest<PagedResult<CoachDto>>;

public record CoachDto(
    Guid Id,
    string FirstName,
    string LastName,
    string FullName,
    string? Nationality,
    string? PhotoUrl,
    DateOnly? BirthDate,
    Guid? CurrentTeamId,
    string? CurrentTeamName
);

public class GetCoachesHandler(FutbolDbContext db)
    : IRequestHandler<GetCoachesQuery, PagedResult<CoachDto>>
{
    public async Task<PagedResult<CoachDto>> Handle(
        GetCoachesQuery request,
        CancellationToken cancellationToken)
    {
        var query = db.Coaches
            .Include(c => c.TeamAssignments)
                .ThenInclude(a => a.Team)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.ToLower();
            query = query.Where(c =>
                c.FirstName.ToLower().Contains(search) ||
                c.LastName.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var pagination = new PaginationParams(request.Page, request.PageSize);

        var items = await query
            .OrderBy(c => c.LastName)
            .ThenBy(c => c.FirstName)
            .Skip(pagination.Skip)
            .Take(pagination.PageSize)
            .Select(c => new CoachDto(
                c.Id,
                c.FirstName,
                c.LastName,
                c.FirstName + " " + c.LastName,
                c.Nationality,
                c.PhotoUrl,
                c.BirthDate,
                c.TeamAssignments
                    .Where(a => a.EndDate == null)
                    .Select(a => (Guid?)a.TeamId)
                    .FirstOrDefault(),
                c.TeamAssignments
                    .Where(a => a.EndDate == null)
                    .Select(a => a.Team.Name)
                    .FirstOrDefault()
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<CoachDto>(items, pagination.Page, pagination.PageSize, totalCount);
    }
}
