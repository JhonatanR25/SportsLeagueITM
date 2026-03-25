using Microsoft.EntityFrameworkCore;
using SportsLeague.Domain.Entities;

namespace SportsLeague.DataAccess.Context;

public class LeagueDbContext : DbContext
{
    public LeagueDbContext(DbContextOptions<LeagueDbContext> options) : base(options)
    {
    }

    public DbSet<Team> Teams => Set<Team>();
    public DbSet<Player> Players => Set<Player>();
    public DbSet<Referee> Referees => Set<Referee>();
    public DbSet<Tournament> Tournaments => Set<Tournament>();
    public DbSet<TournamentTeam> TournamentTeams => Set<TournamentTeam>();
    public DbSet<Match> Matches => Set<Match>();

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker
            .Entries()
            .Where(e => e.Entity is AuditBase &&
                        (e.State == EntityState.Added || e.State == EntityState.Modified));

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

        ConfigureTeam(modelBuilder);
        ConfigurePlayer(modelBuilder);
        ConfigureReferee(modelBuilder);
        ConfigureTournament(modelBuilder);
        ConfigureTournamentTeam(modelBuilder);
        ConfigureMatch(modelBuilder);
    }

    private static void ConfigureTeam(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Team>(entity =>
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

            entity.HasIndex(t => t.Name);

            entity.HasMany(t => t.Players)
                .WithOne(p => p.Team)
                .HasForeignKey(p => p.TeamId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(t => t.TournamentTeams)
                .WithOne(tt => tt.Team)
                .HasForeignKey(tt => tt.TeamId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(t => t.HomeMatches)
                .WithOne(m => m.HomeTeam)
                .HasForeignKey(m => m.HomeTeamId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(t => t.AwayMatches)
                .WithOne(m => m.AwayTeam)
                .HasForeignKey(m => m.AwayTeamId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigurePlayer(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Player>(entity =>
        {
            entity.ToTable("Players");

            entity.HasKey(p => p.Id);

            entity.Property(p => p.FirstName)
                .IsRequired()
                .HasMaxLength(80);

            entity.Property(p => p.LastName)
                .IsRequired()
                .HasMaxLength(80);

            entity.Property(p => p.BirthDate)
                .IsRequired();

            entity.Property(p => p.Number)
                .IsRequired();

            entity.Property(p => p.Position)
                .IsRequired();

            entity.Property(p => p.CreatedAt)
                .IsRequired();

            entity.Property(p => p.UpdatedAt)
                .IsRequired(false);

            entity.HasIndex(p => p.TeamId);

            entity.HasOne(p => p.Team)
                .WithMany(t => t.Players)
                .HasForeignKey(p => p.TeamId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureReferee(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Referee>(entity =>
        {
            entity.ToTable("Referees");

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

            entity.HasMany(r => r.Matches)
                .WithOne(m => m.Referee)
                .HasForeignKey(m => m.RefereeId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureTournament(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Tournament>(entity =>
        {
            entity.ToTable("Tournaments");

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

            entity.HasMany(t => t.TournamentTeams)
                .WithOne(tt => tt.Tournament)
                .HasForeignKey(tt => tt.TournamentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(t => t.Matches)
                .WithOne(m => m.Tournament)
                .HasForeignKey(m => m.TournamentId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureTournamentTeam(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TournamentTeam>(entity =>
        {
            entity.ToTable("TournamentTeams");

            entity.HasKey(tt => tt.Id);

            entity.Property(tt => tt.RegisteredAt)
                .IsRequired();

            entity.Property(tt => tt.CreatedAt)
                .IsRequired();

            entity.Property(tt => tt.UpdatedAt)
                .IsRequired(false);

            entity.HasOne(tt => tt.Tournament)
                .WithMany(t => t.TournamentTeams)
                .HasForeignKey(tt => tt.TournamentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(tt => tt.Team)
                .WithMany(t => t.TournamentTeams)
                .HasForeignKey(tt => tt.TeamId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(tt => new { tt.TournamentId, tt.TeamId })
                .IsUnique();
        });
    }

    private static void ConfigureMatch(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Match>(entity =>
        {
            entity.ToTable("Matches");

            entity.HasKey(m => m.Id);

            entity.Property(m => m.MatchDate)
                .IsRequired();

            entity.Property(m => m.Status)
                .IsRequired();

            entity.Property(m => m.HomeScore)
                .IsRequired();

            entity.Property(m => m.AwayScore)
                .IsRequired();

            entity.Property(m => m.CreatedAt)
                .IsRequired();

            entity.Property(m => m.UpdatedAt)
                .IsRequired(false);

            entity.HasIndex(m => m.TournamentId);
            entity.HasIndex(m => m.RefereeId);
            entity.HasIndex(m => m.MatchDate);

            entity.HasOne(m => m.HomeTeam)
                .WithMany(t => t.HomeMatches)
                .HasForeignKey(m => m.HomeTeamId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(m => m.AwayTeam)
                .WithMany(t => t.AwayMatches)
                .HasForeignKey(m => m.AwayTeamId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(m => m.Referee)
                .WithMany(r => r.Matches)
                .HasForeignKey(m => m.RefereeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(m => m.Tournament)
                .WithMany(t => t.Matches)
                .HasForeignKey(m => m.TournamentId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
