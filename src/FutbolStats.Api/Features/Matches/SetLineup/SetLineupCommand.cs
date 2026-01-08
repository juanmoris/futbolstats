using FluentValidation;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Features.Matches.Entities;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Matches.SetLineup;

public record SetLineupCommand(
    Guid MatchId,
    Guid TeamId,
    List<LineupPlayerDto> Players
) : IRequest<SetLineupResponse>;

public record LineupPlayerDto(
    Guid PlayerId,
    bool IsStarter,
    string? Position,
    int JerseyNumber
);

public record SetLineupResponse(Guid MatchId, Guid TeamId, int PlayersCount);

public class SetLineupHandler(FutbolDbContext db)
    : IRequestHandler<SetLineupCommand, SetLineupResponse>
{
    public async Task<SetLineupResponse> Handle(
        SetLineupCommand request,
        CancellationToken cancellationToken)
    {
        var match = await db.Matches
            .Include(m => m.Lineups)
            .FirstOrDefaultAsync(m => m.Id == request.MatchId, cancellationToken)
            ?? throw new NotFoundException("Match", request.MatchId);

        if (match.HomeTeamId != request.TeamId && match.AwayTeamId != request.TeamId)
        {
            throw new InvalidOperationException("Team is not part of this match");
        }

        // Remove existing lineup for this team
        var existingLineup = match.Lineups.Where(l => l.TeamId == request.TeamId).ToList();
        db.MatchLineups.RemoveRange(existingLineup);

        // Add new lineup
        foreach (var player in request.Players)
        {
            var lineup = new MatchLineup
            {
                Id = Guid.NewGuid(),
                MatchId = request.MatchId,
                PlayerId = player.PlayerId,
                TeamId = request.TeamId,
                IsStarter = player.IsStarter,
                Position = player.Position,
                JerseyNumber = player.JerseyNumber
            };
            db.MatchLineups.Add(lineup);
        }

        await db.SaveChangesAsync(cancellationToken);

        return new SetLineupResponse(request.MatchId, request.TeamId, request.Players.Count);
    }
}

public class SetLineupValidator : AbstractValidator<SetLineupCommand>
{
    public SetLineupValidator(FutbolDbContext db)
    {
        RuleFor(x => x.MatchId)
            .NotEmpty().WithMessage("Match is required");

        RuleFor(x => x.TeamId)
            .NotEmpty().WithMessage("Team is required");

        RuleFor(x => x.Players)
            .NotEmpty().WithMessage("Players are required")
            .Must(players => players.Count(p => p.IsStarter) == 11)
            .WithMessage("Debe haber exactamente 11 titulares")
            .Must(players => players.Count(p => !p.IsStarter) >= 1)
            .WithMessage("Debe haber al menos 1 suplente");

        RuleForEach(x => x.Players)
            .ChildRules(player =>
            {
                player.RuleFor(p => p.PlayerId)
                    .NotEmpty().WithMessage("Player is required");

                player.RuleFor(p => p.JerseyNumber)
                    .InclusiveBetween(1, 99).WithMessage("Jersey number must be between 1 and 99");
            });
    }
}
