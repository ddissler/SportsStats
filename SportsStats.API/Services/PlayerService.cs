using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using SportsStats.API.Data;
using SportsStats.API.Models.ApiSports;
using SportsStats.API.Models.DTOs;
using SportsStats.API.Models.Entities;
using SportsStats.API.Services.Interfaces;
using SportsStats.API.Infrastructure;

namespace SportsStats.API.Services;

public class PlayerService : IPlayerService
{
    private readonly SportsStatsDbContext _db;
    private readonly IApiSportsService _apiSports;
    private readonly IEspnService _espn;
    private readonly ILogger<PlayerService> _logger;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(24);

    public PlayerService(SportsStatsDbContext db, IApiSportsService apiSports, IEspnService espn, ILogger<PlayerService> logger)
    {
        _db = db;
        _apiSports = apiSports;
        _espn = espn;
        _logger = logger;
    }

    public async Task<PaginatedResult<PlayerDto>> SearchPlayersAsync(int sportId, string name, bool? isActive, int page = 1, int pageSize = 10)
    {
        var sport = await _db.Sports.FindAsync(sportId)
            ?? throw new KeyNotFoundException($"Sport {sportId} not found");

        var cutoff = DateTime.UtcNow - CacheDuration;

        // Check cache for any player matching name in this sport
        var cached = await _db.CachedPlayers
            .Where(p => p.SportId == sportId &&
                        p.Name.Contains(name) &&
                        p.LastUpdated > cutoff)
            .ToListAsync();

        if (cached.Count == 0)
        {
            // Cache miss — try ESPN first, then API-Sports fallback
            var fetched = false;

            if (!string.IsNullOrEmpty(sport.EspnSport))
            {
                fetched = await SearchViaEspnAsync(sport, name);
            }

            if (!fetched)
            {
                await SearchViaApiSportsAsync(sport, name);
            }
        }
        else
        {
            _logger.LogInformation("Cache hit for player search: {Name} in sport {SportId}", name, sportId);
        }

        var query = _db.CachedPlayers
            .Where(p => p.SportId == sportId &&
                        p.Name.Contains(name) &&
                        (isActive == null || p.IsActive == isActive))
            .OrderBy(p => p.Name);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => MapToDto(p))
            .ToListAsync();

        return new PaginatedResult<PlayerDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<PlayerDto?> GetPlayerByIdAsync(int sportId, string playerId)
    {
        var player = await _db.CachedPlayers
            .FirstOrDefaultAsync(p => p.SportId == sportId && p.ExternalPlayerId == playerId);

        return player is null ? null : MapToDto(player);
    }

    private async Task<bool> SearchViaEspnAsync(Sport sport, string name)
    {
        _logger.LogInformation("Cache miss — calling ESPN for: {Name} in sport {SportId}", name, sport.Id);

        var result = await _espn.SearchPlayersAsync(sport.EspnSport!, sport.EspnLeague!, name);
        if (result is null) return false;

        var root = result.Value;
        if (!root.TryGetProperty("items", out var items) || items.GetArrayLength() == 0)
            return false;

        var anyAdded = false;
        foreach (var item in items.EnumerateArray())
        {
            // Only include player-type results
            var type = item.TryGetProperty("type", out var t) ? t.GetString() ?? "" : "";
            if (!type.Contains("player", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(type))
                continue;

            var displayName = item.TryGetProperty("displayName", out var dn) ? dn.GetString() : null;
            if (string.IsNullOrWhiteSpace(displayName)) continue;

            // Extract ESPN athlete ID from the item
            var espnId = "";
            if (item.TryGetProperty("id", out var idProp))
                espnId = idProp.GetString() ?? "";
            if (string.IsNullOrEmpty(espnId) && item.TryGetProperty("$ref", out var refProp))
            {
                // Parse ID from URL like ".../athletes/12345?..."
                var refUrl = refProp.GetString() ?? "";
                var match = System.Text.RegularExpressions.Regex.Match(refUrl, @"/athletes/(\d+)");
                if (match.Success) espnId = match.Groups[1].Value;
            }
            if (string.IsNullOrEmpty(espnId)) continue;

            var position = item.TryGetProperty("position", out var pos) ? pos.GetString() : null;
            var headshot = item.TryGetProperty("headshot", out var hs) ? hs.GetString() : null;
            var team = item.TryGetProperty("team", out var tm) ? tm.GetString() : null;

            // Check for existing player with same name+sport (dedup)
            var existing = await _db.CachedPlayers
                .FirstOrDefaultAsync(p => p.SportId == sport.Id && p.ExternalPlayerId == espnId);

            if (existing is null)
            {
                // Also check by name to avoid duplicates from different providers
                existing = await _db.CachedPlayers
                    .FirstOrDefaultAsync(p => p.SportId == sport.Id && p.Name == displayName);
            }

            if (existing is null)
            {
                existing = new CachedPlayer
                {
                    SportId = sport.Id,
                    ExternalPlayerId = espnId,
                    EspnPlayerId = espnId
                };
                _db.CachedPlayers.Add(existing);
            }
            else
            {
                existing.EspnPlayerId = espnId;
                if (existing.ExternalPlayerId != espnId)
                {
                    // Keep existing ExternalPlayerId if it was an API-Sports ID
                    existing.ApiSportsPlayerId ??= existing.ExternalPlayerId;
                    existing.ExternalPlayerId = espnId;
                }
            }

            existing.Name = displayName;
            existing.PhotoUrl = headshot ?? existing.PhotoUrl;
            existing.Position = position ?? existing.Position;
            existing.IsActive = true;
            existing.LastUpdated = DateTime.UtcNow;
            anyAdded = true;
        }

        if (anyAdded)
            await _db.SaveChangesAsync();

        return anyAdded;
    }

    private async Task SearchViaApiSportsAsync(Sport sport, string name)
    {
        _logger.LogInformation("Falling back to API-Sports for: {Name} in sport {SportId}", name, sport.Id);

        var apiResponse = await _apiSports.GetAsync<ApiSportsResponse<ApiSportsPlayer>>(
            sport.ApiSportsBaseUrl,
            ApiSportsEndpoints.PlayersSearchPath,
            ApiSportsEndpoints.PlayerSearchParams(name)
        );

        if (apiResponse?.Response is not { Count: > 0 }) return;

        foreach (var apiPlayer in apiResponse.Response)
        {
            var fullName = string.IsNullOrWhiteSpace(apiPlayer.Name)
                ? $"{apiPlayer.Firstname} {apiPlayer.Lastname}".Trim()
                : apiPlayer.Name;

            if (string.IsNullOrWhiteSpace(fullName)) continue;

            var externalId = apiPlayer.Id.ToString();
            var entity = await _db.CachedPlayers
                .FirstOrDefaultAsync(p => p.SportId == sport.Id && p.ExternalPlayerId == externalId);

            if (entity is null)
            {
                entity = new CachedPlayer
                {
                    SportId = sport.Id,
                    ExternalPlayerId = externalId,
                    ApiSportsPlayerId = externalId
                };
                _db.CachedPlayers.Add(entity);
            }
            else
            {
                entity.ApiSportsPlayerId = externalId;
            }

            entity.Name = fullName;
            entity.PhotoUrl = apiPlayer.Photo ?? apiPlayer.Image;
            entity.Position = apiPlayer.Position ?? apiPlayer.Group;
            entity.Age = apiPlayer.Age;
            entity.Height = apiPlayer.Height;
            entity.Weight = apiPlayer.Weight;
            entity.College = apiPlayer.College;
            entity.Number = apiPlayer.Number;
            entity.Experience = apiPlayer.Experience;
            entity.IsActive = apiPlayer.Leagues?.Standard?.Active ?? true;
            entity.LastUpdated = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
    }

    private static PlayerDto MapToDto(CachedPlayer p) => new()
    {
        Id = p.ExternalPlayerId,
        Name = p.Name,
        PhotoUrl = p.PhotoUrl,
        Position = p.Position,
        Age = p.Age,
        Height = p.Height,
        Weight = p.Weight,
        College = p.College,
        Number = p.Number,
        Experience = p.Experience,
        IsActive = p.IsActive
    };
}
