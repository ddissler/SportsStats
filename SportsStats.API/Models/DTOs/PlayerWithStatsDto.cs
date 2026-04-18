namespace SportsStats.API.Models.DTOs;

public class PlayerWithStatsDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public bool IsActive { get; set; }
    public string? Position { get; set; }
    public string? Team { get; set; }

    /// <summary>Raw seasonal stats JSON blob (same shape as StatsResponseDto.Data) — null if no cached stats.</summary>
    public object? SeasonalStats { get; set; }

    /// <summary>Season year the stats belong to, e.g. 2024.</summary>
    public int? StatsSeason { get; set; }
}
