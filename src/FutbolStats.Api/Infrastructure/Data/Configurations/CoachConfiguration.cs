using FutbolStats.Api.Features.Coaches.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FutbolStats.Api.Infrastructure.Data.Configurations;

public class CoachConfiguration : IEntityTypeConfiguration<Coach>
{
    public void Configure(EntityTypeBuilder<Coach> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.FirstName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.LastName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.PhotoUrl)
            .HasMaxLength(500);

        builder.HasOne(c => c.Country)
            .WithMany()
            .HasForeignKey(c => c.CountryId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(c => c.TeamAssignments)
            .WithOne(a => a.Coach)
            .HasForeignKey(a => a.CoachId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Ignore(c => c.FullName);
    }
}
