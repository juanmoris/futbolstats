using FutbolStats.Api.Features.Championships.GetStandings;
using FutbolStats.Api.Features.Statistics.GetPlayerStatistics;
using FutbolStats.Api.Features.Statistics.GetTeamStatistics;
using FutbolStats.Api.Features.Statistics.GetTopScorers;
using MediatR;

namespace FutbolStats.Api.Features.Statistics;

public static class StatisticsEndpoints
{
    public static void MapStatisticsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/statistics")
            .WithTags("Statistics");

        // GET /api/statistics/players/{id}
        group.MapGet("/players/{id:guid}", async (
            Guid id,
            IMediator mediator,
            Guid? championshipId = null) =>
        {
            var result = await mediator.Send(new GetPlayerStatisticsQuery(id, championshipId));
            return Results.Ok(result);
        })
        .WithName("GetPlayerStatistics")
        .WithOpenApi();

        // GET /api/statistics/teams/{id}
        group.MapGet("/teams/{id:guid}", async (
            Guid id,
            IMediator mediator,
            Guid? championshipId = null) =>
        {
            var result = await mediator.Send(new GetTeamStatisticsQuery(id, championshipId));
            return Results.Ok(result);
        })
        .WithName("GetTeamStatistics")
        .WithOpenApi();

        // GET /api/statistics/championships/{id}/standings
        group.MapGet("/championships/{id:guid}/standings", async (Guid id, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetStandingsQuery(id));
            return Results.Ok(result);
        })
        .WithName("GetStandings")
        .WithOpenApi();

        // GET /api/statistics/championships/{id}/top-scorers
        group.MapGet("/championships/{id:guid}/top-scorers", async (
            Guid id,
            IMediator mediator,
            int limit = 20) =>
        {
            var result = await mediator.Send(new GetTopScorersQuery(id, limit));
            return Results.Ok(result);
        })
        .WithName("GetTopScorers")
        .WithOpenApi();
    }
}
