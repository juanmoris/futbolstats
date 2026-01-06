using FutbolStats.Api.Features.Coaches.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FutbolStats.Api.Infrastructure.Data.Configurations;

public class CoachTeamAssignmentConfiguration : IEntityTypeConfiguration<CoachTeamAssignment>
{
    public void Configure(EntityTypeBuilder<CoachTeamAssignment> builder)
    {
        builder.HasKey(a => a.Id);

        builder.Property(a => a.StartDate)
            .IsRequired();

        builder.HasOne(a => a.Coach)
            .WithMany(c => c.TeamAssignments)
            .HasForeignKey(a => a.CoachId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.Team)
            .WithMany()
            .HasForeignKey(a => a.TeamId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(a => a.CoachId);
        builder.HasIndex(a => a.TeamId);
        builder.HasIndex(a => new { a.TeamId, a.EndDate });
    }
}
