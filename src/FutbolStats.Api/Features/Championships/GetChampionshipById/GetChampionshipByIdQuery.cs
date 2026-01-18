using FutbolStats.Api.Common;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Features.Championships.Services;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Championships.GetChampionshipById;

public record GetChampionshipByIdQuery(Guid Id) : IRequest<ChampionshipDetailDto>;

public record ChampionshipDetailDto(
    Guid Id,
    string Name,
    string Season,
    DateOnly StartDate,
    DateOnly EndDate,
    ChampionshipStatus Status,
    TiebreakerType TiebreakerType,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IReadOnlyList<ChampionshipTeamDto> Teams
);

public record ChampionshipTeamDto(
    Guid TeamId,
    string TeamName,
    string ShortName,
    string? LogoUrl,
    int Points,
    int GamesPlayed,
    int Wins,
    int Draws,
    int Losses,
    int GoalsFor,
    int GoalsAgainst,
    int GoalDifference
);

public class GetChampionshipByIdHandler(FutbolDbContext db, IStandingsService standingsService)
    : IRequestHandler<GetChampionshipByIdQuery, ChampionshipDetailDto>
{
    public async Task<ChampionshipDetailDto> Handle(
        GetChampionshipByIdQuery request,
        CancellationToken cancellationToken)
    {
        var championship = await db.Championships
            .Include(c => c.Teams)
                .ThenInclude(ct => ct.Team)
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Championship", request.Id);

        var sortedTeams = await standingsService.GetSortedStandingsAsync(
            championship.Id,
            championship.Teams,
            championship.TiebreakerType,
            cancellationToken);

        var teams = sortedTeams
            .Select(ct => new ChampionshipTeamDto(
                ct.TeamId,
                ct.Team.Name,
                ct.Team.ShortName,
                ct.Team.LogoUrl,
                ct.Points,
                ct.GamesPlayed,
                ct.Wins,
                ct.Draws,
                ct.Losses,
                ct.GoalsFor,
                ct.GoalsAgainst,
                ct.GoalDifference
            ))
            .ToList();

        return new ChampionshipDetailDto(
            championship.Id,
            championship.Name,
            championship.Season,
            championship.StartDate,
            championship.EndDate,
            championship.Status,
            championship.TiebreakerType,
            championship.CreatedAt,
            championship.UpdatedAt,
            teams
        );
    }
}
