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
            .Include(m => m.Lineups)
            .FirstOrDefaultAsync(m => m.Id == request.MatchId, cancellationToken)
            ?? throw new NotFoundException("Match", request.MatchId);

        if (match.Status != MatchStatus.Scheduled && match.Status != MatchStatus.HalfTime)
        {
            throw new InvalidOperationException(
                $"Cannot start match. Current status: {match.Status}");
        }

        // Validar alineaciones solo al iniciar desde Scheduled (no al reanudar desde HalfTime)
        if (match.Status == MatchStatus.Scheduled)
        {
            var homeLineups = match.Lineups.Where(l => l.TeamId == match.HomeTeamId).ToList();
            var awayLineups = match.Lineups.Where(l => l.TeamId == match.AwayTeamId).ToList();

            // Validar que existan alineaciones
            if (!homeLineups.Any())
                throw new InvalidOperationException("El equipo local no tiene alineación registrada");

            if (!awayLineups.Any())
                throw new InvalidOperationException("El equipo visitante no tiene alineación registrada");

            // Validar 11 titulares por equipo
            var homeStarters = homeLineups.Count(l => l.IsStarter);
            var awayStarters = awayLineups.Count(l => l.IsStarter);

            if (homeStarters != 11)
                throw new InvalidOperationException($"El equipo local debe tener exactamente 11 titulares (tiene {homeStarters})");

            if (awayStarters != 11)
                throw new InvalidOperationException($"El equipo visitante debe tener exactamente 11 titulares (tiene {awayStarters})");

            // Validar al menos 1 suplente por equipo
            var homeSubstitutes = homeLineups.Count(l => !l.IsStarter);
            var awaySubstitutes = awayLineups.Count(l => !l.IsStarter);

            if (homeSubstitutes < 1)
                throw new InvalidOperationException("El equipo local debe tener al menos 1 suplente");

            if (awaySubstitutes < 1)
                throw new InvalidOperationException("El equipo visitante debe tener al menos 1 suplente");
        }

        var wasHalfTime = match.Status == MatchStatus.HalfTime;
        match.Status = MatchStatus.Live;
        match.CurrentMinute = wasHalfTime ? 46 : 1;

        await db.SaveChangesAsync(cancellationToken);

        return new StartMatchResponse(match.Id, match.Status, match.CurrentMinute ?? 1);
    }
}
