using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using FluentValidation;
using FutbolStats.Api.Common.Exceptions;
using FutbolStats.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace FutbolStats.Api.Features.Auth.Login;

public record LoginCommand(string Email, string Password) : IRequest<LoginResponse>;

public record LoginResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    UserDto User
);

public record UserDto(
    Guid Id,
    string Email,
    string FullName,
    string Role
);

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required");
    }
}

public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResponse>
{
    private readonly FutbolDbContext _context;
    private readonly IConfiguration _configuration;

    public LoginCommandHandler(FutbolDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<LoginResponse> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive, cancellationToken);

        if (user == null)
        {
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        if (!VerifyPassword(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        // Update last login
        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        var jwtSettings = _configuration.GetSection("JwtSettings");
        var expirationMinutes = int.Parse(jwtSettings["ExpirationMinutes"] ?? "60");
        var expiresAt = DateTime.UtcNow.AddMinutes(expirationMinutes);

        var accessToken = GenerateJwtToken(user, jwtSettings, expiresAt);
        var refreshToken = GenerateRefreshToken();

        return new LoginResponse(
            accessToken,
            refreshToken,
            expiresAt,
            new UserDto(user.Id, user.Email, user.FullName, user.Role.ToString())
        );
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

    private bool VerifyPassword(string password, string passwordHash)
    {
        // Simple hash verification - in production use BCrypt or similar
        var hash = Convert.ToBase64String(
            SHA256.HashData(Encoding.UTF8.GetBytes(password)));
        return hash == passwordHash;
    }
}
