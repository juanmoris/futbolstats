using FutbolStats.Api.Common;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.MatchEvents.DeleteEvent;

public record DeleteEventCommand(Guid MatchId, Guid EventId) : IRequest;

public class DeleteEventHandler(FutbolDbContext db)
    : IRequestHandler<DeleteEventCommand>
{
    public async Task Handle(DeleteEventCommand request, CancellationToken cancellationToken)
    {
        var matchEvent = await db.MatchEvents
            .Include(e => e.Match)
            .FirstOrDefaultAsync(e => e.Id == request.EventId && e.MatchId == request.MatchId, cancellationToken)
            ?? throw new NotFoundException("Event", request.EventId);

        var match = matchEvent.Match;

        // Revert score if it was a goal
        if (matchEvent.EventType == EventType.Goal ||
            matchEvent.EventType == EventType.PenaltyScored)
        {
            if (matchEvent.TeamId == match.HomeTeamId)
                match.HomeScore--;
            else
                match.AwayScore--;
        }
        else if (matchEvent.EventType == EventType.OwnGoal)
        {
            // Own goal scored for the opposing team
            if (matchEvent.TeamId == match.HomeTeamId)
                match.AwayScore--;
            else
                match.HomeScore--;
        }

        db.MatchEvents.Remove(matchEvent);
        await db.SaveChangesAsync(cancellationToken);
    }
}
