namespace SportsStats.API.Models.DTOs;

public class PlayerDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public bool IsActive { get; set; }
    public string? Position { get; set; }
    public int? Age { get; set; }
    public string? Height { get; set; }
    public string? Weight { get; set; }
    public string? College { get; set; }
    public int? Number { get; set; }
    public int? Experience { get; set; }
    public string? Team { get; set; }
}
