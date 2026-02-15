using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Statistics.GetHistoricalTeamRankings;

public record GetHistoricalTeamRankingsQuery(
    string? Search = null
) : IRequest<HistoricalTeamRankingsResponse>;

public record HistoricalTeamRankingsResponse(
    List<HistoricalTeamRankingDto> Rankings
);

public record HistoricalTeamRankingDto(
    int Rank,
    Guid TeamId,
    string TeamName,
    string? LogoUrl,
    int ChampionshipsPlayed,
    int GamesPlayed,
    int Wins,
    int Draws,
    int Losses,
    int GoalsFor,
    int GoalsAgainst,
    int GoalDifference,
    int Points
);

public class GetHistoricalTeamRankingsQueryHandler : IRequestHandler<GetHistoricalTeamRankingsQuery, HistoricalTeamRankingsResponse>
{
    private readonly FutbolDbContext _context;

    public GetHistoricalTeamRankingsQueryHandler(FutbolDbContext context)
    {
        _context = context;
    }

    public async Task<HistoricalTeamRankingsResponse> Handle(GetHistoricalTeamRankingsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.ChampionshipTeams
            .Include(ct => ct.Team)
            .AsNoTracking();

        var allTeamStats = await query
            .GroupBy(ct => new { ct.TeamId, ct.Team.Name, ct.Team.LogoUrl })
            .Select(g => new
            {
                g.Key.TeamId,
                TeamName = g.Key.Name,
                g.Key.LogoUrl,
                ChampionshipsPlayed = g.Count(),
                GamesPlayed = g.Sum(ct => ct.GamesPlayed),
                Wins = g.Sum(ct => ct.Wins),
                Draws = g.Sum(ct => ct.Draws),
                Losses = g.Sum(ct => ct.Losses),
                GoalsFor = g.Sum(ct => ct.GoalsFor),
                GoalsAgainst = g.Sum(ct => ct.GoalsAgainst),
                Points = g.Sum(ct => ct.Points)
            })
            .ToListAsync(cancellationToken);

        // Filter by team name
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var searchLower = request.Search.ToLower();
            allTeamStats = allTeamStats
                .Where(x => x.TeamName.ToLower().Contains(searchLower))
                .ToList();
        }

        // Order by Points DESC > GoalDifference DESC > GoalsFor DESC
        var ranked = allTeamStats
            .OrderByDescending(x => x.Points)
            .ThenByDescending(x => x.GoalsFor - x.GoalsAgainst)
            .ThenByDescending(x => x.GoalsFor)
            .Select((x, index) => new HistoricalTeamRankingDto(
                index + 1,
                x.TeamId,
                x.TeamName,
                x.LogoUrl,
                x.ChampionshipsPlayed,
                x.GamesPlayed,
                x.Wins,
                x.Draws,
                x.Losses,
                x.GoalsFor,
                x.GoalsAgainst,
                x.GoalsFor - x.GoalsAgainst,
                x.Points
            ))
            .ToList();

        return new HistoricalTeamRankingsResponse(ranked);
    }
}
