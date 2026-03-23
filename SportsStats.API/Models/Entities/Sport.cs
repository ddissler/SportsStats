namespace SportsStats.API.Models.Entities;

public class Sport
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
    public string ApiSportsLeagueId { get; set; } = string.Empty;
    public string ApiSportsBaseUrl { get; set; } = string.Empty;
    public string? EspnSport { get; set; }
    public string? EspnLeague { get; set; }

    public ICollection<CachedPlayer> CachedPlayers { get; set; } = new List<CachedPlayer>();
    public SeasonStatus? SeasonStatus { get; set; }
}
