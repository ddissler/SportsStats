using SportsStats.API.Models.DTOs;

namespace SportsStats.API.Services.Interfaces;

public interface IStatsService
{
    Task<StatsResponseDto?> GetSeasonalStatsAsync(int sportId, string playerId, int season);
    Task<List<GameDto>> GetGamesAsync(int sportId, string playerId, int season);
    Task<StatsResponseDto?> GetGameStatsAsync(int sportId, string playerId, int gameId);
}
