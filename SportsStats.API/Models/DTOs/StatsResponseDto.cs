namespace SportsStats.API.Models.DTOs;

public class StatsResponseDto
{
    public string StatType { get; set; } = string.Empty;
    public string? Season { get; set; }
    public object? Data { get; set; }
    public DateTime LastUpdated { get; set; }
}
