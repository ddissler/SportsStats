namespace SportsStats.API.Models.Entities;

public class CachedTeamDefense
{
    public int Id { get; set; }
    public string ExternalTeamId { get; set; } = string.Empty;  // API-Sports team ID
    public string TeamName { get; set; } = string.Empty;
    public string? TeamAbbr { get; set; }
    public string? LogoUrl { get; set; }
    public int Season { get; set; }

    // Raw defensive totals
    public int GamesPlayed { get; set; }
    public int TotalPointsAllowed { get; set; }
    public int YardsAllowed { get; set; }
    public int Sacks { get; set; }
    public int ForcedFumbles { get; set; }
    public int FumblesRecovered { get; set; }
    public int Interceptions { get; set; }
    public int DefensiveTDs { get; set; }
    public int SpecialTeamsTDs { get; set; }
    public int Safeties { get; set; }
    public int BlockedKicks { get; set; }

    // JSON array of per-game opponent scores — needed for the PA bracket fantasy calculation
    // e.g. [7, 14, 0, 21, 28, ...]
    public string PerGamePointsAllowedJson { get; set; } = "[]";

    public DateTime LastUpdated { get; set; }
}
