using FutbolStats.Api.Common;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Statistics.GetTopScorers;

public record GetTopScorersQuery(Guid ChampionshipId, int Limit = 20) : IRequest<TopScorersResponse>;

public record TopScorersResponse(
    Guid ChampionshipId,
    string ChampionshipName,
    List<ScorerDto> Scorers
);

public record ScorerDto(
    int Rank,
    Guid PlayerId,
    string PlayerName,
    string? PhotoUrl,
    Guid TeamId,
    string TeamName,
    string? TeamLogoUrl,
    int Goals,
    int PenaltyGoals,
    int Assists,
    int MatchesPlayed
);

public class GetTopScorersQueryHandler : IRequestHandler<GetTopScorersQuery, TopScorersResponse>
{
    private readonly FutbolDbContext _context;

    public GetTopScorersQueryHandler(FutbolDbContext context)
    {
        _context = context;
    }

    public async Task<TopScorersResponse> Handle(GetTopScorersQuery request, CancellationToken cancellationToken)
    {
        var championship = await _context.Championships
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == request.ChampionshipId, cancellationToken);

        if (championship == null)
        {
            throw new NotFoundException("Championship", request.ChampionshipId);
        }

        // Get all goal events for this championship
        var goalEvents = await _context.MatchEvents
            .Include(e => e.Match)
            .Include(e => e.Player)
                .ThenInclude(p => p.Team)
            .Where(e => e.Match.ChampionshipId == request.ChampionshipId
                        && (e.EventType == EventType.Goal || e.EventType == EventType.PenaltyScored))
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        // Get assist events
        var assistEvents = await _context.MatchEvents
            .Where(e => e.Match.ChampionshipId == request.ChampionshipId
                        && e.EventType == EventType.Assist)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        // Get match counts for players
        var matchCounts = await _context.MatchLineups
            .Include(l => l.Match)
            .Where(l => l.Match.ChampionshipId == request.ChampionshipId
                        && l.Match.Status == MatchStatus.Finished)
            .GroupBy(l => l.PlayerId)
            .Select(g => new { PlayerId = g.Key, MatchesPlayed = g.Count() })
            .AsNoTracking()
            .ToDictionaryAsync(x => x.PlayerId, x => x.MatchesPlayed, cancellationToken);

        // Group goals by player
        var scorers = goalEvents
            .GroupBy(e => e.PlayerId)
            .Select(g => new
            {
                Player = g.First().Player,
                Goals = g.Count(),
                PenaltyGoals = g.Count(e => e.EventType == EventType.PenaltyScored),
                Assists = assistEvents.Count(a => a.PlayerId == g.Key),
                MatchesPlayed = matchCounts.GetValueOrDefault(g.Key, 0)
            })
            .OrderByDescending(x => x.Goals)
            .ThenByDescending(x => x.Assists)
            .ThenBy(x => x.MatchesPlayed)
            .Take(request.Limit)
            .Select((x, index) => new ScorerDto(
                index + 1,
                x.Player.Id,
                $"{x.Player.FirstName} {x.Player.LastName}",
                x.Player.PhotoUrl,
                x.Player.TeamId,
                x.Player.Team.Name,
                x.Player.Team.LogoUrl,
                x.Goals,
                x.PenaltyGoals,
                x.Assists,
                x.MatchesPlayed
            ))
            .ToList();

        return new TopScorersResponse(
            championship.Id,
            championship.Name,
            scorers
        );
    }
}
