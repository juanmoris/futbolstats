using FutbolStats.Api.Features.Teams.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FutbolStats.Api.Infrastructure.Data.Configurations;

public class TeamConfiguration : IEntityTypeConfiguration<Team>
{
    public void Configure(EntityTypeBuilder<Team> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(t => t.ShortName)
            .IsRequired()
            .HasMaxLength(5);

        builder.Property(t => t.LogoUrl)
            .HasMaxLength(500);

        builder.Property(t => t.Stadium)
            .HasMaxLength(200);

        builder.HasIndex(t => t.Name)
            .IsUnique();

        builder.HasIndex(t => t.ShortName)
            .IsUnique();
    }
}
