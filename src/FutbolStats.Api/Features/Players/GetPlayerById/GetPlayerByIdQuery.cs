using FutbolStats.Api.Common;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Players.GetPlayerById;

public record GetPlayerByIdQuery(Guid Id) : IRequest<PlayerDetailDto>;

public record PlayerDetailDto(
    Guid Id,
    string FirstName,
    string LastName,
    string FullName,
    int? Number,
    PlayerPosition Position,
    DateOnly? BirthDate,
    Guid? CountryId,
    string? CountryName,
    string? PhotoUrl,
    Guid TeamId,
    string TeamName,
    string TeamShortName,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    PlayerStatsDto Stats
);

public record PlayerStatsDto(
    int Goals,
    int Assists,
    int YellowCards,
    int RedCards,
    int MatchesPlayed
);

public class GetPlayerByIdHandler(FutbolDbContext db)
    : IRequestHandler<GetPlayerByIdQuery, PlayerDetailDto>
{
    public async Task<PlayerDetailDto> Handle(
        GetPlayerByIdQuery request,
        CancellationToken cancellationToken)
    {
        var player = await db.Players
            .Include(p => p.Team)
            .Include(p => p.Country)
            .Include(p => p.Events)
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Player", request.Id);

        var stats = new PlayerStatsDto(
            Goals: player.Events.Count(e => e.EventType == EventType.Goal || e.EventType == EventType.PenaltyScored),
            Assists: player.Events.Count(e => e.EventType == EventType.Assist),
            YellowCards: player.Events.Count(e => e.EventType == EventType.YellowCard),
            RedCards: player.Events.Count(e => e.EventType == EventType.RedCard || e.EventType == EventType.SecondYellow),
            MatchesPlayed: player.Events.Select(e => e.MatchId).Distinct().Count()
        );

        return new PlayerDetailDto(
            player.Id,
            player.FirstName,
            player.LastName,
            player.FullName,
            player.Number,
            player.Position,
            player.BirthDate,
            player.CountryId,
            player.Country?.Name,
            player.PhotoUrl,
            player.TeamId,
            player.Team.Name,
            player.Team.ShortName,
            player.IsActive,
            player.CreatedAt,
            player.UpdatedAt,
            stats
        );
    }
}
