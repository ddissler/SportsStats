namespace SportsStats.API.Services.Interfaces;

public interface ISeasonStatusService
{
    /// <summary>
    /// Returns the current season year and whether it is still active for the given sport.
    /// Refreshes from API-Sports at most once every 30 days.
    /// </summary>
    Task<(int Season, bool IsActive)> GetCurrentSeasonAsync(int sportId);

    /// <summary>
    /// Returns true if the given season year is a completed (out-of-season) year for this sport.
    /// Completed seasons are stored permanently — no re-fetch ever needed.
    /// </summary>
    Task<bool> IsSeasonCompletedAsync(int sportId, int season);
}
