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
    private readonly ILogger<PlayerService> _logger;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(24);

    public PlayerService(SportsStatsDbContext db, IApiSportsService apiSports, ILogger<PlayerService> logger)
    {
        _db = db;
        _apiSports = apiSports;
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
            // Cache miss — call API-Sports
            _logger.LogInformation("Cache miss — calling API-Sports for: {Name} in sport {SportId}", name, sportId);
            var apiResponse = await _apiSports.GetAsync<ApiSportsResponse<ApiSportsPlayer>>(
                sport.ApiSportsBaseUrl,
                ApiSportsEndpoints.PlayersSearchPath,
                ApiSportsEndpoints.PlayerSearchParams(name)
            );

            if (apiResponse?.Response is { Count: > 0 })
            {
                foreach (var apiPlayer in apiResponse.Response)
                {
                    var fullName = string.IsNullOrWhiteSpace(apiPlayer.Name)
                        ? $"{apiPlayer.Firstname} {apiPlayer.Lastname}".Trim()
                        : apiPlayer.Name;

                    if (string.IsNullOrWhiteSpace(fullName)) continue;

                    var externalId = apiPlayer.Id.ToString();
                    var entity = await _db.CachedPlayers
                        .FirstOrDefaultAsync(p => p.SportId == sportId && p.ExternalPlayerId == externalId);

                    if (entity is null)
                    {
                        entity = new CachedPlayer { SportId = sportId, ExternalPlayerId = externalId };
                        _db.CachedPlayers.Add(entity);
                    }

                    entity.Name = fullName;
                    entity.PhotoUrl = apiPlayer.Photo;
                    entity.IsActive = apiPlayer.Leagues?.Standard?.Active ?? true;
                    entity.LastUpdated = DateTime.UtcNow;
                }

                await _db.SaveChangesAsync();
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

    private static PlayerDto MapToDto(CachedPlayer p) => new()
    {
        Id = p.ExternalPlayerId,
        Name = p.Name,
        PhotoUrl = p.PhotoUrl,
        IsActive = p.IsActive
    };
}
