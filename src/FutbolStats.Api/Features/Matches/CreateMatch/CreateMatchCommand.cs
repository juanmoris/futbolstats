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
        var matchDate = request.MatchDate.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(request.MatchDate, DateTimeKind.Utc)
            : request.MatchDate.ToUniversalTime();

        var matchDateOnly = DateOnly.FromDateTime(matchDate);

        // Find coach for home team on match date
        var homeCoachAssignment = await db.CoachTeamAssignments
            .Where(a => a.TeamId == request.HomeTeamId
                && a.StartDate <= matchDateOnly
                && (a.EndDate == null || a.EndDate >= matchDateOnly))
            .FirstOrDefaultAsync(cancellationToken);

        // Find coach for away team on match date
        var awayCoachAssignment = await db.CoachTeamAssignments
            .Where(a => a.TeamId == request.AwayTeamId
                && a.StartDate <= matchDateOnly
                && (a.EndDate == null || a.EndDate >= matchDateOnly))
            .FirstOrDefaultAsync(cancellationToken);

        var match = new Match
        {
            Id = Guid.NewGuid(),
            ChampionshipId = request.ChampionshipId,
            HomeTeamId = request.HomeTeamId,
            AwayTeamId = request.AwayTeamId,
            HomeCoachId = homeCoachAssignment?.CoachId,
            AwayCoachId = awayCoachAssignment?.CoachId,
            MatchDate = matchDate,
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
            .NotEmpty().WithMessage("El campeonato es requerido")
            .MustAsync(async (id, ct) => await db.Championships.AnyAsync(c => c.Id == id, ct))
            .WithMessage("El campeonato no existe");

        RuleFor(x => x.HomeTeamId)
            .NotEmpty().WithMessage("El equipo local es requerido")
            .MustAsync(async (id, ct) => await db.Teams.AnyAsync(t => t.Id == id, ct))
            .WithMessage("El equipo local no existe");

        RuleFor(x => x.AwayTeamId)
            .NotEmpty().WithMessage("El equipo visitante es requerido")
            .NotEqual(x => x.HomeTeamId).WithMessage("El equipo local y visitante deben ser diferentes")
            .MustAsync(async (id, ct) => await db.Teams.AnyAsync(t => t.Id == id, ct))
            .WithMessage("El equipo visitante no existe");

        RuleFor(x => x.MatchDate)
            .NotEmpty().WithMessage("La fecha del partido es requerida");

        RuleFor(x => x.Matchday)
            .GreaterThan(0).WithMessage("La jornada debe ser mayor a 0");

        RuleFor(x => x.Stadium)
            .MaximumLength(200).WithMessage("El estadio no debe exceder 200 caracteres")
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
            .WithMessage("Ambos equipos deben estar registrados en el campeonato");
    }
}
