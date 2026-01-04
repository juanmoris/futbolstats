using System.Security.Cryptography;
using System.Text;
using FutbolStats.Api.Common;
using FutbolStats.Api.Features.Auth.Entities;
using FutbolStats.Api.Features.Championships.Entities;
using FutbolStats.Api.Features.MatchEvents.Entities;
using FutbolStats.Api.Features.Matches.Entities;
using FutbolStats.Api.Features.Players.Entities;
using FutbolStats.Api.Features.Teams.Entities;
using Microsoft.EntityFrameworkCore;

namespace FutbolStats.Api.Infrastructure.Data;

public class FutbolDbContext : DbContext
{
    public FutbolDbContext(DbContextOptions<FutbolDbContext> options) : base(options)
    {
    }

    public DbSet<Championship> Championships => Set<Championship>();
    public DbSet<ChampionshipTeam> ChampionshipTeams => Set<ChampionshipTeam>();
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<Player> Players => Set<Player>();
    public DbSet<Match> Matches => Set<Match>();
    public DbSet<MatchLineup> MatchLineups => Set<MatchLineup>();
    public DbSet<MatchEvent> MatchEvents => Set<MatchEvent>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(FutbolDbContext).Assembly);

        // Seed admin user - Password: Admin123!
        var adminPasswordHash = Convert.ToBase64String(
            SHA256.HashData(Encoding.UTF8.GetBytes("Admin123!")));

        modelBuilder.Entity<User>().HasData(new User
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            Email = "admin@futbolstats.com",
            PasswordHash = adminPasswordHash,
            FullName = "Administrador",
            Role = UserRole.Admin,
            IsActive = true,
            CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });

        base.OnModelCreating(modelBuilder);
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

        foreach (var entry in entries)
        {
            var now = DateTime.UtcNow;

            if (entry.State == EntityState.Added)
            {
                if (entry.Entity.GetType().GetProperty("CreatedAt") != null)
                {
                    entry.Property("CreatedAt").CurrentValue = now;
                }
            }

            if (entry.Entity.GetType().GetProperty("UpdatedAt") != null)
            {
                entry.Property("UpdatedAt").CurrentValue = now;
            }
        }
    }
}
