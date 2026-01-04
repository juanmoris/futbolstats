using FutbolStats.Api.Common;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Matches.HalfTime;

public record HalfTimeCommand(Guid MatchId) : IRequest<HalfTimeResponse>;

public record HalfTimeResponse(Guid Id, MatchStatus Status);

public class HalfTimeHandler(FutbolDbContext db)
    : IRequestHandler<HalfTimeCommand, HalfTimeResponse>
{
    public async Task<HalfTimeResponse> Handle(
        HalfTimeCommand request,
        CancellationToken cancellationToken)
    {
        var match = await db.Matches
            .FirstOrDefaultAsync(m => m.Id == request.MatchId, cancellationToken)
            ?? throw new NotFoundException("Match", request.MatchId);

        if (match.Status != MatchStatus.Live)
        {
            throw new InvalidOperationException(
                $"Cannot set half time. Current status: {match.Status}");
        }

        match.Status = MatchStatus.HalfTime;
        match.CurrentMinute = 45;

        await db.SaveChangesAsync(cancellationToken);

        return new HalfTimeResponse(match.Id, match.Status);
    }
}
