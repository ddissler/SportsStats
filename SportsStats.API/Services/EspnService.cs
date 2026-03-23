using System.Text.Json;
using SportsStats.API.Infrastructure;
using SportsStats.API.Services.Interfaces;

namespace SportsStats.API.Services;

public class EspnService : IEspnService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<EspnService> _logger;

    public EspnService(IHttpClientFactory httpClientFactory, ILogger<EspnService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public Task<JsonElement?> SearchPlayersAsync(string espnSport, string espnLeague, string query)
        => FetchAsync(EspnEndpoints.Search(espnSport, espnLeague, query));

    public Task<JsonElement?> GetPlayerSplitsAsync(string espnSport, string espnLeague, string athleteId, int season)
        => FetchAsync(EspnEndpoints.Splits(espnSport, espnLeague, athleteId, season));

    public Task<JsonElement?> GetPlayerGameLogAsync(string espnSport, string espnLeague, string athleteId, int season)
        => FetchAsync(EspnEndpoints.GameLog(espnSport, espnLeague, athleteId, season));

    public Task<JsonElement?> GetGameSummaryAsync(string espnSport, string espnLeague, string eventId)
        => FetchAsync(EspnEndpoints.GameSummary(espnSport, espnLeague, eventId));

    private async Task<JsonElement?> FetchAsync(string url)
    {
        var client = _httpClientFactory.CreateClient("Espn");
        try
        {
            _logger.LogInformation("ESPN request: {Url}", url);
            var response = await client.GetAsync(url);
            response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<JsonElement>(content);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "ESPN request failed: {Url}", url);
            return null;
        }
    }
}
