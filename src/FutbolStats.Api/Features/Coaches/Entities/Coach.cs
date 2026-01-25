using FutbolStats.Api.Features.Countries.Entities;

namespace FutbolStats.Api.Features.Coaches.Entities;

public class Coach
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public Guid? CountryId { get; set; }
    public string? PhotoUrl { get; set; }
    public DateOnly? BirthDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Country? Country { get; set; }
    public ICollection<CoachTeamAssignment> TeamAssignments { get; set; } = [];

    public string FullName => $"{FirstName} {LastName}";
}
