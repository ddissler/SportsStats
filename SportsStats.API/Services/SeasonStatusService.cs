using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using SportsStats.API.Data;
using SportsStats.API.Models.ApiSports;
using SportsStats.API.Models.Entities;
using SportsStats.API.Services.Interfaces;

namespace SportsStats.API.Services;

public class SeasonStatusService : ISeasonStatusService
{
    private readonly SportsStatsDbContext _db;
    private readonly IApiSportsService _apiSports;
    private readonly ILogger<SeasonStatusService> _logger;
    private static readonly TimeSpan RefreshInterval = TimeSpan.FromDays(30);

    public SeasonStatusService(SportsStatsDbContext db, IApiSportsService apiSports, ILogger<SeasonStatusService> logger)
    {
        _db = db;
        _apiSports = apiSports;
        _logger = logger;
    }

    public async Task<(int Season, bool IsActive)> GetCurrentSeasonAsync(int sportId)
    {
        var status = await GetOrRefreshAsync(sportId);
        return (status.CurrentSeason, status.IsActive);
    }

    public async Task<bool> IsSeasonCompletedAsync(int sportId, int season)
    {
        var (currentSeason, isActive) = await GetCurrentSeasonAsync(sportId);

        // A season is completed if it's before the current season,
        // OR it is the current season but the season has ended (IsActive = false)
        if (season < currentSeason) return true;
        if (season == currentSeason && !isActive) return true;
        return false;
    }

    private async Task<SeasonStatus> GetOrRefreshAsync(int sportId)
    {
        var existing = await _db.SeasonStatuses
            .FirstOrDefaultAsync(s => s.SportId == sportId);

        // Use cached value if fresh
        if (existing is not null && DateTime.UtcNow - existing.LastChecked < RefreshInterval)
            return existing;

        // Stale or missing — call API-Sports
        var sport = await _db.Sports.FindAsync(sportId);
        if (sport is null) throw new KeyNotFoundException($"Sport {sportId} not found");

        _logger.LogInformation("Refreshing season status for sport {SportId} ({SportName})", sportId, sport.Name);

        var (currentSeason, isActive) = await FetchSeasonStatusFromApiAsync(sport);

        if (existing is null)
        {
            existing = new SeasonStatus { SportId = sportId };
            _db.SeasonStatuses.Add(existing);
        }

        existing.CurrentSeason = currentSeason;
        existing.IsActive = isActive;
        existing.LastChecked = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return existing;
    }

    private async Task<(int Season, bool IsActive)> FetchSeasonStatusFromApiAsync(Models.Entities.Sport sport)
    {
        try
        {
            // API-Sports leagues endpoint returns current season info including active status
            var response = await _apiSports.GetAsync<ApiSportsResponse<ApiSportsLeagueDetail>>(
                sport.ApiSportsBaseUrl,
                "/leagues",
                new Dictionary<string, string>
                {
                    ["id"] = sport.ApiSportsLeagueId,
                    ["current"] = "true"
                }
            );

            if (response?.Response is { Count: > 0 })
            {
                var league = response.Response[0];
                var season = league.Seasons?.FirstOrDefault(s => s.Current == true);
                if (season is not null)
                    return (season.Year, true);

                // League exists but no current season — use most recent
                var latest = league.Seasons?.MaxBy(s => s.Year);
                if (latest is not null)
                    return (latest.Year, false);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch season status from API for sport {SportId}, using fallback", sport.Id);
        }

        // Fallback: current calendar year, assume active
        return (DateTime.UtcNow.Year, true);
    }
}
