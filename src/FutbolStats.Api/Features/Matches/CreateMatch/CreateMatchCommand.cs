using FluentValidation;
using FutbolStats.Api.Common;
using FutbolStats.Api.Features.Matches.Entities;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Matches.CreateMatch;

public record CreateMatchCommand(
    Guid ChampionshipId,
    Guid HomeTeamId,
    Guid AwayTeamId,
    DateTime MatchDate,
    string? Stadium,
    int Matchday
) : IRequest<CreateMatchResponse>;

public record CreateMatchResponse(Guid Id, DateTime MatchDate, int Matchday);

public class CreateMatchHandler(FutbolDbContext db)
    : IRequestHandler<CreateMatchCommand, CreateMatchResponse>
{
    public async Task<CreateMatchResponse> Handle(
        CreateMatchCommand request,
        CancellationToken cancellationToken)
    {
        var match = new Match
        {
            Id = Guid.NewGuid(),
            ChampionshipId = request.ChampionshipId,
            HomeTeamId = request.HomeTeamId,
            AwayTeamId = request.AwayTeamId,
            MatchDate = request.MatchDate,
            Stadium = request.Stadium,
            Matchday = request.Matchday,
            Status = MatchStatus.Scheduled,
            HomeScore = 0,
            AwayScore = 0
        };

        db.Matches.Add(match);
        await db.SaveChangesAsync(cancellationToken);

        return new CreateMatchResponse(match.Id, match.MatchDate, match.Matchday);
    }
}

public class CreateMatchValidator : AbstractValidator<CreateMatchCommand>
{
    public CreateMatchValidator(FutbolDbContext db)
    {
        RuleFor(x => x.ChampionshipId)
            .NotEmpty().WithMessage("Championship is required")
            .MustAsync(async (id, ct) => await db.Championships.AnyAsync(c => c.Id == id, ct))
            .WithMessage("Championship does not exist");

        RuleFor(x => x.HomeTeamId)
            .NotEmpty().WithMessage("Home team is required")
            .MustAsync(async (id, ct) => await db.Teams.AnyAsync(t => t.Id == id, ct))
            .WithMessage("Home team does not exist");

        RuleFor(x => x.AwayTeamId)
            .NotEmpty().WithMessage("Away team is required")
            .NotEqual(x => x.HomeTeamId).WithMessage("Home and away teams must be different")
            .MustAsync(async (id, ct) => await db.Teams.AnyAsync(t => t.Id == id, ct))
            .WithMessage("Away team does not exist");

        RuleFor(x => x.MatchDate)
            .NotEmpty().WithMessage("Match date is required");

        RuleFor(x => x.Matchday)
            .GreaterThan(0).WithMessage("Matchday must be greater than 0");

        RuleFor(x => x.Stadium)
            .MaximumLength(200).WithMessage("Stadium must not exceed 200 characters")
            .When(x => !string.IsNullOrEmpty(x.Stadium));

        RuleFor(x => x)
            .MustAsync(async (cmd, ct) =>
            {
                // Verify both teams are registered in the championship
                var homeTeamInChampionship = await db.ChampionshipTeams
                    .AnyAsync(ct2 => ct2.ChampionshipId == cmd.ChampionshipId && ct2.TeamId == cmd.HomeTeamId, ct);
                var awayTeamInChampionship = await db.ChampionshipTeams
                    .AnyAsync(ct2 => ct2.ChampionshipId == cmd.ChampionshipId && ct2.TeamId == cmd.AwayTeamId, ct);
                return homeTeamInChampionship && awayTeamInChampionship;
            })
            .WithMessage("Both teams must be registered in the championship");
    }
}
