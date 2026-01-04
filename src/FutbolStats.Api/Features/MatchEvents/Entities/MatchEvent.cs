using FutbolStats.Api.Common;
using FutbolStats.Api.Features.Matches.Entities;
using FutbolStats.Api.Features.Players.Entities;
using FutbolStats.Api.Features.Teams.Entities;

namespace FutbolStats.Api.Features.MatchEvents.Entities;

public class MatchEvent
{
    public Guid Id { get; set; }
    public Guid MatchId { get; set; }
    public Guid PlayerId { get; set; }
    public Guid TeamId { get; set; }
    public EventType EventType { get; set; }
    public int Minute { get; set; }
    public int? ExtraMinute { get; set; }
    public Guid? SecondPlayerId { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }

    public Match Match { get; set; } = null!;
    public Player Player { get; set; } = null!;
    public Player? SecondPlayer { get; set; }
    public Team Team { get; set; } = null!;
}
