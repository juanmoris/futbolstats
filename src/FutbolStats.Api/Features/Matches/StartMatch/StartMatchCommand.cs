using FutbolStats.Api.Common;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Matches.StartMatch;

public record StartMatchCommand(Guid MatchId) : IRequest<StartMatchResponse>;

public record StartMatchResponse(Guid Id, MatchStatus Status, int CurrentMinute);

public class StartMatchHandler(FutbolDbContext db)
    : IRequestHandler<StartMatchCommand, StartMatchResponse>
{
    public async Task<StartMatchResponse> Handle(
        StartMatchCommand request,
        CancellationToken cancellationToken)
    {
        var match = await db.Matches
            .FirstOrDefaultAsync(m => m.Id == request.MatchId, cancellationToken)
            ?? throw new NotFoundException("Match", request.MatchId);

        if (match.Status != MatchStatus.Scheduled && match.Status != MatchStatus.HalfTime)
        {
            throw new InvalidOperationException(
                $"Cannot start match. Current status: {match.Status}");
        }

        match.Status = MatchStatus.Live;
        match.CurrentMinute = match.Status == MatchStatus.HalfTime ? 46 : 1;

        await db.SaveChangesAsync(cancellationToken);

        return new StartMatchResponse(match.Id, match.Status, match.CurrentMinute ?? 1);
    }
}
