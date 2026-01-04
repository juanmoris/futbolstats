using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using FluentValidation;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace FutbolStats.Api.Features.Auth.RefreshToken;

public record RefreshTokenCommand(string AccessToken, string RefreshToken) : IRequest<RefreshTokenResponse>;

public record RefreshTokenResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt
);

public class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(x => x.AccessToken)
            .NotEmpty().WithMessage("Access token is required");

        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Refresh token is required");
    }
}

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, RefreshTokenResponse>
{
    private readonly FutbolDbContext _context;
    private readonly IConfiguration _configuration;

    public RefreshTokenCommandHandler(FutbolDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<RefreshTokenResponse> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var principal = GetPrincipalFromExpiredToken(request.AccessToken, jwtSettings);

        if (principal == null)
        {
            throw new UnauthorizedAccessException("Invalid access token");
        }

        var userIdClaim = principal.FindFirst(JwtRegisteredClaimNames.Sub)
            ?? principal.FindFirst(ClaimTypes.NameIdentifier);

        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid token claims");
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive, cancellationToken);

        if (user == null)
        {
            throw new UnauthorizedAccessException("User not found or inactive");
        }

        var expirationMinutes = int.Parse(jwtSettings["ExpirationMinutes"] ?? "60");
        var expiresAt = DateTime.UtcNow.AddMinutes(expirationMinutes);

        var newAccessToken = GenerateJwtToken(user, jwtSettings, expiresAt);
        var newRefreshToken = GenerateRefreshToken();

        return new RefreshTokenResponse(newAccessToken, newRefreshToken, expiresAt);
    }

    private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token, IConfigurationSection jwtSettings)
    {
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidateIssuer = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!)),
            ValidateLifetime = false // Allow expired tokens
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        try
        {
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);

            if (securityToken is not JwtSecurityToken jwtSecurityToken ||
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
            }

            return principal;
        }
        catch
        {
            return null;
        }
    }

    private string GenerateJwtToken(Entities.User user, IConfigurationSection jwtSettings, DateTime expiresAt)
    {
        var securityKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }
}
