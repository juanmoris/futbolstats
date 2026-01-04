using FutbolStats.Api.Features.Matches.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FutbolStats.Api.Infrastructure.Data.Configurations;

public class MatchConfiguration : IEntityTypeConfiguration<Match>
{
    public void Configure(EntityTypeBuilder<Match> builder)
    {
        builder.HasKey(m => m.Id);

        builder.Property(m => m.Stadium)
            .HasMaxLength(200);

        builder.HasOne(m => m.Championship)
            .WithMany(c => c.Matches)
            .HasForeignKey(m => m.ChampionshipId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(m => m.HomeTeam)
            .WithMany()
            .HasForeignKey(m => m.HomeTeamId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(m => m.AwayTeam)
            .WithMany()
            .HasForeignKey(m => m.AwayTeamId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(m => m.ChampionshipId);
        builder.HasIndex(m => m.MatchDate);
        builder.HasIndex(m => m.Status);
        builder.HasIndex(m => new { m.ChampionshipId, m.Matchday });
    }
}

public class MatchLineupConfiguration : IEntityTypeConfiguration<MatchLineup>
{
    public void Configure(EntityTypeBuilder<MatchLineup> builder)
    {
        builder.HasKey(ml => ml.Id);

        builder.Property(ml => ml.Position)
            .HasMaxLength(50);

        builder.HasOne(ml => ml.Match)
            .WithMany(m => m.Lineups)
            .HasForeignKey(ml => ml.MatchId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ml => ml.Player)
            .WithMany()
            .HasForeignKey(ml => ml.PlayerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ml => ml.Team)
            .WithMany()
            .HasForeignKey(ml => ml.TeamId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(ml => new { ml.MatchId, ml.PlayerId })
            .IsUnique();
    }
}
