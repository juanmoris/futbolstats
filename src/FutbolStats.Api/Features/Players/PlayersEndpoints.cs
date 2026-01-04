using FutbolStats.Api.Common;
using FutbolStats.Api.Features.Players.CreatePlayer;
using FutbolStats.Api.Features.Players.DeletePlayer;
using FutbolStats.Api.Features.Players.GetPlayerById;
using FutbolStats.Api.Features.Players.GetPlayers;
using FutbolStats.Api.Features.Players.UpdatePlayer;
using MediatR;

namespace FutbolStats.Api.Features.Players;

public static class PlayersEndpoints
{
    public static void MapPlayersEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/players")
            .WithTags("Players");

        // GET /api/players
        group.MapGet("/", async (
            IMediator mediator,
            int page = 1,
            int pageSize = 10,
            Guid? teamId = null,
            PlayerPosition? position = null,
            string? search = null,
            bool onlyActive = true) =>
        {
            var result = await mediator.Send(new GetPlayersQuery(
                page, pageSize, teamId, position, search, onlyActive));
            return Results.Ok(result);
        })
        .WithName("GetPlayers")
        .WithOpenApi();

        // GET /api/players/{id}
        group.MapGet("/{id:guid}", async (Guid id, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetPlayerByIdQuery(id));
            return Results.Ok(result);
        })
        .WithName("GetPlayerById")
        .WithOpenApi();

        // POST /api/players
        group.MapPost("/", async (CreatePlayerCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            return Results.Created($"/api/players/{result.Id}", result);
        })
        .WithName("CreatePlayer")
        .RequireAuthorization()
        .WithOpenApi();

        // PUT /api/players/{id}
        group.MapPut("/{id:guid}", async (Guid id, UpdatePlayerRequest request, IMediator mediator) =>
        {
            var command = new UpdatePlayerCommand(
                id,
                request.FirstName,
                request.LastName,
                request.Number,
                request.Position,
                request.BirthDate,
                request.Nationality,
                request.PhotoUrl,
                request.TeamId,
                request.IsActive
            );
            var result = await mediator.Send(command);
            return Results.Ok(result);
        })
        .WithName("UpdatePlayer")
        .RequireAuthorization()
        .WithOpenApi();

        // DELETE /api/players/{id}
        group.MapDelete("/{id:guid}", async (Guid id, IMediator mediator) =>
        {
            await mediator.Send(new DeletePlayerCommand(id));
            return Results.NoContent();
        })
        .WithName("DeletePlayer")
        .RequireAuthorization()
        .WithOpenApi();
    }
}

public record UpdatePlayerRequest(
    string FirstName,
    string LastName,
    int Number,
    PlayerPosition Position,
    DateOnly? BirthDate,
    string? Nationality,
    string? PhotoUrl,
    Guid TeamId,
    bool IsActive
);
