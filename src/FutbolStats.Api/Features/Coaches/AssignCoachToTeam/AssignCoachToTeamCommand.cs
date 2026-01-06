using FluentValidation;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Features.Coaches.Entities;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Coaches.AssignCoachToTeam;

public record AssignCoachToTeamCommand(
    Guid CoachId,
    Guid TeamId,
    DateOnly StartDate
) : IRequest<AssignCoachToTeamResponse>;

public record AssignCoachToTeamResponse(Guid Id, string CoachName, string TeamName, DateOnly StartDate);

public class AssignCoachToTeamHandler(FutbolDbContext db)
    : IRequestHandler<AssignCoachToTeamCommand, AssignCoachToTeamResponse>
{
    public async Task<AssignCoachToTeamResponse> Handle(
        AssignCoachToTeamCommand request,
        CancellationToken cancellationToken)
    {
        var coach = await db.Coaches
            .Include(c => c.TeamAssignments)
            .FirstOrDefaultAsync(c => c.Id == request.CoachId, cancellationToken)
            ?? throw new NotFoundException("Coach", request.CoachId);

        var team = await db.Teams
            .FirstOrDefaultAsync(t => t.Id == request.TeamId, cancellationToken)
            ?? throw new NotFoundException("Team", request.TeamId);

        // End any current assignment for this coach
        var currentAssignment = coach.TeamAssignments
            .FirstOrDefault(a => a.EndDate == null);

        if (currentAssignment != null)
        {
            currentAssignment.EndDate = request.StartDate.AddDays(-1);
        }

        // End any current coach assignment for this team
        var teamCurrentCoach = await db.CoachTeamAssignments
            .Where(a => a.TeamId == request.TeamId && a.EndDate == null)
            .FirstOrDefaultAsync(cancellationToken);

        if (teamCurrentCoach != null)
        {
            teamCurrentCoach.EndDate = request.StartDate.AddDays(-1);
        }

        // Create new assignment
        var assignment = new CoachTeamAssignment
        {
            Id = Guid.NewGuid(),
            CoachId = request.CoachId,
            TeamId = request.TeamId,
            StartDate = request.StartDate,
            EndDate = null
        };

        db.CoachTeamAssignments.Add(assignment);
        await db.SaveChangesAsync(cancellationToken);

        return new AssignCoachToTeamResponse(
            assignment.Id,
            coach.FullName,
            team.Name,
            assignment.StartDate
        );
    }
}

public class AssignCoachToTeamValidator : AbstractValidator<AssignCoachToTeamCommand>
{
    public AssignCoachToTeamValidator()
    {
        RuleFor(x => x.CoachId)
            .NotEmpty().WithMessage("El CoachId es requerido");

        RuleFor(x => x.TeamId)
            .NotEmpty().WithMessage("El TeamId es requerido");

        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage("La fecha de inicio es requerida");
    }
}
