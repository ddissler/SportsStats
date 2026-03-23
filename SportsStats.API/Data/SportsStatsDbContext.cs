using Microsoft.EntityFrameworkCore;
using SportsStats.API.Models.Entities;

namespace SportsStats.API.Data;

public class SportsStatsDbContext : DbContext
{
    public SportsStatsDbContext(DbContextOptions<SportsStatsDbContext> options)
        : base(options) { }

    public DbSet<Sport> Sports => Set<Sport>();
    public DbSet<CachedPlayer> CachedPlayers => Set<CachedPlayer>();
    public DbSet<CachedStat> CachedStats => Set<CachedStat>();
    public DbSet<SeasonStatus> SeasonStatuses => Set<SeasonStatus>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Sport>(e =>
        {
            e.HasKey(s => s.Id);
            e.HasIndex(s => s.Slug).IsUnique();
            e.Property(s => s.Name).HasMaxLength(100).IsRequired();
            e.Property(s => s.Slug).HasMaxLength(50).IsRequired();
            e.Property(s => s.ApiSportsBaseUrl).HasMaxLength(200).IsRequired();
            e.Property(s => s.EspnSport).HasMaxLength(50);
            e.Property(s => s.EspnLeague).HasMaxLength(50);
        });

        modelBuilder.Entity<CachedPlayer>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasIndex(p => new { p.SportId, p.ExternalPlayerId }).IsUnique();
            e.HasIndex(p => new { p.SportId, p.EspnPlayerId });
            e.Property(p => p.ExternalPlayerId).HasMaxLength(50).IsRequired();
            e.Property(p => p.EspnPlayerId).HasMaxLength(50);
            e.Property(p => p.ApiSportsPlayerId).HasMaxLength(50);
            e.Property(p => p.Name).HasMaxLength(200).IsRequired();
            e.Property(p => p.PhotoUrl).HasMaxLength(500);
            e.HasOne(p => p.Sport)
             .WithMany(s => s.CachedPlayers)
             .HasForeignKey(p => p.SportId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CachedStat>(e =>
        {
            e.HasKey(s => s.Id);
            e.Property(s => s.StatType).HasMaxLength(20).IsRequired();
            e.Property(s => s.Season).HasMaxLength(20);
            e.Property(s => s.DataJson).HasColumnType("nvarchar(max)");
            e.HasOne(s => s.Player)
             .WithMany(p => p.CachedStats)
             .HasForeignKey(s => s.CachedPlayerId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SeasonStatus>(e =>
        {
            e.HasKey(s => s.Id);
            e.HasIndex(s => s.SportId).IsUnique();
            e.HasOne(s => s.Sport)
             .WithOne(sp => sp.SeasonStatus)
             .HasForeignKey<SeasonStatus>(s => s.SportId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // Seed supported sports
        modelBuilder.Entity<Sport>().HasData(
            new Sport
            {
                Id = 1, Name = "NFL", Slug = "nfl",
                ApiSportsLeagueId = "1",
                ApiSportsBaseUrl = "https://v1.american-football.api-sports.io",
                EspnSport = "football", EspnLeague = "nfl",
                IconUrl = null
            },
            new Sport
            {
                Id = 2, Name = "NBA", Slug = "nba",
                ApiSportsLeagueId = "12",
                ApiSportsBaseUrl = "https://v1.basketball.api-sports.io",
                EspnSport = "basketball", EspnLeague = "nba",
                IconUrl = null
            },
            new Sport
            {
                Id = 3, Name = "MLB", Slug = "mlb",
                ApiSportsLeagueId = "1",
                ApiSportsBaseUrl = "https://v1.baseball.api-sports.io",
                EspnSport = "baseball", EspnLeague = "mlb",
                IconUrl = null
            },
            new Sport
            {
                Id = 4, Name = "NHL", Slug = "nhl",
                ApiSportsLeagueId = "57",
                ApiSportsBaseUrl = "https://v1.hockey.api-sports.io",
                EspnSport = "hockey", EspnLeague = "nhl",
                IconUrl = null
            },
            new Sport
            {
                Id = 5, Name = "MLS", Slug = "mls",
                ApiSportsLeagueId = "253",
                ApiSportsBaseUrl = "https://v3.football.api-sports.io",
                EspnSport = "soccer", EspnLeague = "usa.1",
                IconUrl = null
            }
        );
    }
}
