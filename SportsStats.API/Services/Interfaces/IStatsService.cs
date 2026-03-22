using SportsStats.API.Models.DTOs;

namespace SportsStats.API.Services.Interfaces;

public interface IStatsService
{
    Task<StatsResponseDto?> GetSeasonalStatsAsync(int sportId, string playerId, int season);
    Task<List<StatsResponseDto>> GetCareerStatsAsync(int sportId, string playerId);
    Task<StatsResponseDto?> GetGameLogsAsync(int sportId, string playerId, int season);
}
