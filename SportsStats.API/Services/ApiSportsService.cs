using System.Text.Json;
using SportsStats.API.Services.Interfaces;

namespace SportsStats.API.Services;

public class ApiSportsService : IApiSportsService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ApiSportsService> _logger;

    public ApiSportsService(IHttpClientFactory httpClientFactory, ILogger<ApiSportsService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<T?> GetAsync<T>(string baseUrl, string path, Dictionary<string, string>? queryParams = null)
    {
        var client = _httpClientFactory.CreateClient("ApiSports");

        var query = queryParams is { Count: > 0 }
            ? "?" + string.Join("&", queryParams.Select(kvp => $"{Uri.EscapeDataString(kvp.Key)}={Uri.EscapeDataString(kvp.Value)}"))
            : string.Empty;

        var url = $"{baseUrl}{path}{query}";

        try
        {
            _logger.LogInformation("API-Sports request: {Url}", url);
            var response = await client.GetAsync(url);
            response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadAsStringAsync();

            return JsonSerializer.Deserialize<T>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "API-Sports request failed: {Url}", url);
            return default;
        }
    }
}
