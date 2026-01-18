using FutbolStats.Api.Common;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Matches.GetMatchById;

public record GetMatchByIdQuery(Guid Id) : IRequest<MatchDetailDto>;

public record MatchDetailDto(
    Guid Id,
    Guid ChampionshipId,
    string ChampionshipName,
    string Season,
    Guid HomeTeamId,
    string HomeTeamName,
    string HomeTeamShortName,
    string? HomeTeamLogo,
    Guid AwayTeamId,
    string AwayTeamName,
    string AwayTeamShortName,
    string? AwayTeamLogo,
    Guid? HomeCoachId,
    string? HomeCoachName,
    Guid? AwayCoachId,
    string? AwayCoachName,
    DateTime MatchDate,
    string? Stadium,
    MatchStatus Status,
    int HomeScore,
    int AwayScore,
    int Matchday,
    int? CurrentMinute,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IReadOnlyList<MatchLineupDto> HomeLineup,
    IReadOnlyList<MatchLineupDto> AwayLineup,
    IReadOnlyList<MatchEventDto> Events
);

public record MatchLineupDto(
    Guid PlayerId,
    string PlayerName,
    int JerseyNumber,
    string? Position,
    bool IsStarter
);

public record MatchEventDto(
    Guid Id,
    Guid PlayerId,
    string PlayerName,
    Guid? SecondPlayerId,
    string? SecondPlayerName,
    Guid TeamId,
    string TeamName,
    EventType EventType,
    int Minute,
    int? ExtraMinute,
    string? Description
);

public class GetMatchByIdHandler(FutbolDbContext db)
    : IRequestHandler<GetMatchByIdQuery, MatchDetailDto>
{
    public async Task<MatchDetailDto> Handle(
        GetMatchByIdQuery request,
        CancellationToken cancellationToken)
    {
        var match = await db.Matches
            .Include(m => m.Championship)
            .Include(m => m.HomeTeam)
            .Include(m => m.AwayTeam)
            .Include(m => m.HomeCoach)
            .Include(m => m.AwayCoach)
            .Include(m => m.Lineups)
                .ThenInclude(l => l.Player)
            .Include(m => m.Events)
                .ThenInclude(e => e.Player)
            .Include(m => m.Events)
                .ThenInclude(e => e.SecondPlayer)
            .Include(m => m.Events)
                .ThenInclude(e => e.Team)
            .FirstOrDefaultAsync(m => m.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Match", request.Id);

        var homeLineup = match.Lineups
            .Where(l => l.TeamId == match.HomeTeamId)
            .OrderByDescending(l => l.IsStarter)
            .ThenBy(l => l.JerseyNumber)
            .Select(l => new MatchLineupDto(
                l.PlayerId,
                $"{l.Player.FirstName} {l.Player.LastName}",
                l.JerseyNumber,
                l.Position,
                l.IsStarter
            ))
            .ToList();

        var awayLineup = match.Lineups
            .Where(l => l.TeamId == match.AwayTeamId)
            .OrderByDescending(l => l.IsStarter)
            .ThenBy(l => l.JerseyNumber)
            .Select(l => new MatchLineupDto(
                l.PlayerId,
                $"{l.Player.FirstName} {l.Player.LastName}",
                l.JerseyNumber,
                l.Position,
                l.IsStarter
            ))
            .ToList();

        var events = match.Events
            .OrderBy(e => e.Minute)
            .ThenBy(e => e.ExtraMinute ?? 0)
            .Select(e => new MatchEventDto(
                e.Id,
                e.PlayerId,
                $"{e.Player.FirstName} {e.Player.LastName}",
                e.SecondPlayerId,
                e.SecondPlayer != null ? $"{e.SecondPlayer.FirstName} {e.SecondPlayer.LastName}" : null,
                e.TeamId,
                e.Team.Name,
                e.EventType,
                e.Minute,
                e.ExtraMinute,
                e.Description
            ))
            .ToList();

        return new MatchDetailDto(
            match.Id,
            match.ChampionshipId,
            match.Championship.Name,
            match.Championship.Season,
            match.HomeTeamId,
            match.HomeTeam.Name,
            match.HomeTeam.ShortName,
            match.HomeTeam.LogoUrl,
            match.AwayTeamId,
            match.AwayTeam.Name,
            match.AwayTeam.ShortName,
            match.AwayTeam.LogoUrl,
            match.HomeCoachId,
            match.HomeCoach?.FullName,
            match.AwayCoachId,
            match.AwayCoach?.FullName,
            match.MatchDate,
            match.Stadium,
            match.Status,
            match.HomeScore,
            match.AwayScore,
            match.Matchday,
            match.CurrentMinute,
            match.CreatedAt,
            match.UpdatedAt,
            homeLineup,
            awayLineup,
            events
        );
    }
}
