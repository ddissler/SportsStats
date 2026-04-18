using SportsStats.API.Models.DTOs;

namespace SportsStats.API.Services.Interfaces;

public interface ITeamDefenseService
{
    /// <summary>
    /// Returns DEF/ST stats for all NFL teams in the given season,
    /// sorted descending by total fantasy points. Results are cached
    /// per team: permanently for completed seasons, 24 h for active ones.
    /// </summary>
    Task<List<TeamDefenseDto>> GetSeasonDefenseAsync(int season);
}
