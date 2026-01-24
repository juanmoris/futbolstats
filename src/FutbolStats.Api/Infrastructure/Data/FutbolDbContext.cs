using System.Security.Cryptography;
using System.Text;
using FutbolStats.Api.Common;
using FutbolStats.Api.Features.Auth.Entities;
using FutbolStats.Api.Features.Championships.Entities;
using FutbolStats.Api.Features.Coaches.Entities;
using FutbolStats.Api.Features.Countries.Entities;
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
    public DbSet<Coach> Coaches => Set<Coach>();
    public DbSet<CoachTeamAssignment> CoachTeamAssignments => Set<CoachTeamAssignment>();
    public DbSet<Country> Countries => Set<Country>();
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

        // Seed countries
        var seedDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        modelBuilder.Entity<Country>().HasData(
            // Sudamerica
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000001"), Name = "Argentina", Code = "AR", FlagUrl = "https://flagcdn.com/w80/ar.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000002"), Name = "Bolivia", Code = "BO", FlagUrl = "https://flagcdn.com/w80/bo.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000003"), Name = "Brasil", Code = "BR", FlagUrl = "https://flagcdn.com/w80/br.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000004"), Name = "Chile", Code = "CL", FlagUrl = "https://flagcdn.com/w80/cl.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000005"), Name = "Colombia", Code = "CO", FlagUrl = "https://flagcdn.com/w80/co.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000006"), Name = "Ecuador", Code = "EC", FlagUrl = "https://flagcdn.com/w80/ec.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000007"), Name = "Paraguay", Code = "PY", FlagUrl = "https://flagcdn.com/w80/py.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000008"), Name = "Peru", Code = "PE", FlagUrl = "https://flagcdn.com/w80/pe.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000009"), Name = "Uruguay", Code = "UY", FlagUrl = "https://flagcdn.com/w80/uy.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000010"), Name = "Venezuela", Code = "VE", FlagUrl = "https://flagcdn.com/w80/ve.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            // Centroamerica y Norteamerica
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000011"), Name = "Mexico", Code = "MX", FlagUrl = "https://flagcdn.com/w80/mx.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000012"), Name = "Estados Unidos", Code = "US", FlagUrl = "https://flagcdn.com/w80/us.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000013"), Name = "Costa Rica", Code = "CR", FlagUrl = "https://flagcdn.com/w80/cr.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000014"), Name = "Panama", Code = "PA", FlagUrl = "https://flagcdn.com/w80/pa.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000015"), Name = "Honduras", Code = "HN", FlagUrl = "https://flagcdn.com/w80/hn.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            // Europa
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000016"), Name = "Espana", Code = "ES", FlagUrl = "https://flagcdn.com/w80/es.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000017"), Name = "Alemania", Code = "DE", FlagUrl = "https://flagcdn.com/w80/de.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000018"), Name = "Francia", Code = "FR", FlagUrl = "https://flagcdn.com/w80/fr.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000019"), Name = "Italia", Code = "IT", FlagUrl = "https://flagcdn.com/w80/it.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000020"), Name = "Inglaterra", Code = "GB", FlagUrl = "https://flagcdn.com/w80/gb.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000021"), Name = "Portugal", Code = "PT", FlagUrl = "https://flagcdn.com/w80/pt.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000022"), Name = "Paises Bajos", Code = "NL", FlagUrl = "https://flagcdn.com/w80/nl.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000023"), Name = "Belgica", Code = "BE", FlagUrl = "https://flagcdn.com/w80/be.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000024"), Name = "Croacia", Code = "HR", FlagUrl = "https://flagcdn.com/w80/hr.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000025"), Name = "Serbia", Code = "RS", FlagUrl = "https://flagcdn.com/w80/rs.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000026"), Name = "Polonia", Code = "PL", FlagUrl = "https://flagcdn.com/w80/pl.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000027"), Name = "Suiza", Code = "CH", FlagUrl = "https://flagcdn.com/w80/ch.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000028"), Name = "Austria", Code = "AT", FlagUrl = "https://flagcdn.com/w80/at.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            // Africa
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000029"), Name = "Nigeria", Code = "NG", FlagUrl = "https://flagcdn.com/w80/ng.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000030"), Name = "Senegal", Code = "SN", FlagUrl = "https://flagcdn.com/w80/sn.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000031"), Name = "Marruecos", Code = "MA", FlagUrl = "https://flagcdn.com/w80/ma.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000032"), Name = "Ghana", Code = "GH", FlagUrl = "https://flagcdn.com/w80/gh.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000033"), Name = "Camerun", Code = "CM", FlagUrl = "https://flagcdn.com/w80/cm.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            // Asia y Oceania
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000034"), Name = "Japon", Code = "JP", FlagUrl = "https://flagcdn.com/w80/jp.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000035"), Name = "Corea del Sur", Code = "KR", FlagUrl = "https://flagcdn.com/w80/kr.png", CreatedAt = seedDate, UpdatedAt = seedDate },
            new Country { Id = Guid.Parse("00000000-0000-0000-0001-000000000036"), Name = "Australia", Code = "AU", FlagUrl = "https://flagcdn.com/w80/au.png", CreatedAt = seedDate, UpdatedAt = seedDate }
        );

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
