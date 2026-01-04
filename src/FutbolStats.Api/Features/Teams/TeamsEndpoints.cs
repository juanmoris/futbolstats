using FutbolStats.Api.Features.Teams.CreateTeam;
using FutbolStats.Api.Features.Teams.DeleteTeam;
using FutbolStats.Api.Features.Teams.GetTeamById;
using FutbolStats.Api.Features.Teams.GetTeams;
using FutbolStats.Api.Features.Teams.UpdateTeam;
using MediatR;

namespace FutbolStats.Api.Features.Teams;

public static class TeamsEndpoints
{
    public static void MapTeamsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/teams")
            .WithTags("Teams");

        // GET /api/teams
        group.MapGet("/", async (
            IMediator mediator,
            int page = 1,
            int pageSize = 10,
            string? search = null) =>
        {
            var result = await mediator.Send(new GetTeamsQuery(page, pageSize, search));
            return Results.Ok(result);
        })
        .WithName("GetTeams")
        .WithOpenApi();

        // GET /api/teams/{id}
        group.MapGet("/{id:guid}", async (Guid id, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetTeamByIdQuery(id));
            return Results.Ok(result);
        })
        .WithName("GetTeamById")
        .WithOpenApi();

        // POST /api/teams
        group.MapPost("/", async (CreateTeamCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            return Results.Created($"/api/teams/{result.Id}", result);
        })
        .WithName("CreateTeam")
        .RequireAuthorization()
        .WithOpenApi();

        // PUT /api/teams/{id}
        group.MapPut("/{id:guid}", async (Guid id, UpdateTeamRequest request, IMediator mediator) =>
        {
            var command = new UpdateTeamCommand(
                id,
                request.Name,
                request.ShortName,
                request.LogoUrl,
                request.FoundedYear,
                request.Stadium
            );
            var result = await mediator.Send(command);
            return Results.Ok(result);
        })
        .WithName("UpdateTeam")
        .RequireAuthorization()
        .WithOpenApi();

        // DELETE /api/teams/{id}
        group.MapDelete("/{id:guid}", async (Guid id, IMediator mediator) =>
        {
            await mediator.Send(new DeleteTeamCommand(id));
            return Results.NoContent();
        })
        .WithName("DeleteTeam")
        .RequireAuthorization()
        .WithOpenApi();
    }
}

public record UpdateTeamRequest(
    string Name,
    string ShortName,
    string? LogoUrl,
    int? FoundedYear,
    string? Stadium
);
