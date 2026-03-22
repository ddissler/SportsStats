namespace SportsStats.API.Models.Entities;

public class SeasonStatus
{
    public int Id { get; set; }
    public int SportId { get; set; }
    public int CurrentSeason { get; set; }   // e.g. 2025
    public bool IsActive { get; set; }        // is that season currently in progress
    public DateTime LastChecked { get; set; }

    public Sport Sport { get; set; } = null!;
}
