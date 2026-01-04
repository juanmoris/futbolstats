using FutbolStats.Api.Common;
using FutbolStats.Api.Common.Exceptions;
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

public class GetChampionshipByIdHandler(FutbolDbContext db)
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

        var teams = championship.Teams
            .OrderByDescending(t => t.Points)
            .ThenByDescending(t => t.GoalDifference)
            .ThenByDescending(t => t.GoalsFor)
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
            championship.CreatedAt,
            championship.UpdatedAt,
            teams
        );
    }
}
