namespace SportsStats.API.Models.DTOs;

public class GameDto
{
    public int GameId { get; set; }
    public string Date { get; set; } = string.Empty;
    public string Stage { get; set; } = string.Empty;
    public string Week { get; set; } = string.Empty;
    public string HomeTeam { get; set; } = string.Empty;
    public string? HomeTeamLogo { get; set; }
    public int? HomeScore { get; set; }
    public string AwayTeam { get; set; } = string.Empty;
    public string? AwayTeamLogo { get; set; }
    public int? AwayScore { get; set; }
    public string? Source { get; set; }
}
