using FutbolStats.Api.Features.MatchEvents.DeleteEvent;
using FutbolStats.Api.Features.MatchEvents.GetMatchEvents;
using FutbolStats.Api.Features.MatchEvents.RecordCard;
using FutbolStats.Api.Features.MatchEvents.RecordGoal;
using FutbolStats.Api.Features.MatchEvents.RecordSubstitution;
using MediatR;

namespace FutbolStats.Api.Features.MatchEvents;

public static class MatchEventsEndpoints
{
    public static void MapMatchEventsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/matches/{matchId:guid}/events")
            .WithTags("Match Events");

        // GET /api/matches/{matchId}/events
        group.MapGet("/", async (Guid matchId, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetMatchEventsQuery(matchId));
            return Results.Ok(result);
        })
        .WithName("GetMatchEvents")
        .WithOpenApi();

        // POST /api/matches/{matchId}/events/goal
        group.MapPost("/goal", async (Guid matchId, RecordGoalRequest request, IMediator mediator) =>
        {
            var command = new RecordGoalCommand(
                matchId,
                request.ScorerId,
                request.TeamId,
                request.Minute,
                request.ExtraMinute,
                request.AssistPlayerId,
                request.IsOwnGoal,
                request.IsPenalty
            );
            var result = await mediator.Send(command);
            return Results.Created($"/api/matches/{matchId}/events/{result.EventId}", result);
        })
        .WithName("RecordGoal")
        .RequireAuthorization()
        .WithOpenApi();

        // POST /api/matches/{matchId}/events/card
        group.MapPost("/card", async (Guid matchId, RecordCardRequest request, IMediator mediator) =>
        {
            var command = new RecordCardCommand(
                matchId,
                request.PlayerId,
                request.TeamId,
                request.Minute,
                request.ExtraMinute,
                request.IsRed,
                request.Reason
            );
            var result = await mediator.Send(command);
            return Results.Created($"/api/matches/{matchId}/events/{result.EventId}", result);
        })
        .WithName("RecordCard")
        .RequireAuthorization()
        .WithOpenApi();

        // POST /api/matches/{matchId}/events/substitution
        group.MapPost("/substitution", async (Guid matchId, RecordSubstitutionRequest request, IMediator mediator) =>
        {
            var command = new RecordSubstitutionCommand(
                matchId,
                request.PlayerOutId,
                request.PlayerInId,
                request.TeamId,
                request.Minute,
                request.ExtraMinute
            );
            var result = await mediator.Send(command);
            return Results.Created($"/api/matches/{matchId}/events", result);
        })
        .WithName("RecordSubstitution")
        .RequireAuthorization()
        .WithOpenApi();

        // DELETE /api/matches/{matchId}/events/{eventId}
        group.MapDelete("/{eventId:guid}", async (Guid matchId, Guid eventId, IMediator mediator) =>
        {
            await mediator.Send(new DeleteEventCommand(matchId, eventId));
            return Results.NoContent();
        })
        .WithName("DeleteEvent")
        .RequireAuthorization()
        .WithOpenApi();
    }
}

public record RecordGoalRequest(
    Guid ScorerId,
    Guid TeamId,
    int Minute,
    int? ExtraMinute,
    Guid? AssistPlayerId,
    bool IsOwnGoal = false,
    bool IsPenalty = false
);

public record RecordCardRequest(
    Guid PlayerId,
    Guid TeamId,
    int Minute,
    int? ExtraMinute,
    bool IsRed,
    string? Reason
);

public record RecordSubstitutionRequest(
    Guid PlayerOutId,
    Guid PlayerInId,
    Guid TeamId,
    int Minute,
    int? ExtraMinute
);
