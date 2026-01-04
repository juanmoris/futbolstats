using FutbolStats.Api.Common;
using FutbolStats.Api.Features.Matches.GetMatches;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Matches.GetLiveMatches;

public record GetLiveMatchesQuery : IRequest<IReadOnlyList<MatchDto>>;

public class GetLiveMatchesHandler(FutbolDbContext db)
    : IRequestHandler<GetLiveMatchesQuery, IReadOnlyList<MatchDto>>
{
    public async Task<IReadOnlyList<MatchDto>> Handle(
        GetLiveMatchesQuery request,
        CancellationToken cancellationToken)
    {
        var liveStatuses = new[] { MatchStatus.Live, MatchStatus.HalfTime };

        return await db.Matches
            .Include(m => m.Championship)
            .Include(m => m.HomeTeam)
            .Include(m => m.AwayTeam)
            .Where(m => liveStatuses.Contains(m.Status))
            .OrderBy(m => m.MatchDate)
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
    }
}
