using FutbolStats.Api.Features.Countries.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FutbolStats.Api.Infrastructure.Data.Configurations;

public class CountryConfiguration : IEntityTypeConfiguration<Country>
{
    public void Configure(EntityTypeBuilder<Country> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.Code)
            .IsRequired()
            .HasMaxLength(3);

        builder.Property(c => c.FlagUrl)
            .HasMaxLength(500);

        builder.HasIndex(c => c.Name)
            .IsUnique();

        builder.HasIndex(c => c.Code)
            .IsUnique();
    }
}
