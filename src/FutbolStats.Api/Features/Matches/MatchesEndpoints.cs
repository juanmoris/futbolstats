using FutbolStats.Api.Common;
using FutbolStats.Api.Features.Matches.CreateMatch;
using FutbolStats.Api.Features.Matches.EndMatch;
using FutbolStats.Api.Features.Matches.GetMatchById;
using FutbolStats.Api.Features.Matches.GetMatches;
using FutbolStats.Api.Features.Matches.GetLiveMatches;
using FutbolStats.Api.Features.Matches.HalfTime;
using FutbolStats.Api.Features.Matches.SetLineup;
using FutbolStats.Api.Features.Matches.StartMatch;
using FutbolStats.Api.Features.Matches.UpdateMatch;
using MediatR;

namespace FutbolStats.Api.Features.Matches;

public static class MatchesEndpoints
{
    public static void MapMatchesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/matches")
            .WithTags("Matches");

        // GET /api/matches
        group.MapGet("/", async (
            IMediator mediator,
            int page = 1,
            int pageSize = 10,
            Guid? championshipId = null,
            Guid? teamId = null,
            MatchStatus? status = null,
            int? matchday = null) =>
        {
            var result = await mediator.Send(new GetMatchesQuery(
                page, pageSize, championshipId, teamId, status, matchday));
            return Results.Ok(result);
        })
        .WithName("GetMatches")
        .WithOpenApi();

        // GET /api/matches/live
        group.MapGet("/live", async (IMediator mediator) =>
        {
            var result = await mediator.Send(new GetLiveMatchesQuery());
            return Results.Ok(result);
        })
        .WithName("GetLiveMatches")
        .WithOpenApi();

        // GET /api/matches/{id}
        group.MapGet("/{id:guid}", async (Guid id, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetMatchByIdQuery(id));
            return Results.Ok(result);
        })
        .WithName("GetMatchById")
        .WithOpenApi();

        // POST /api/matches
        group.MapPost("/", async (CreateMatchCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            return Results.Created($"/api/matches/{result.Id}", result);
        })
        .WithName("CreateMatch")
        .RequireAuthorization()
        .WithOpenApi();

        // PUT /api/matches/{id}
        group.MapPut("/{id:guid}", async (Guid id, UpdateMatchRequest request, IMediator mediator) =>
        {
            var command = new UpdateMatchCommand(id, request.MatchDate, request.Stadium, request.Matchday);
            var result = await mediator.Send(command);
            return Results.Ok(result);
        })
        .WithName("UpdateMatch")
        .RequireAuthorization()
        .WithOpenApi();

        // POST /api/matches/{id}/lineup
        group.MapPost("/{id:guid}/lineup", async (Guid id, SetLineupRequest request, IMediator mediator) =>
        {
            var command = new SetLineupCommand(id, request.TeamId, request.Players);
            var result = await mediator.Send(command);
            return Results.Ok(result);
        })
        .WithName("SetMatchLineup")
        .RequireAuthorization()
        .WithOpenApi();

        // POST /api/matches/{id}/start
        group.MapPost("/{id:guid}/start", async (Guid id, IMediator mediator) =>
        {
            var result = await mediator.Send(new StartMatchCommand(id));
            return Results.Ok(result);
        })
        .WithName("StartMatch")
        .RequireAuthorization()
        .WithOpenApi();

        // POST /api/matches/{id}/halftime
        group.MapPost("/{id:guid}/halftime", async (Guid id, IMediator mediator) =>
        {
            var result = await mediator.Send(new HalfTimeCommand(id));
            return Results.Ok(result);
        })
        .WithName("HalfTime")
        .RequireAuthorization()
        .WithOpenApi();

        // POST /api/matches/{id}/end
        group.MapPost("/{id:guid}/end", async (Guid id, IMediator mediator) =>
        {
            var result = await mediator.Send(new EndMatchCommand(id));
            return Results.Ok(result);
        })
        .WithName("EndMatch")
        .RequireAuthorization()
        .WithOpenApi();
    }
}

public record UpdateMatchRequest(DateTime MatchDate, string? Stadium, int Matchday);

public record SetLineupRequest(Guid TeamId, List<LineupPlayerDto> Players);
