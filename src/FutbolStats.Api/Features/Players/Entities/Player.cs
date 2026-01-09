using FutbolStats.Api.Common;
using FutbolStats.Api.Features.MatchEvents.Entities;
using FutbolStats.Api.Features.Teams.Entities;

namespace FutbolStats.Api.Features.Players.Entities;

public class Player
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public int Number { get; set; }
    public PlayerPosition Position { get; set; }
    public DateOnly BirthDate { get; set; }
    public string? Nationality { get; set; }
    public string? PhotoUrl { get; set; }
    public Guid TeamId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Team Team { get; set; } = null!;
    public ICollection<MatchEvent> Events { get; set; } = [];

    public string FullName => $"{FirstName} {LastName}";
}
