using Microsoft.EntityFrameworkCore;
using SportsLeague.Domain.Entities;

namespace SportsLeague.DataAccess.Context;

public class LeagueDbContext : DbContext
{
    public LeagueDbContext(DbContextOptions<LeagueDbContext> options) : base(options) { }

    public DbSet<Team> Teams => Set<Team>();
    public DbSet<Player> Players => Set<Player>();
    public DbSet<Referee> Referees => Set<Referee>();              // NUEVO
    public DbSet<Tournament> Tournaments => Set<Tournament>();    // NUEVO
    public DbSet<TournamentTeam> TournamentTeams => Set<TournamentTeam>(); // NUEVO


    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.Entity is AuditBase && (e.State == EntityState.Added || e.State == EntityState.Modified));

        foreach (var entry in entries)
        {
            var entity = (AuditBase)entry.Entity;
            entity.UpdatedAt = DateTime.UtcNow;

            if (entry.State == EntityState.Added)
            {
                entity.CreatedAt = DateTime.UtcNow;
            }
        }
        return base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
       ///// Aquí mantienes tus configuraciones de Fluent API actuales

        // ── Referee Configuration ──
        modelBuilder.Entity<Referee>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.Property(r => r.FirstName)
                  .IsRequired()
                  .HasMaxLength(80);
            entity.Property(r => r.LastName)
                  .IsRequired()
                  .HasMaxLength(80);
            entity.Property(r => r.Nationality)
                  .IsRequired()
                  .HasMaxLength(80);
            entity.Property(r => r.CreatedAt)
                  .IsRequired();
            entity.Property(r => r.UpdatedAt)
                  .IsRequired(false);

            // ── Tournament Configuration ──
            modelBuilder.Entity<Tournament>(entity =>
            {
                entity.HasKey(t => t.Id);
                entity.Property(t => t.Name)
                      .IsRequired()
                      .HasMaxLength(150);
                entity.Property(t => t.Season)
                      .IsRequired()
                      .HasMaxLength(20);
                entity.Property(t => t.StartDate)
                      .IsRequired();
                entity.Property(t => t.EndDate)
                      .IsRequired();
                entity.Property(t => t.Status)
                      .IsRequired();
                entity.Property(t => t.CreatedAt)
                      .IsRequired();
                entity.Property(t => t.UpdatedAt)
                      .IsRequired(false);

                // ── TournamentTeam Configuration ──
                modelBuilder.Entity<TournamentTeam>(entity =>
                {
                    entity.HasKey(tt => tt.Id);
                    entity.Property(tt => tt.RegisteredAt)
                          .IsRequired();
                    entity.Property(tt => tt.CreatedAt)
                          .IsRequired();
                    entity.Property(tt => tt.UpdatedAt)
                          .IsRequired(false);

                    // Relación con Tournament
                    entity.HasOne(tt => tt.Tournament)
                          .WithMany(t => t.TournamentTeams)
                          .HasForeignKey(tt => tt.TournamentId)
                          .OnDelete(DeleteBehavior.Cascade);

                    // Relación con Team
                    entity.HasOne(tt => tt.Team)
                          .WithMany(t => t.TournamentTeams)
                          .HasForeignKey(tt => tt.TeamId)
                          .OnDelete(DeleteBehavior.Cascade);

                    // Índice único compuesto: un equipo solo una vez por torneo
                    entity.HasIndex(tt => new { tt.TournamentId, tt.TeamId })
                          .IsUnique();
                });
            });
        });
    }
}