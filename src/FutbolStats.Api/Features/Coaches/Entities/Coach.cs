namespace FutbolStats.Api.Features.Coaches.Entities;

public class Coach
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Nationality { get; set; }
    public string? PhotoUrl { get; set; }
    public DateOnly? BirthDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<CoachTeamAssignment> TeamAssignments { get; set; } = [];

    public string FullName => $"{FirstName} {LastName}";
}
