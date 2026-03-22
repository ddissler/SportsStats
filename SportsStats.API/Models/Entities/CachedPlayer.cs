namespace SportsStats.API.Models.Entities;

public class CachedPlayer
{
    public int Id { get; set; }
    public int SportId { get; set; }
    public string ExternalPlayerId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public bool IsActive { get; set; }
    public DateTime LastUpdated { get; set; }

    public Sport Sport { get; set; } = null!;
    public ICollection<CachedStat> CachedStats { get; set; } = new List<CachedStat>();
}
