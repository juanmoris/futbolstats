using FutbolStats.Api.Common;
using FutbolStats.Api.Features.Matches.Entities;

namespace FutbolStats.Api.Features.Championships.Entities;

public class Championship
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Season { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public ChampionshipStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<ChampionshipTeam> Teams { get; set; } = [];
    public ICollection<Match> Matches { get; set; } = [];
}

public class ChampionshipTeam
{
    public Guid Id { get; set; }
    public Guid ChampionshipId { get; set; }
    public Guid TeamId { get; set; }
    public int Points { get; set; }
    public int GamesPlayed { get; set; }
    public int Wins { get; set; }
    public int Draws { get; set; }
    public int Losses { get; set; }
    public int GoalsFor { get; set; }
    public int GoalsAgainst { get; set; }

    public Championship Championship { get; set; } = null!;
    public Teams.Entities.Team Team { get; set; } = null!;

    public int GoalDifference => GoalsFor - GoalsAgainst;
}
