using FutbolStats.Api.Common;
using FutbolStats.Api.Common.Models;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Matches.GetMatches;

public record GetMatchesQuery(
    int Page = 1,
    int PageSize = 10,
    Guid? ChampionshipId = null,
    Guid? TeamId = null,
    MatchStatus? Status = null,
    int? Matchday = null
) : IRequest<PagedResult<MatchDto>>;

public record MatchDto(
    Guid Id,
    Guid ChampionshipId,
    string ChampionshipName,
    Guid HomeTeamId,
    string HomeTeamName,
    string HomeTeamShortName,
    Guid AwayTeamId,
    string AwayTeamName,
    string AwayTeamShortName,
    DateTime MatchDate,
    string? Stadium,
    MatchStatus Status,
    int HomeScore,
    int AwayScore,
    int Matchday,
    int? CurrentMinute
);

public class GetMatchesHandler(FutbolDbContext db)
    : IRequestHandler<GetMatchesQuery, PagedResult<MatchDto>>
{
    public async Task<PagedResult<MatchDto>> Handle(
        GetMatchesQuery request,
        CancellationToken cancellationToken)
    {
        var query = db.Matches
            .Include(m => m.Championship)
            .Include(m => m.HomeTeam)
            .Include(m => m.AwayTeam)
            .AsQueryable();

        if (request.ChampionshipId.HasValue)
        {
            query = query.Where(m => m.ChampionshipId == request.ChampionshipId.Value);
        }

        if (request.TeamId.HasValue)
        {
            query = query.Where(m =>
                m.HomeTeamId == request.TeamId.Value ||
                m.AwayTeamId == request.TeamId.Value);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(m => m.Status == request.Status.Value);
        }

        if (request.Matchday.HasValue)
        {
            query = query.Where(m => m.Matchday == request.Matchday.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var pagination = new PaginationParams(request.Page, request.PageSize);

        var items = await query
            .OrderByDescending(m => m.MatchDate)
            .Skip(pagination.Skip)
            .Take(pagination.PageSize)
            .Select(m => new MatchDto(
                m.Id,
                m.ChampionshipId,
                m.Championship.Name,
                m.HomeTeamId,
                m.HomeTeam.Name,
                m.HomeTeam.ShortName,
                m.AwayTeamId,
                m.AwayTeam.Name,
                m.AwayTeam.ShortName,
                m.MatchDate,
                m.Stadium,
                m.Status,
                m.HomeScore,
                m.AwayScore,
                m.Matchday,
                m.CurrentMinute
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<MatchDto>(items, pagination.Page, pagination.PageSize, totalCount);
    }
}
