using FutbolStats.Api.Common;
using FutbolStats.Api.Features.Championships.Entities;
using FutbolStats.Api.Features.MatchEvents.Entities;
using FutbolStats.Api.Features.Teams.Entities;

namespace FutbolStats.Api.Features.Matches.Entities;

public class Match
{
    public Guid Id { get; set; }
    public Guid ChampionshipId { get; set; }
    public Guid HomeTeamId { get; set; }
    public Guid AwayTeamId { get; set; }
    public DateTime MatchDate { get; set; }
    public string? Stadium { get; set; }
    public MatchStatus Status { get; set; } = MatchStatus.Scheduled;
    public int HomeScore { get; set; }
    public int AwayScore { get; set; }
    public int Matchday { get; set; }
    public int? CurrentMinute { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Championship Championship { get; set; } = null!;
    public Team HomeTeam { get; set; } = null!;
    public Team AwayTeam { get; set; } = null!;
    public ICollection<MatchEvent> Events { get; set; } = [];
    public ICollection<MatchLineup> Lineups { get; set; } = [];
}

public class MatchLineup
{
    public Guid Id { get; set; }
    public Guid MatchId { get; set; }
    public Guid PlayerId { get; set; }
    public Guid TeamId { get; set; }
    public bool IsStarter { get; set; }
    public string? Position { get; set; }
    public int JerseyNumber { get; set; }

    public Match Match { get; set; } = null!;
    public Players.Entities.Player Player { get; set; } = null!;
    public Team Team { get; set; } = null!;
}
