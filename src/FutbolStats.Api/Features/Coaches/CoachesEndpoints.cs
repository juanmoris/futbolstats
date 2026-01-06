using FutbolStats.Api.Features.Coaches.AssignCoachToTeam;
using FutbolStats.Api.Features.Coaches.CreateCoach;
using FutbolStats.Api.Features.Coaches.DeleteCoach;
using FutbolStats.Api.Features.Coaches.EndCoachAssignment;
using FutbolStats.Api.Features.Coaches.GetCoachById;
using FutbolStats.Api.Features.Coaches.GetCoaches;
using FutbolStats.Api.Features.Coaches.UpdateCoach;
using MediatR;

namespace FutbolStats.Api.Features.Coaches;

public static class CoachesEndpoints
{
    public static void MapCoachesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/coaches")
            .WithTags("Coaches");

        // GET /api/coaches
        group.MapGet("/", async (
            IMediator mediator,
            int page = 1,
            int pageSize = 10,
            string? search = null) =>
        {
            var result = await mediator.Send(new GetCoachesQuery(page, pageSize, search));
            return Results.Ok(result);
        })
        .WithName("GetCoaches")
        .WithOpenApi();

        // GET /api/coaches/{id}
        group.MapGet("/{id:guid}", async (Guid id, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetCoachByIdQuery(id));
            return Results.Ok(result);
        })
        .WithName("GetCoachById")
        .WithOpenApi();

        // POST /api/coaches
        group.MapPost("/", async (CreateCoachCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            return Results.Created($"/api/coaches/{result.Id}", result);
        })
        .WithName("CreateCoach")
        .RequireAuthorization()
        .WithOpenApi();

        // PUT /api/coaches/{id}
        group.MapPut("/{id:guid}", async (Guid id, UpdateCoachRequest request, IMediator mediator) =>
        {
            var command = new UpdateCoachCommand(
                id,
                request.FirstName,
                request.LastName,
                request.Nationality,
                request.PhotoUrl,
                request.BirthDate
            );
            var result = await mediator.Send(command);
            return Results.Ok(result);
        })
        .WithName("UpdateCoach")
        .RequireAuthorization()
        .WithOpenApi();

        // DELETE /api/coaches/{id}
        group.MapDelete("/{id:guid}", async (Guid id, IMediator mediator) =>
        {
            await mediator.Send(new DeleteCoachCommand(id));
            return Results.NoContent();
        })
        .WithName("DeleteCoach")
        .RequireAuthorization()
        .WithOpenApi();

        // POST /api/coaches/{id}/assign - Assign coach to team
        group.MapPost("/{id:guid}/assign", async (Guid id, AssignCoachToTeamRequest request, IMediator mediator) =>
        {
            var command = new AssignCoachToTeamCommand(id, request.TeamId, request.StartDate);
            var result = await mediator.Send(command);
            return Results.Ok(result);
        })
        .WithName("AssignCoachToTeam")
        .RequireAuthorization()
        .WithOpenApi();

        // POST /api/coaches/{id}/end-assignment - End current assignment
        group.MapPost("/{id:guid}/end-assignment", async (Guid id, EndAssignmentRequest request, IMediator mediator) =>
        {
            var command = new EndCoachAssignmentCommand(id, request.EndDate);
            await mediator.Send(command);
            return Results.NoContent();
        })
        .WithName("EndCoachAssignment")
        .RequireAuthorization()
        .WithOpenApi();
    }
}

public record UpdateCoachRequest(
    string FirstName,
    string LastName,
    string? Nationality,
    string? PhotoUrl,
    DateOnly? BirthDate
);

public record AssignCoachToTeamRequest(
    Guid TeamId,
    DateOnly StartDate
);

public record EndAssignmentRequest(
    DateOnly EndDate
);
