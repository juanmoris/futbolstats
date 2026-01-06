using FluentValidation;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Coaches.EndCoachAssignment;

public record EndCoachAssignmentCommand(
    Guid CoachId,
    DateOnly EndDate
) : IRequest;

public class EndCoachAssignmentHandler(FutbolDbContext db)
    : IRequestHandler<EndCoachAssignmentCommand>
{
    public async Task Handle(
        EndCoachAssignmentCommand request,
        CancellationToken cancellationToken)
    {
        var assignment = await db.CoachTeamAssignments
            .Where(a => a.CoachId == request.CoachId && a.EndDate == null)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("CoachTeamAssignment", request.CoachId);

        if (request.EndDate < assignment.StartDate)
        {
            throw new Common.Exceptions.ValidationException(
                [new FluentValidation.Results.ValidationFailure("EndDate", "La fecha de fin no puede ser anterior a la fecha de inicio")]);
        }

        assignment.EndDate = request.EndDate;
        await db.SaveChangesAsync(cancellationToken);
    }
}

public class EndCoachAssignmentValidator : AbstractValidator<EndCoachAssignmentCommand>
{
    public EndCoachAssignmentValidator()
    {
        RuleFor(x => x.CoachId)
            .NotEmpty().WithMessage("El CoachId es requerido");

        RuleFor(x => x.EndDate)
            .NotEmpty().WithMessage("La fecha de fin es requerida");
    }
}
