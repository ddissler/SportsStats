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
    private readonly IEspnService _espn;
    private readonly ISeasonStatusService _seasonStatus;
    private readonly ILogger<StatsService> _logger;
    private static readonly TimeSpan ActiveSeasonTtl = TimeSpan.FromHours(24);

    public StatsService(
        SportsStatsDbContext db,
        IApiSportsService apiSports,
        IEspnService espn,
        ISeasonStatusService seasonStatus,
        ILogger<StatsService> logger)
    {
        _db = db;
        _apiSports = apiSports;
        _espn = espn;
        _seasonStatus = seasonStatus;
        _logger = logger;
    }

    public async Task<StatsResponseDto?> GetSeasonalStatsAsync(int sportId, string playerId, int season)
    {
        var sport = await _db.Sports.FindAsync(sportId);
        if (sport is null) return null;

        var player = await _db.CachedPlayers
            .FirstOrDefaultAsync(p => p.SportId == sportId && p.ExternalPlayerId == playerId);
        if (player is null) return null;

        var seasonStr = season.ToString();
        var isCompleted = await _seasonStatus.IsSeasonCompletedAsync(sportId, season);

        // Check cache
        var stored = await _db.CachedStats
            .FirstOrDefaultAsync(s => s.CachedPlayerId == player.Id &&
                                      s.StatType == "seasonal" &&
                                      s.Season == seasonStr);

        // Determine which source would be used
        var useEspn = CanUseEspnForStats(sport);

        if (stored is not null)
        {
            if (isCompleted || DateTime.UtcNow - stored.LastUpdated < ActiveSeasonTtl)
            {
                var cachedSource = useEspn && !string.IsNullOrEmpty(player.EspnPlayerId) ? "ESPN" : "API-Sports";
                return MapToDto(stored, cachedSource);
            }
        }

        // Try ESPN first (unless MLS)
        if (useEspn)
        {
            var espnId = await ResolveEspnPlayerIdAsync(player, sport);
            if (espnId is not null)
            {
                var espnResult = await _espn.GetPlayerSplitsAsync(sport.EspnSport!, sport.EspnLeague!, espnId, season);
                if (espnResult is not null)
                {
                    var normalized = EspnResponseNormalizer.NormalizeSplits(espnResult.Value);

                    // Check if the normalized response has any actual stats
                    if (!IsEmptyNormalizedResponse(normalized))
                    {
                        _logger.LogInformation("ESPN splits returned data for player {PlayerId} season {Season}", playerId, season);
                        return await CacheAndReturn(player, "seasonal", seasonStr, normalized, stored, "ESPN");
                    }
                }
            }
        }

        // Fallback to API-Sports
        _logger.LogInformation("Falling back to API-Sports for seasonal stats: player {PlayerId} season {Season}", playerId, season);
        var apiSportsId = await ResolveApiSportsPlayerIdAsync(player, sport);
        if (apiSportsId is not null)
        {
            var rawJson = await FetchRawJsonAsync(sport.ApiSportsBaseUrl,
                ApiSportsEndpoints.StatisticsPath,
                ApiSportsEndpoints.PlayerStatsParams(apiSportsId, season));

            if (rawJson is not null && !HasApiSportsError(rawJson))
            {
                // Don't cache empty API-Sports responses
                try
                {
                    var check = JsonSerializer.Deserialize<JsonElement>(rawJson);
                    if (check.TryGetProperty("results", out var results) && results.GetInt32() == 0)
                    {
                        var dto = MapToDto(new CachedStat
                        {
                            CachedPlayerId = player.Id, StatType = "seasonal", Season = seasonStr,
                            DataJson = rawJson, LastUpdated = DateTime.UtcNow
                        }, "API-Sports");
                        return dto;
                    }
                }
                catch { }

                return await CacheAndReturn(player, "seasonal", seasonStr, rawJson, stored, "API-Sports");
            }
        }

        if (stored is not null)
        {
            var cachedSource = useEspn && !string.IsNullOrEmpty(player.EspnPlayerId) ? "ESPN" : "API-Sports";
            return MapToDto(stored, cachedSource);
        }

        // No data from any source — return informative message instead of null
        return BuildNoDataResponse(sport.Name, season);
    }

    public async Task<List<GameDto>> GetGamesAsync(int sportId, string playerId, int season)
    {
        var sport = await _db.Sports.FindAsync(sportId);
        if (sport is null) return new List<GameDto>();

        var player = await _db.CachedPlayers
            .FirstOrDefaultAsync(p => p.SportId == sportId && p.ExternalPlayerId == playerId);
        if (player is null) return new List<GameDto>();

        var seasonStr = season.ToString();
        var isCompleted = await _seasonStatus.IsSeasonCompletedAsync(sportId, season);
        var useEspn = CanUseEspnForStats(sport);

        // Check cache
        var stored = await _db.CachedStats
            .FirstOrDefaultAsync(s => s.CachedPlayerId == player.Id &&
                                      s.StatType == "games" &&
                                      s.Season == seasonStr);

        if (stored is not null)
        {
            if (isCompleted || DateTime.UtcNow - stored.LastUpdated < ActiveSeasonTtl)
            {
                var cachedSource = useEspn && !string.IsNullOrEmpty(player.EspnPlayerId) ? "ESPN" : "API-Sports";
                var cachedGames = DeserializeGames(stored.DataJson);
                cachedGames.ForEach(g => g.Source = cachedSource);
                return cachedGames;
            }
        }

        // Try ESPN gamelog first (unless MLS) — no team ID dependency!
        if (useEspn)
        {
            var espnId = await ResolveEspnPlayerIdAsync(player, sport);
            if (espnId is not null)
            {
                var espnResult = await _espn.GetPlayerGameLogAsync(sport.EspnSport!, sport.EspnLeague!, espnId, season);
                if (espnResult is not null)
                {
                    var games = EspnResponseNormalizer.NormalizeGameLog(espnResult.Value);
                    if (games.Count > 0)
                    {
                        _logger.LogInformation("ESPN gamelog returned {Count} games for player {PlayerId} season {Season}", games.Count, playerId, season);
                        games.ForEach(g => g.Source = "ESPN");
                        var gamesJson = JsonSerializer.Serialize(games);

                        if (stored is null)
                        {
                            stored = new CachedStat { CachedPlayerId = player.Id, StatType = "games", Season = seasonStr };
                            _db.CachedStats.Add(stored);
                        }
                        stored.DataJson = gamesJson;
                        stored.LastUpdated = DateTime.UtcNow;
                        await _db.SaveChangesAsync();

                        return games;
                    }
                }
            }
        }

        // Fallback to API-Sports (needs team ID from seasonal stats)
        _logger.LogInformation("Falling back to API-Sports for games: player {PlayerId} season {Season}", playerId, season);
        var apiSportsId = await ResolveApiSportsPlayerIdAsync(player, sport);
        if (apiSportsId is null)
        {
            if (stored is not null)
            {
                var fallbackGames = DeserializeGames(stored.DataJson);
                var fallbackSource = useEspn && !string.IsNullOrEmpty(player.EspnPlayerId) ? "ESPN" : "API-Sports";
                fallbackGames.ForEach(g => g.Source = fallbackSource);
                return fallbackGames;
            }
            return new List<GameDto>();
        }

        var seasonalStats = await GetSeasonalStatsAsync(sportId, playerId, season);
        int? teamId = null;
        if (seasonalStats?.Data is JsonElement data)
            teamId = ExtractTeamId(data);

        if (teamId is null)
        {
            _logger.LogWarning("Could not determine team for player {PlayerId} in season {Season}", playerId, season);
            if (stored is not null)
            {
                var fallbackGames = DeserializeGames(stored.DataJson);
                fallbackGames.ForEach(g => g.Source = "API-Sports");
                return fallbackGames;
            }
            return new List<GameDto>();
        }

        var queryParams = new Dictionary<string, string>
        {
            ["season"] = season.ToString(),
            ["league"] = sport.ApiSportsLeagueId,
            ["team"] = teamId.Value.ToString()
        };

        var rawJson = await FetchRawJsonAsync(sport.ApiSportsBaseUrl, ApiSportsEndpoints.GamesPath, queryParams);
        if (rawJson is null)
        {
            if (stored is not null)
            {
                var fallbackGames = DeserializeGames(stored.DataJson);
                fallbackGames.ForEach(g => g.Source = "API-Sports");
                return fallbackGames;
            }
            return new List<GameDto>();
        }

        var apiGames = ParseGames(rawJson);
        apiGames.ForEach(g => g.Source = "API-Sports");
        var apiGamesJson = JsonSerializer.Serialize(apiGames);

        if (stored is null)
        {
            stored = new CachedStat { CachedPlayerId = player.Id, StatType = "games", Season = seasonStr };
            _db.CachedStats.Add(stored);
        }
        stored.DataJson = apiGamesJson;
        stored.LastUpdated = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return apiGames;
    }

    public async Task<StatsResponseDto?> GetGameStatsAsync(int sportId, string playerId, int gameId)
    {
        var sport = await _db.Sports.FindAsync(sportId);
        if (sport is null) return null;

        var player = await _db.CachedPlayers
            .FirstOrDefaultAsync(p => p.SportId == sportId && p.ExternalPlayerId == playerId);
        if (player is null) return null;

        var cacheKey = $"game_{gameId}";
        var useEspn = CanUseEspnForStats(sport);

        var stored = await _db.CachedStats
            .FirstOrDefaultAsync(s => s.CachedPlayerId == player.Id &&
                                      s.StatType == "gamestats" &&
                                      s.Season == cacheKey);

        if (stored is not null)
        {
            var cachedSource = useEspn && !string.IsNullOrEmpty(player.EspnPlayerId) ? "ESPN" : "API-Sports";
            return MapToDto(stored, cachedSource);
        }

        // Try ESPN summary first
        if (useEspn)
        {
            var espnId = await ResolveEspnPlayerIdAsync(player, sport);
            if (espnId is not null)
            {
                var espnResult = await _espn.GetGameSummaryAsync(sport.EspnSport!, sport.EspnLeague!, gameId.ToString());
                if (espnResult is not null)
                {
                    var normalized = EspnResponseNormalizer.NormalizeBoxScore(espnResult.Value, espnId);

                    if (!IsEmptyNormalizedResponse(normalized))
                    {
                        _logger.LogInformation("ESPN summary returned data for player {PlayerId} game {GameId}", playerId, gameId);

                        stored = new CachedStat
                        {
                            CachedPlayerId = player.Id,
                            StatType = "gamestats",
                            Season = cacheKey,
                            DataJson = normalized,
                            LastUpdated = DateTime.UtcNow
                        };
                        _db.CachedStats.Add(stored);
                        await _db.SaveChangesAsync();

                        return MapToDto(stored, "ESPN");
                    }
                }
            }
        }

        // Fallback to API-Sports
        _logger.LogInformation("Falling back to API-Sports for game stats: player {PlayerId} game {GameId}", playerId, gameId);
        var apiId = await ResolveApiSportsPlayerIdAsync(player, sport);
        if (apiId is null) return null;

        var queryParams = new Dictionary<string, string> { ["id"] = gameId.ToString() };
        var rawJson = await FetchRawJsonAsync(sport.ApiSportsBaseUrl, ApiSportsEndpoints.GamePlayerStatsPath, queryParams);
        if (rawJson is null) return null;

        var playerJson = ExtractPlayerFromGameStats(rawJson, apiId);

        stored = new CachedStat
        {
            CachedPlayerId = player.Id,
            StatType = "gamestats",
            Season = cacheKey,
            DataJson = playerJson,
            LastUpdated = DateTime.UtcNow
        };
        _db.CachedStats.Add(stored);
        await _db.SaveChangesAsync();

        return MapToDto(stored, "API-Sports");
    }

    // ---- ESPN/API-Sports player ID resolution ----

    private async Task<string?> ResolveEspnPlayerIdAsync(CachedPlayer player, Sport sport)
    {
        if (!string.IsNullOrEmpty(player.EspnPlayerId))
            return player.EspnPlayerId;

        if (string.IsNullOrEmpty(sport.EspnSport))
            return null;

        // Search ESPN by name to find the ESPN ID
        var result = await _espn.SearchPlayersAsync(sport.EspnSport, sport.EspnLeague!, player.Name);
        if (result is null) return null;

        var root = result.Value;
        if (!root.TryGetProperty("items", out var items)) return null;

        foreach (var item in items.EnumerateArray())
        {
            var displayName = item.TryGetProperty("displayName", out var dn) ? dn.GetString() : null;
            if (displayName is null) continue;

            // Match by name (case-insensitive)
            if (!string.Equals(displayName, player.Name, StringComparison.OrdinalIgnoreCase)) continue;

            var espnId = item.TryGetProperty("id", out var idProp) ? idProp.GetString() : null;
            if (string.IsNullOrEmpty(espnId) && item.TryGetProperty("$ref", out var refProp))
            {
                var refUrl = refProp.GetString() ?? "";
                var match = System.Text.RegularExpressions.Regex.Match(refUrl, @"/athletes/(\d+)");
                if (match.Success) espnId = match.Groups[1].Value;
            }

            if (!string.IsNullOrEmpty(espnId))
            {
                player.EspnPlayerId = espnId;
                await _db.SaveChangesAsync();
                return espnId;
            }
        }

        return null;
    }

    private async Task<string?> ResolveApiSportsPlayerIdAsync(CachedPlayer player, Sport sport)
    {
        if (!string.IsNullOrEmpty(player.ApiSportsPlayerId))
            return player.ApiSportsPlayerId;

        // Search API-Sports by name
        var apiResponse = await _apiSports.GetAsync<ApiSportsResponse<ApiSportsPlayer>>(
            sport.ApiSportsBaseUrl,
            ApiSportsEndpoints.PlayersSearchPath,
            ApiSportsEndpoints.PlayerSearchParams(player.Name)
        );

        if (apiResponse?.Response is not { Count: > 0 }) return null;

        // Find best match by name
        foreach (var apiPlayer in apiResponse.Response)
        {
            var fullName = string.IsNullOrWhiteSpace(apiPlayer.Name)
                ? $"{apiPlayer.Firstname} {apiPlayer.Lastname}".Trim()
                : apiPlayer.Name;

            if (string.Equals(fullName, player.Name, StringComparison.OrdinalIgnoreCase))
            {
                var apiId = apiPlayer.Id.ToString();
                player.ApiSportsPlayerId = apiId;
                await _db.SaveChangesAsync();
                return apiId;
            }
        }

        // If no exact match, use first result
        var firstId = apiResponse.Response[0].Id.ToString();
        player.ApiSportsPlayerId = firstId;
        await _db.SaveChangesAsync();
        return firstId;
    }

    /// <summary>MLS (slug "mls") always skips ESPN for stats/games (gamelog/splits don't work)</summary>
    private static bool CanUseEspnForStats(Sport sport)
        => !string.IsNullOrEmpty(sport.EspnSport) && sport.Slug != "mls";

    /// <summary>Returns true if the API-Sports response contains an error (e.g. "Free plans do not have access")</summary>
    private static bool HasApiSportsError(string rawJson)
    {
        try
        {
            var doc = JsonSerializer.Deserialize<JsonElement>(rawJson);
            if (doc.TryGetProperty("errors", out var errors))
            {
                if (errors.ValueKind == JsonValueKind.Object)
                {
                    foreach (var prop in errors.EnumerateObject())
                    {
                        var val = prop.Value.GetString();
                        if (!string.IsNullOrEmpty(val)) return true;
                    }
                }
                else if (errors.ValueKind == JsonValueKind.Array && errors.GetArrayLength() > 0)
                    return true;
            }
        }
        catch { }
        return false;
    }

    private static bool IsEmptyNormalizedResponse(string json)
    {
        try
        {
            var doc = JsonSerializer.Deserialize<JsonElement>(json);
            if (doc.TryGetProperty("response", out var response) && response.GetArrayLength() > 0)
            {
                var first = response[0];
                if (first.TryGetProperty("teams", out var teams) && teams.GetArrayLength() > 0)
                {
                    var team = teams[0];
                    if (team.TryGetProperty("groups", out var groups) && groups.GetArrayLength() > 0)
                        return false;
                }
            }
        }
        catch { }
        return true;
    }

    // ---- private helpers (unchanged from original) ----

    private async Task<StatsResponseDto> CacheAndReturn(CachedPlayer player, string statType, string seasonStr, string rawJson, CachedStat? stored, string? source = null)
    {
        if (stored is null)
        {
            stored = new CachedStat { CachedPlayerId = player.Id, StatType = statType, Season = seasonStr };
            _db.CachedStats.Add(stored);
        }
        stored.DataJson = rawJson;
        stored.LastUpdated = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return MapToDto(stored, source);
    }

    private static int? ExtractTeamId(JsonElement data)
    {
        try
        {
            if (data.TryGetProperty("response", out var response) && response.GetArrayLength() > 0)
            {
                var first = response[0];
                if (first.TryGetProperty("teams", out var teams) && teams.GetArrayLength() > 0)
                {
                    var team = teams[0].GetProperty("team");
                    return team.GetProperty("id").GetInt32();
                }
            }
        }
        catch { }
        return null;
    }

    private static List<GameDto> ParseGames(string rawJson)
    {
        var games = new List<GameDto>();
        try
        {
            var doc = JsonSerializer.Deserialize<JsonElement>(rawJson);
            if (!doc.TryGetProperty("response", out var response)) return games;

            foreach (var item in response.EnumerateArray())
            {
                var game = item.GetProperty("game");
                var stage = game.GetProperty("stage").GetString() ?? "";
                if (stage == "Pre Season") continue;

                var date = game.GetProperty("date").GetProperty("date").GetString() ?? "";
                var week = game.GetProperty("week").GetString() ?? "";

                var teams = item.GetProperty("teams");
                var home = teams.GetProperty("home");
                var away = teams.GetProperty("away");

                var scores = item.GetProperty("scores");

                int? homeScore = null;
                int? awayScore = null;
                try
                {
                    homeScore = scores.GetProperty("home").GetProperty("total").GetInt32();
                    awayScore = scores.GetProperty("away").GetProperty("total").GetInt32();
                }
                catch { }

                games.Add(new GameDto
                {
                    GameId = game.GetProperty("id").GetInt32(),
                    Date = date,
                    Stage = stage,
                    Week = week,
                    HomeTeam = home.GetProperty("name").GetString() ?? "",
                    HomeTeamLogo = home.TryGetProperty("logo", out var hl) ? hl.GetString() : null,
                    HomeScore = homeScore,
                    AwayTeam = away.GetProperty("name").GetString() ?? "",
                    AwayTeamLogo = away.TryGetProperty("logo", out var al) ? al.GetString() : null,
                    AwayScore = awayScore
                });
            }
        }
        catch { }
        return games;
    }

    private static List<GameDto> DeserializeGames(string json)
    {
        try { return JsonSerializer.Deserialize<List<GameDto>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new(); }
        catch { return new(); }
    }

    private string ExtractPlayerFromGameStats(string rawJson, string playerId)
    {
        try
        {
            var doc = JsonSerializer.Deserialize<JsonElement>(rawJson);
            if (!doc.TryGetProperty("response", out var response)) return rawJson;

            var playerIdInt = int.Parse(playerId);

            foreach (var teamEntry in response.EnumerateArray())
            {
                var teamName = "";
                if (teamEntry.TryGetProperty("team", out var team) && team.TryGetProperty("name", out var tn))
                    teamName = tn.GetString() ?? "";

                if (!teamEntry.TryGetProperty("groups", out var groups)) continue;

                var playerGroups = new List<object>();
                foreach (var group in groups.EnumerateArray())
                {
                    var groupName = group.GetProperty("name").GetString() ?? "";
                    if (!group.TryGetProperty("players", out var players)) continue;

                    foreach (var p in players.EnumerateArray())
                    {
                        var pid = p.GetProperty("player").GetProperty("id").GetInt32();
                        if (pid == playerIdInt)
                        {
                            var stats = p.GetProperty("statistics");
                            playerGroups.Add(new { name = groupName, statistics = JsonSerializer.Deserialize<JsonElement>(stats.GetRawText()) });
                        }
                    }
                }

                if (playerGroups.Count > 0)
                {
                    var result = new
                    {
                        response = new[]
                        {
                            new
                            {
                                player = new { id = playerIdInt, name = "" },
                                teams = new[]
                                {
                                    new
                                    {
                                        team = new { id = 0, name = teamName },
                                        groups = playerGroups
                                    }
                                }
                            }
                        }
                    };
                    return JsonSerializer.Serialize(result);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extracting player {PlayerId} from game stats", playerId);
        }

        return JsonSerializer.Serialize(new { response = Array.Empty<object>() });
    }

    private async Task<string?> FetchRawJsonAsync(string baseUrl, string path, Dictionary<string, string> queryParams)
    {
        var result = await _apiSports.GetAsync<JsonElement>(baseUrl, path, queryParams);
        if (result is JsonElement elem && elem.ValueKind != JsonValueKind.Undefined)
            return elem.GetRawText();

        return null;
    }

    private static StatsResponseDto MapToDto(CachedStat s, string? source = null)
    {
        object? data = null;
        try { data = JsonSerializer.Deserialize<JsonElement>(s.DataJson); }
        catch { data = s.DataJson; }

        return new StatsResponseDto
        {
            StatType = s.StatType,
            Season = s.Season,
            Data = data,
            LastUpdated = s.LastUpdated,
            Source = source
        };
    }

    private static StatsResponseDto BuildNoDataResponse(string sportName, int season)
    {
        return new StatsResponseDto
        {
            StatType = "seasonal",
            Season = season.ToString(),
            Data = JsonSerializer.Deserialize<JsonElement>("{\"response\":[]}"),
            LastUpdated = DateTime.UtcNow,
            Message = $"No {sportName} stats available for the {season} season. The season may not have started yet."
        };
    }
}
