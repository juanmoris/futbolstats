using FutbolStats.Api.Common;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.MatchEvents.GetMatchEvents;

public record GetMatchEventsQuery(Guid MatchId) : IRequest<IReadOnlyList<MatchEventDto>>;

public record MatchEventDto(
    Guid Id,
    Guid PlayerId,
    string PlayerName,
    int PlayerNumber,
    Guid? SecondPlayerId,
    string? SecondPlayerName,
    Guid TeamId,
    string TeamName,
    string TeamShortName,
    EventType EventType,
    int Minute,
    int? ExtraMinute,
    string? Description,
    DateTime CreatedAt
);

public class GetMatchEventsHandler(FutbolDbContext db)
    : IRequestHandler<GetMatchEventsQuery, IReadOnlyList<MatchEventDto>>
{
    public async Task<IReadOnlyList<MatchEventDto>> Handle(
        GetMatchEventsQuery request,
        CancellationToken cancellationToken)
    {
        var matchExists = await db.Matches.AnyAsync(m => m.Id == request.MatchId, cancellationToken);
        if (!matchExists)
        {
            throw new NotFoundException("Match", request.MatchId);
        }

        return await db.MatchEvents
            .Include(e => e.Player)
            .Include(e => e.SecondPlayer)
            .Include(e => e.Team)
            .Where(e => e.MatchId == request.MatchId)
            .OrderBy(e => e.Minute)
            .ThenBy(e => e.ExtraMinute ?? 0)
            .ThenBy(e => e.CreatedAt)
            .Select(e => new MatchEventDto(
                e.Id,
                e.PlayerId,
                e.Player.FirstName + " " + e.Player.LastName,
                e.Player.Number,
                e.SecondPlayerId,
                e.SecondPlayer != null ? e.SecondPlayer.FirstName + " " + e.SecondPlayer.LastName : null,
                e.TeamId,
                e.Team.Name,
                e.Team.ShortName,
                e.EventType,
                e.Minute,
                e.ExtraMinute,
                e.Description,
                e.CreatedAt
            ))
            .ToListAsync(cancellationToken);
    }
}
