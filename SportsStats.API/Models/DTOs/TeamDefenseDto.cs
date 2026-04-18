namespace SportsStats.API.Models.DTOs;

public class TeamDefenseDto
{
    public string TeamId { get; set; } = string.Empty;
    public string TeamName { get; set; } = string.Empty;
    public string? TeamAbbr { get; set; }
    public string? LogoUrl { get; set; }
    public int Season { get; set; }
    public int GamesPlayed { get; set; }

    // Raw stats
    public int TotalPointsAllowed { get; set; }
    public double AvgPointsAllowed { get; set; }
    public int YardsAllowed { get; set; }
    public int Sacks { get; set; }
    public int ForcedFumbles { get; set; }
    public int FumblesRecovered { get; set; }
    public int Interceptions { get; set; }
    public int DefensiveTDs { get; set; }
    public int SpecialTeamsTDs { get; set; }
    public int Safeties { get; set; }
    public int BlockedKicks { get; set; }

    // Fantasy point breakdown (standard DEF/ST scoring)
    // PA bracket: 0→10, 1-6→7, 7-13→4, 14-20→1, 21-27→0, 28-34→-1, 35+→-4
    public double FpPointsAllowed { get; set; }    // sum of per-game bracket values
    public double FpSacks { get; set; }            // sacks × 1
    public double FpInterceptions { get; set; }    // INT × 2
    public double FpFumblesRecovered { get; set; } // FR × 2
    public double FpTouchdowns { get; set; }       // (Def TD + ST TD) × 6
    public double FpSafeties { get; set; }         // safeties × 2
    public double FpBlockedKicks { get; set; }     // blocked kicks × 2
    public double TotalFantasyPoints { get; set; }

    public DateTime LastUpdated { get; set; }
}
