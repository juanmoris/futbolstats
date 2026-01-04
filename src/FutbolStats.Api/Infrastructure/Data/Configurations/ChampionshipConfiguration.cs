using FutbolStats.Api.Features.Championships.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FutbolStats.Api.Infrastructure.Data.Configurations;

public class ChampionshipConfiguration : IEntityTypeConfiguration<Championship>
{
    public void Configure(EntityTypeBuilder<Championship> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(c => c.Season)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasIndex(c => new { c.Name, c.Season })
            .IsUnique();
    }
}

public class ChampionshipTeamConfiguration : IEntityTypeConfiguration<ChampionshipTeam>
{
    public void Configure(EntityTypeBuilder<ChampionshipTeam> builder)
    {
        builder.HasKey(ct => ct.Id);

        builder.HasOne(ct => ct.Championship)
            .WithMany(c => c.Teams)
            .HasForeignKey(ct => ct.ChampionshipId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ct => ct.Team)
            .WithMany(t => t.Championships)
            .HasForeignKey(ct => ct.TeamId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(ct => new { ct.ChampionshipId, ct.TeamId })
            .IsUnique();

        builder.Ignore(ct => ct.GoalDifference);
    }
}
