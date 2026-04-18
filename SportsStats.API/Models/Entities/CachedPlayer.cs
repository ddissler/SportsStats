namespace SportsStats.API.Models.Entities;

public class CachedPlayer
{
    public int Id { get; set; }
    public int SportId { get; set; }
    public string ExternalPlayerId { get; set; } = string.Empty;
    public string? EspnPlayerId { get; set; }
    public string? ApiSportsPlayerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public string? Position { get; set; }
    public int? Age { get; set; }
    public string? Height { get; set; }
    public string? Weight { get; set; }
    public string? College { get; set; }
    public int? Number { get; set; }
    public int? Experience { get; set; }
    public bool IsActive { get; set; }
    public string? Team { get; set; }
    public DateTime LastUpdated { get; set; }

    public Sport Sport { get; set; } = null!;
    public ICollection<CachedStat> CachedStats { get; set; } = new List<CachedStat>();
}
