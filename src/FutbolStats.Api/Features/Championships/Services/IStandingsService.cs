using FutbolStats.Api.Common;
using FutbolStats.Api.Features.Championships.Entities;

namespace FutbolStats.Api.Features.Championships.Services;

public interface IStandingsService
{
    Task<List<ChampionshipTeam>> GetSortedStandingsAsync(
        Guid championshipId,
        ICollection<ChampionshipTeam> teams,
        TiebreakerType tiebreakerType,
        CancellationToken cancellationToken);
}
