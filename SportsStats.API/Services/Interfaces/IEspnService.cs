using System.Text.Json;

namespace SportsStats.API.Services.Interfaces;

public interface IEspnService
{
    Task<JsonElement?> SearchPlayersAsync(string espnSport, string espnLeague, string query);
    Task<JsonElement?> GetPlayerSplitsAsync(string espnSport, string espnLeague, string athleteId, int season);
    Task<JsonElement?> GetPlayerGameLogAsync(string espnSport, string espnLeague, string athleteId, int season);
    Task<JsonElement?> GetGameSummaryAsync(string espnSport, string espnLeague, string eventId);
}
