namespace SportsStats.API.Infrastructure;

public static class ApiSportsEndpoints
{
    public const string PlayersSearchPath = "/players";
    public const string StatisticsPath = "/players/statistics";
    public const string GamesPath = "/games";
    public const string GamePlayerStatsPath = "/games/statistics/players";

    // NFL uses /players?search=name&season=year
    // NBA uses /players?search=name&season=year
    // MLB uses /players?search=name&season=year
    // NHL uses /players?search=name&season=year
    // The search param is consistent across all sports

    public static Dictionary<string, string> PlayerSearchParams(string name, int? season = null)
    {
        var p = new Dictionary<string, string> { ["search"] = name };
        if (season.HasValue) p["season"] = season.Value.ToString();
        return p;
    }

    public static Dictionary<string, string> PlayerStatsParams(string playerId, int? season = null)
    {
        var p = new Dictionary<string, string> { ["id"] = playerId };
        if (season.HasValue) p["season"] = season.Value.ToString();
        return p;
    }

    public static Dictionary<string, string> GameLogParams(string playerId, int season)
        => new() { ["id"] = playerId, ["season"] = season.ToString() };
}
