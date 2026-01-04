using FutbolStats.Api.Features.MatchEvents.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FutbolStats.Api.Infrastructure.Data.Configurations;

public class MatchEventConfiguration : IEntityTypeConfiguration<MatchEvent>
{
    public void Configure(EntityTypeBuilder<MatchEvent> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Description)
            .HasMaxLength(500);

        builder.HasOne(e => e.Match)
            .WithMany(m => m.Events)
            .HasForeignKey(e => e.MatchId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Player)
            .WithMany(p => p.Events)
            .HasForeignKey(e => e.PlayerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.SecondPlayer)
            .WithMany()
            .HasForeignKey(e => e.SecondPlayerId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        builder.HasOne(e => e.Team)
            .WithMany()
            .HasForeignKey(e => e.TeamId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(e => e.MatchId);
        builder.HasIndex(e => e.PlayerId);
        builder.HasIndex(e => e.EventType);
        builder.HasIndex(e => new { e.MatchId, e.Minute });
    }
}
