using FutbolStats.Api.Common;
using FutbolStats.Api.Features.Championships.CreateChampionship;
using FutbolStats.Api.Features.Championships.DeleteChampionship;
using FutbolStats.Api.Features.Championships.GetChampionshipById;
using FutbolStats.Api.Features.Championships.GetChampionships;
using FutbolStats.Api.Features.Championships.UpdateChampionship;
using MediatR;

namespace FutbolStats.Api.Features.Championships;

public static class ChampionshipsEndpoints
{
    public static void MapChampionshipsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/championships")
            .WithTags("Championships");

        // GET /api/championships
        group.MapGet("/", async (
            IMediator mediator,
            int page = 1,
            int pageSize = 10,
            ChampionshipStatus? status = null) =>
        {
            var result = await mediator.Send(new GetChampionshipsQuery(page, pageSize, status));
            return Results.Ok(result);
        })
        .WithName("GetChampionships")
        .WithOpenApi();

        // GET /api/championships/{id}
        group.MapGet("/{id:guid}", async (Guid id, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetChampionshipByIdQuery(id));
            return Results.Ok(result);
        })
        .WithName("GetChampionshipById")
        .WithOpenApi();

        // POST /api/championships
        group.MapPost("/", async (CreateChampionshipCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            return Results.Created($"/api/championships/{result.Id}", result);
        })
        .WithName("CreateChampionship")
        .RequireAuthorization()
        .WithOpenApi();

        // PUT /api/championships/{id}
        group.MapPut("/{id:guid}", async (Guid id, UpdateChampionshipRequest request, IMediator mediator) =>
        {
            var command = new UpdateChampionshipCommand(
                id,
                request.Name,
                request.Season,
                request.StartDate,
                request.EndDate,
                request.Status
            );
            var result = await mediator.Send(command);
            return Results.Ok(result);
        })
        .WithName("UpdateChampionship")
        .RequireAuthorization()
        .WithOpenApi();

        // DELETE /api/championships/{id}
        group.MapDelete("/{id:guid}", async (Guid id, IMediator mediator) =>
        {
            await mediator.Send(new DeleteChampionshipCommand(id));
            return Results.NoContent();
        })
        .WithName("DeleteChampionship")
        .RequireAuthorization()
        .WithOpenApi();
    }
}

public record UpdateChampionshipRequest(
    string Name,
    string Season,
    DateOnly StartDate,
    DateOnly EndDate,
    ChampionshipStatus Status
);
