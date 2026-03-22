using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using SportsStats.API.Data;
using SportsStats.API.Models.ApiSports;
using SportsStats.API.Models.DTOs;
using SportsStats.API.Models.Entities;
using SportsStats.API.Services.Interfaces;
using SportsStats.API.Infrastructure;

namespace SportsStats.API.Services;

public class StatsService : IStatsService
{
    private readonly SportsStatsDbContext _db;
    private readonly IApiSportsService _apiSports;
    private readonly ISeasonStatusService _seasonStatus;
    private readonly ILogger<StatsService> _logger;
    private static readonly TimeSpan ActiveSeasonTtl = TimeSpan.FromHours(24);

    public StatsService(
        SportsStatsDbContext db,
        IApiSportsService apiSports,
        ISeasonStatusService seasonStatus,
        ILogger<StatsService> logger)
    {
        _db = db;
        _apiSports = apiSports;
        _seasonStatus = seasonStatus;
        _logger = logger;
    }

    public async Task<StatsResponseDto?> GetSeasonalStatsAsync(int sportId, string playerId, int season)
        => await GetStatsAsync(sportId, playerId, "seasonal", season);

    public async Task<List<StatsResponseDto>> GetCareerStatsAsync(int sportId, string playerId)
    {
        var player = await _db.CachedPlayers
            .FirstOrDefaultAsync(p => p.SportId == sportId && p.ExternalPlayerId == playerId);

        if (player is null) return new List<StatsResponseDto>();

        // Return all stored seasonal stats — completed seasons are permanent,
        // current season is subject to 24hr TTL (handled per-record on individual fetches)
        var stored = await _db.CachedStats
            .Where(s => s.CachedPlayerId == player.Id && s.StatType == "seasonal")
            .OrderByDescending(s => s.Season)
            .ToListAsync();

        return stored.Select(MapToDto).ToList();
    }

    public async Task<StatsResponseDto?> GetGameLogsAsync(int sportId, string playerId, int season)
        => await GetStatsAsync(sportId, playerId, "gamelog", season);

    // ---- private helpers ----

    private async Task<StatsResponseDto?> GetStatsAsync(int sportId, string playerId, string statType, int season)
    {
        var sport = await _db.Sports.FindAsync(sportId);
        if (sport is null) return null;

        var player = await _db.CachedPlayers
            .FirstOrDefaultAsync(p => p.SportId == sportId && p.ExternalPlayerId == playerId);

        if (player is null) return null;

        var seasonStr = season.ToString();
        var isCompleted = await _seasonStatus.IsSeasonCompletedAsync(sportId, season);

        var stored = await _db.CachedStats
            .FirstOrDefaultAsync(s => s.CachedPlayerId == player.Id &&
                                      s.StatType == statType &&
                                      s.Season == seasonStr);

        if (stored is not null)
        {
            // Completed season — stored permanently, never re-fetch
            if (isCompleted)
            {
                _logger.LogInformation("Permanent cache hit (completed season): {PlayerId} {StatType} {Season}", playerId, statType, season);
                return MapToDto(stored);
            }

            // Active season — respect 24hr TTL
            if (DateTime.UtcNow - stored.LastUpdated < ActiveSeasonTtl)
            {
                _logger.LogInformation("Cache hit (active season, within TTL): {PlayerId} {StatType} {Season}", playerId, statType, season);
                return MapToDto(stored);
            }
        }

        // Fetch from API-Sports
        _logger.LogInformation("Fetching from API-Sports: {PlayerId} {StatType} {Season} (completed={IsCompleted})", playerId, statType, season, isCompleted);

        string path;
        var queryParams = new Dictionary<string, string>();

        if (statType == "gamelog")
        {
            // NFL game logs require a game ID — player+season filtering is not supported.
            // Use the statistics endpoint with season filter as the closest equivalent.
            path = ApiSportsEndpoints.StatisticsPath;
            queryParams = ApiSportsEndpoints.PlayerStatsParams(playerId, season);
        }
        else
        {
            path = ApiSportsEndpoints.StatisticsPath;
            queryParams = ApiSportsEndpoints.PlayerStatsParams(playerId, season);
        }

        var rawJson = await FetchRawJsonAsync(sport.ApiSportsBaseUrl, path, queryParams);
        if (rawJson is null) return null;

        // Upsert
        if (stored is null)
        {
            stored = new CachedStat { CachedPlayerId = player.Id, StatType = statType, Season = seasonStr };
            _db.CachedStats.Add(stored);
        }

        stored.DataJson = rawJson;
        stored.LastUpdated = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return MapToDto(stored);
    }

    private async Task<string?> FetchRawJsonAsync(string baseUrl, string path, Dictionary<string, string> queryParams)
    {
        var result = await _apiSports.GetAsync<JsonElement>(baseUrl, path, queryParams);
        if (result is JsonElement elem && elem.ValueKind != JsonValueKind.Undefined)
            return elem.GetRawText();

        return null;
    }

    private static StatsResponseDto MapToDto(CachedStat s)
    {
        object? data = null;
        try { data = JsonSerializer.Deserialize<JsonElement>(s.DataJson); }
        catch { data = s.DataJson; }

        return new StatsResponseDto
        {
            StatType = s.StatType,
            Season = s.Season,
            Data = data,
            LastUpdated = s.LastUpdated
        };
    }
}
