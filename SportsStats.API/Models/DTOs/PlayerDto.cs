namespace SportsStats.API.Models.DTOs;

public class PlayerDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public bool IsActive { get; set; }
    public string? Position { get; set; }
    public string? Team { get; set; }
}
