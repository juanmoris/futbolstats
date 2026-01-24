using FutbolStats.Api.Common;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Teams.GetTeamById;

public record GetTeamByIdQuery(Guid Id) : IRequest<TeamDetailDto>;

public record TeamDetailDto(
    Guid Id,
    string Name,
    string ShortName,
    string? LogoUrl,
    int? FoundedYear,
    string? Stadium,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IReadOnlyList<TeamPlayerDto> Players
);

public record TeamPlayerDto(
    Guid Id,
    string FirstName,
    string LastName,
    int? Number,
    PlayerPosition Position,
    string? CountryName,
    bool IsActive
);

public class GetTeamByIdHandler(FutbolDbContext db)
    : IRequestHandler<GetTeamByIdQuery, TeamDetailDto>
{
    public async Task<TeamDetailDto> Handle(
        GetTeamByIdQuery request,
        CancellationToken cancellationToken)
    {
        var team = await db.Teams
            .Include(t => t.Players.Where(p => p.IsActive))
                .ThenInclude(p => p.Country)
            .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Team", request.Id);

        var players = team.Players
            .OrderBy(p => p.Number)
            .Select(p => new TeamPlayerDto(
                p.Id,
                p.FirstName,
                p.LastName,
                p.Number,
                p.Position,
                p.Country?.Name,
                p.IsActive
            ))
            .ToList();

        return new TeamDetailDto(
            team.Id,
            team.Name,
            team.ShortName,
            team.LogoUrl,
            team.FoundedYear,
            team.Stadium,
            team.CreatedAt,
            team.UpdatedAt,
            players
        );
    }
}
