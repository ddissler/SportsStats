using SportsStats.API.Models.DTOs;

namespace SportsStats.API.Services.Interfaces;

public interface IPlayerService
{
    Task<PaginatedResult<PlayerDto>> SearchPlayersAsync(int sportId, string name, bool? isActive, int page = 1, int pageSize = 10);
    Task<PlayerDto?> GetPlayerByIdAsync(int sportId, string playerId);
    Task<List<PlayerWithStatsDto>> ListPlayersWithStatsAsync(int sportId, int season, string? position);
}
