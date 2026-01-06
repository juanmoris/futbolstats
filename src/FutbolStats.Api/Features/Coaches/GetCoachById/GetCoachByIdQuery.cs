using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Coaches.GetCoachById;

public record GetCoachByIdQuery(Guid Id) : IRequest<CoachDetailDto>;

public record CoachDetailDto(
    Guid Id,
    string FirstName,
    string LastName,
    string FullName,
    string? Nationality,
    string? PhotoUrl,
    DateOnly? BirthDate,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IReadOnlyList<CoachTeamHistoryDto> TeamHistory
);

public record CoachTeamHistoryDto(
    Guid Id,
    Guid TeamId,
    string TeamName,
    string? TeamLogo,
    DateOnly StartDate,
    DateOnly? EndDate
);

public class GetCoachByIdHandler(FutbolDbContext db)
    : IRequestHandler<GetCoachByIdQuery, CoachDetailDto>
{
    public async Task<CoachDetailDto> Handle(
        GetCoachByIdQuery request,
        CancellationToken cancellationToken)
    {
        var coach = await db.Coaches
            .Include(c => c.TeamAssignments)
                .ThenInclude(a => a.Team)
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Coach", request.Id);

        var teamHistory = coach.TeamAssignments
            .OrderByDescending(a => a.StartDate)
            .Select(a => new CoachTeamHistoryDto(
                a.Id,
                a.TeamId,
                a.Team.Name,
                a.Team.LogoUrl,
                a.StartDate,
                a.EndDate
            ))
            .ToList();

        return new CoachDetailDto(
            coach.Id,
            coach.FirstName,
            coach.LastName,
            coach.FullName,
            coach.Nationality,
            coach.PhotoUrl,
            coach.BirthDate,
            coach.CreatedAt,
            coach.UpdatedAt,
            teamHistory
        );
    }
}
