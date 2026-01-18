using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Features.Championships.Services;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Championships.GetStandings;

public record GetStandingsQuery(Guid ChampionshipId) : IRequest<StandingsResponse>;

public record StandingsResponse(
    Guid ChampionshipId,
    string ChampionshipName,
    string Season,
    List<StandingEntryDto> Standings
);

public record StandingEntryDto(
    int Position,
    Guid TeamId,
    string TeamName,
    string? LogoUrl,
    int GamesPlayed,
    int Wins,
    int Draws,
    int Losses,
    int GoalsFor,
    int GoalsAgainst,
    int GoalDifference,
    int Points
);

public class GetStandingsQueryHandler : IRequestHandler<GetStandingsQuery, StandingsResponse>
{
    private readonly FutbolDbContext _context;
    private readonly IStandingsService _standingsService;

    public GetStandingsQueryHandler(FutbolDbContext context, IStandingsService standingsService)
    {
        _context = context;
        _standingsService = standingsService;
    }

    public async Task<StandingsResponse> Handle(GetStandingsQuery request, CancellationToken cancellationToken)
    {
        var championship = await _context.Championships
            .Include(c => c.Teams)
                .ThenInclude(ct => ct.Team)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == request.ChampionshipId, cancellationToken);

        if (championship == null)
        {
            throw new NotFoundException("Championship", request.ChampionshipId);
        }

        var sortedTeams = await _standingsService.GetSortedStandingsAsync(
            championship.Id,
            championship.Teams,
            championship.TiebreakerType,
            cancellationToken);

        var standings = sortedTeams
            .Select((t, index) => new StandingEntryDto(
                index + 1,
                t.TeamId,
                t.Team.Name,
                t.Team.LogoUrl,
                t.GamesPlayed,
                t.Wins,
                t.Draws,
                t.Losses,
                t.GoalsFor,
                t.GoalsAgainst,
                t.GoalDifference,
                t.Points
            ))
            .ToList();

        return new StandingsResponse(
            championship.Id,
            championship.Name,
            championship.Season,
            standings
        );
    }
}
