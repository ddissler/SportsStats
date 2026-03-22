namespace SportsStats.API.Services.Interfaces;

public interface IApiSportsService
{
    Task<T?> GetAsync<T>(string baseUrl, string path, Dictionary<string, string>? queryParams = null);
}
