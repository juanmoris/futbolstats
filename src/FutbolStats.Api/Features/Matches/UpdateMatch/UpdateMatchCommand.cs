using FluentValidation;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Matches.UpdateMatch;

public record UpdateMatchCommand(
    Guid Id,
    DateTime MatchDate,
    string? Stadium,
    int Matchday
) : IRequest<UpdateMatchResponse>;

public record UpdateMatchResponse(Guid Id, DateTime MatchDate, int Matchday);

public class UpdateMatchHandler(FutbolDbContext db)
    : IRequestHandler<UpdateMatchCommand, UpdateMatchResponse>
{
    public async Task<UpdateMatchResponse> Handle(
        UpdateMatchCommand request,
        CancellationToken cancellationToken)
    {
        var match = await db.Matches
            .FirstOrDefaultAsync(m => m.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Match", request.Id);

        if (match.Status == Common.MatchStatus.Live || match.Status == Common.MatchStatus.HalfTime)
        {
            throw new InvalidOperationException("No se pueden editar partidos en curso");
        }

        var matchDate = request.MatchDate.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(request.MatchDate, DateTimeKind.Utc)
            : request.MatchDate.ToUniversalTime();

        match.MatchDate = matchDate;
        match.Stadium = request.Stadium;
        match.Matchday = request.Matchday;

        await db.SaveChangesAsync(cancellationToken);

        return new UpdateMatchResponse(match.Id, match.MatchDate, match.Matchday);
    }
}

public class UpdateMatchValidator : AbstractValidator<UpdateMatchCommand>
{
    public UpdateMatchValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("El ID es requerido");

        RuleFor(x => x.MatchDate)
            .NotEmpty().WithMessage("La fecha del partido es requerida");

        RuleFor(x => x.Matchday)
            .GreaterThan(0).WithMessage("La jornada debe ser mayor a 0");

        RuleFor(x => x.Stadium)
            .MaximumLength(200).WithMessage("El estadio no debe exceder 200 caracteres")
            .When(x => !string.IsNullOrEmpty(x.Stadium));
    }
}
