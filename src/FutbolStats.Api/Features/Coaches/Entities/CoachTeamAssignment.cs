using FutbolStats.Api.Features.Teams.Entities;

namespace FutbolStats.Api.Features.Coaches.Entities;

public class CoachTeamAssignment
{
    public Guid Id { get; set; }
    public Guid CoachId { get; set; }
    public Guid TeamId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }

    public Coach Coach { get; set; } = null!;
    public Team Team { get; set; } = null!;
}
