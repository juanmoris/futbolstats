using FutbolStats.Api.Features.Championships.Entities;
using FutbolStats.Api.Features.Players.Entities;

namespace FutbolStats.Api.Features.Teams.Entities;

public class Team
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ShortName { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public int? FoundedYear { get; set; }
    public string? Stadium { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<Player> Players { get; set; } = [];
    public ICollection<ChampionshipTeam> Championships { get; set; } = [];
}
