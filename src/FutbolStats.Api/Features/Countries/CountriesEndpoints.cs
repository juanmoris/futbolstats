using FutbolStats.Api.Features.Countries.CreateCountry;
using FutbolStats.Api.Features.Countries.DeleteCountry;
using FutbolStats.Api.Features.Countries.GetCountries;
using FutbolStats.Api.Features.Countries.UpdateCountry;
using MediatR;

namespace FutbolStats.Api.Features.Countries;

public static class CountriesEndpoints
{
    public static void MapCountriesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/countries")
            .WithTags("Countries");

        // GET /api/countries
        group.MapGet("/", async (
            IMediator mediator,
            int page = 1,
            int pageSize = 100,
            string? search = null) =>
        {
            var result = await mediator.Send(new GetCountriesQuery(page, pageSize, search));
            return Results.Ok(result);
        })
        .WithName("GetCountries")
        .WithOpenApi();

        // POST /api/countries
        group.MapPost("/", async (CreateCountryCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            return Results.Created($"/api/countries/{result.Id}", result);
        })
        .WithName("CreateCountry")
        .RequireAuthorization()
        .WithOpenApi();

        // PUT /api/countries/{id}
        group.MapPut("/{id:guid}", async (Guid id, UpdateCountryRequest request, IMediator mediator) =>
        {
            var command = new UpdateCountryCommand(
                id,
                request.Name,
                request.Code,
                request.FlagUrl
            );
            var result = await mediator.Send(command);
            return Results.Ok(result);
        })
        .WithName("UpdateCountry")
        .RequireAuthorization()
        .WithOpenApi();

        // DELETE /api/countries/{id}
        group.MapDelete("/{id:guid}", async (Guid id, IMediator mediator) =>
        {
            await mediator.Send(new DeleteCountryCommand(id));
            return Results.NoContent();
        })
        .WithName("DeleteCountry")
        .RequireAuthorization()
        .WithOpenApi();
    }
}

public record UpdateCountryRequest(
    string Name,
    string Code,
    string? FlagUrl
);
