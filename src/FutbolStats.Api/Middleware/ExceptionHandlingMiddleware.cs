using System.Text.Json;
using FutbolStats.Api.Common.Exceptions;

namespace FutbolStats.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, response) = exception switch
        {
            ValidationException validationEx => (
                StatusCodes.Status400BadRequest,
                new ErrorResponse("Validation Error", validationEx.Errors)
            ),
            NotFoundException notFoundEx => (
                StatusCodes.Status404NotFound,
                new ErrorResponse(notFoundEx.Message)
            ),
            UnauthorizedAccessException => (
                StatusCodes.Status401Unauthorized,
                new ErrorResponse("Unauthorized")
            ),
            _ => (
                StatusCodes.Status500InternalServerError,
                new ErrorResponse("An unexpected error occurred")
            )
        };

        if (statusCode == StatusCodes.Status500InternalServerError)
        {
            _logger.LogError(exception, "An unexpected error occurred");
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
    }
}

public record ErrorResponse(string Message, IDictionary<string, string[]>? Errors = null);
