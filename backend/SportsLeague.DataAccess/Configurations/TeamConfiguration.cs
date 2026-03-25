using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SportsLeague.Domain.Entities;

namespace SportsLeague.DataAccess.Configurations;

public class TeamConfiguration : IEntityTypeConfiguration<Team>
{
    public void Configure(EntityTypeBuilder<Team> entity)
    {
        entity.ToTable("Teams");

        entity.HasKey(t => t.Id);

        entity.Property(t => t.Name)
            .IsRequired()
            .HasMaxLength(100);

        entity.Property(t => t.City)
            .IsRequired()
            .HasMaxLength(100);

        entity.Property(t => t.Stadium)
            .IsRequired()
            .HasMaxLength(150);

        entity.Property(t => t.LogoUrl)
            .HasMaxLength(500);

        entity.Property(t => t.FoundedDate)
            .IsRequired();

        entity.Property(t => t.CreatedAt)
            .IsRequired();

        entity.Property(t => t.UpdatedAt)
            .IsRequired(false);

        entity.HasIndex(t => t.Name)
            .IsUnique();

        entity.HasMany(t => t.Players)
            .WithOne(p => p.Team)
            .HasForeignKey(p => p.TeamId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasMany(t => t.TournamentTeams)
            .WithOne(tt => tt.Team)
            .HasForeignKey(tt => tt.TeamId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}