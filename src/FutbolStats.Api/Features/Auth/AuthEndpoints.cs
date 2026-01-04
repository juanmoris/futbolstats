using FutbolStats.Api.Features.Auth.GetCurrentUser;
using FutbolStats.Api.Features.Auth.Login;
using FutbolStats.Api.Features.Auth.RefreshToken;
using MediatR;

namespace FutbolStats.Api.Features.Auth;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth")
            .WithTags("Authentication");

        // POST /api/auth/login
        group.MapPost("/login", async (LoginCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            return Results.Ok(result);
        })
        .WithName("Login")
        .AllowAnonymous()
        .WithOpenApi();

        // POST /api/auth/refresh
        group.MapPost("/refresh", async (RefreshTokenCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            return Results.Ok(result);
        })
        .WithName("RefreshToken")
        .AllowAnonymous()
        .WithOpenApi();

        // GET /api/auth/me
        group.MapGet("/me", async (HttpContext context, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetCurrentUserQuery(context.User));
            return Results.Ok(result);
        })
        .WithName("GetCurrentUser")
        .RequireAuthorization()
        .WithOpenApi();
    }
}
