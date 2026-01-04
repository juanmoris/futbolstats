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

        if (match.Status != Common.MatchStatus.Scheduled)
        {
            throw new InvalidOperationException("Can only update scheduled matches");
        }

        match.MatchDate = request.MatchDate;
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
            .NotEmpty().WithMessage("Id is required");

        RuleFor(x => x.MatchDate)
            .NotEmpty().WithMessage("Match date is required");

        RuleFor(x => x.Matchday)
            .GreaterThan(0).WithMessage("Matchday must be greater than 0");

        RuleFor(x => x.Stadium)
            .MaximumLength(200).WithMessage("Stadium must not exceed 200 characters")
            .When(x => !string.IsNullOrEmpty(x.Stadium));
    }
}
