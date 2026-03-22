namespace SportsStats.API.Models.Entities;

public class CachedStat
{
    public int Id { get; set; }
    public int CachedPlayerId { get; set; }
    public string StatType { get; set; } = string.Empty;  // "seasonal" | "career" | "gamelog"
    public string? Season { get; set; }
    public string DataJson { get; set; } = string.Empty;
    public DateTime LastUpdated { get; set; }

    public CachedPlayer Player { get; set; } = null!;
}
