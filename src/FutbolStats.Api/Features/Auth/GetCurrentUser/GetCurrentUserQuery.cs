using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Features.Auth.GetCurrentUser;

public record GetCurrentUserQuery(ClaimsPrincipal User) : IRequest<CurrentUserResponse>;

public record CurrentUserResponse(
    Guid Id,
    string Email,
    string FullName,
    string Role,
    DateTime CreatedAt,
    DateTime? LastLoginAt
);

public class GetCurrentUserQueryHandler : IRequestHandler<GetCurrentUserQuery, CurrentUserResponse>
{
    private readonly FutbolDbContext _context;

    public GetCurrentUserQueryHandler(FutbolDbContext context)
    {
        _context = context;
    }

    public async Task<CurrentUserResponse> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
    {
        var userIdClaim = request.User.FindFirst(JwtRegisteredClaimNames.Sub)
            ?? request.User.FindFirst(ClaimTypes.NameIdentifier);

        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid token");
        }

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null)
        {
            throw new NotFoundException("User", userId);
        }

        return new CurrentUserResponse(
            user.Id,
            user.Email,
            user.FullName,
            user.Role.ToString(),
            user.CreatedAt,
            user.LastLoginAt
        );
    }
}
