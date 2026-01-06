using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Matches.SetMatchCoaches;

public record SetMatchCoachesCommand(
    Guid MatchId,
    Guid? HomeCoachId,
    Guid? AwayCoachId
) : IRequest;

public class SetMatchCoachesHandler(FutbolDbContext db)
    : IRequestHandler<SetMatchCoachesCommand>
{
    public async Task Handle(
        SetMatchCoachesCommand request,
        CancellationToken cancellationToken)
    {
        var match = await db.Matches
            .FirstOrDefaultAsync(m => m.Id == request.MatchId, cancellationToken)
            ?? throw new NotFoundException("Match", request.MatchId);

        // Validate home coach exists if provided
        if (request.HomeCoachId.HasValue)
        {
            var homeCoachExists = await db.Coaches
                .AnyAsync(c => c.Id == request.HomeCoachId.Value, cancellationToken);
            if (!homeCoachExists)
                throw new NotFoundException("Coach", request.HomeCoachId.Value);
        }

        // Validate away coach exists if provided
        if (request.AwayCoachId.HasValue)
        {
            var awayCoachExists = await db.Coaches
                .AnyAsync(c => c.Id == request.AwayCoachId.Value, cancellationToken);
            if (!awayCoachExists)
                throw new NotFoundException("Coach", request.AwayCoachId.Value);
        }

        match.HomeCoachId = request.HomeCoachId;
        match.AwayCoachId = request.AwayCoachId;

        await db.SaveChangesAsync(cancellationToken);
    }
}
