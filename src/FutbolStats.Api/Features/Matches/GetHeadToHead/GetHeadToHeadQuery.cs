using FutbolStats.Api.Common;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Matches.GetHeadToHead;

public record GetHeadToHeadQuery(
    Guid TeamAId,
    Guid TeamBId,
    Guid? ExcludeMatchId = null,
    int Limit = 10
) : IRequest<HeadToHeadResponse>;

public record HeadToHeadResponse(
    int TotalMatches,
    int TeamAWins,
    int TeamBWins,
    int Draws,
    int TeamAGoals,
    int TeamBGoals,
    Guid TeamAId,
    string TeamAName,
    string? TeamALogo,
    Guid TeamBId,
    string TeamBName,
    string? TeamBLogo,
    IReadOnlyList<HeadToHeadMatchDto> Matches
);

public record HeadToHeadMatchDto(
    Guid Id,
    Guid ChampionshipId,
    string ChampionshipName,
    string Season,
    Guid HomeTeamId,
    string HomeTeamName,
    string? HomeTeamLogo,
    Guid AwayTeamId,
    string AwayTeamName,
    string? AwayTeamLogo,
    int HomeScore,
    int AwayScore,
    DateTime MatchDate,
    int Matchday
);

public class GetHeadToHeadHandler(FutbolDbContext db)
    : IRequestHandler<GetHeadToHeadQuery, HeadToHeadResponse>
{
    public async Task<HeadToHeadResponse> Handle(
        GetHeadToHeadQuery request,
        CancellationToken cancellationToken)
    {
        var query = db.Matches
            .Include(m => m.Championship)
            .Include(m => m.HomeTeam)
            .Include(m => m.AwayTeam)
            .Where(m => m.Status == MatchStatus.Finished)
            .Where(m =>
                (m.HomeTeamId == request.TeamAId && m.AwayTeamId == request.TeamBId) ||
                (m.HomeTeamId == request.TeamBId && m.AwayTeamId == request.TeamAId));

        if (request.ExcludeMatchId.HasValue)
        {
            query = query.Where(m => m.Id != request.ExcludeMatchId.Value);
        }

        var allMatches = await query
            .OrderByDescending(m => m.MatchDate)
            .ToListAsync(cancellationToken);

        // Calculate aggregates over ALL historical matches
        var teamAWins = 0;
        var teamBWins = 0;
        var draws = 0;
        var teamAGoals = 0;
        var teamBGoals = 0;

        foreach (var m in allMatches)
        {
            int goalsA, goalsB;
            if (m.HomeTeamId == request.TeamAId)
            {
                goalsA = m.HomeScore;
                goalsB = m.AwayScore;
            }
            else
            {
                goalsA = m.AwayScore;
                goalsB = m.HomeScore;
            }

            teamAGoals += goalsA;
            teamBGoals += goalsB;

            if (goalsA > goalsB) teamAWins++;
            else if (goalsB > goalsA) teamBWins++;
            else draws++;
        }

        // Get team info from first match or from DB
        string teamAName = "", teamBName = "";
        string? teamALogo = null, teamBLogo = null;

        if (allMatches.Count > 0)
        {
            var first = allMatches[0];
            if (first.HomeTeamId == request.TeamAId)
            {
                teamAName = first.HomeTeam.Name;
                teamALogo = first.HomeTeam.LogoUrl;
                teamBName = first.AwayTeam.Name;
                teamBLogo = first.AwayTeam.LogoUrl;
            }
            else
            {
                teamAName = first.AwayTeam.Name;
                teamALogo = first.AwayTeam.LogoUrl;
                teamBName = first.HomeTeam.Name;
                teamBLogo = first.HomeTeam.LogoUrl;
            }
        }
        else
        {
            var teamA = await db.Teams.FindAsync([request.TeamAId], cancellationToken);
            var teamB = await db.Teams.FindAsync([request.TeamBId], cancellationToken);
            if (teamA != null) { teamAName = teamA.Name; teamALogo = teamA.LogoUrl; }
            if (teamB != null) { teamBName = teamB.Name; teamBLogo = teamB.LogoUrl; }
        }

        // Return limited list of matches
        var limitedMatches = allMatches
            .Take(request.Limit)
            .Select(m => new HeadToHeadMatchDto(
                m.Id,
                m.ChampionshipId,
                m.Championship.Name,
                m.Championship.Season,
                m.HomeTeamId,
                m.HomeTeam.Name,
                m.HomeTeam.LogoUrl,
                m.AwayTeamId,
                m.AwayTeam.Name,
                m.AwayTeam.LogoUrl,
                m.HomeScore,
                m.AwayScore,
                m.MatchDate,
                m.Matchday
            ))
            .ToList();

        return new HeadToHeadResponse(
            allMatches.Count,
            teamAWins,
            teamBWins,
            draws,
            teamAGoals,
            teamBGoals,
            request.TeamAId,
            teamAName,
            teamALogo,
            request.TeamBId,
            teamBName,
            teamBLogo,
            limitedMatches
        );
    }
}
