namespace SportsStats.API.Infrastructure;

public static class EspnEndpoints
{
    public static string Search(string sport, string league, string query)
        => $"https://site.api.espn.com/apis/common/v3/search?query={Uri.EscapeDataString(query)}&type=player&sport={sport}&league={league}";

    public static string Splits(string sport, string league, string athleteId, int season)
        => $"https://site.web.api.espn.com/apis/common/v3/sports/{sport}/{league}/athletes/{athleteId}/splits?season={season}";

    public static string GameLog(string sport, string league, string athleteId, int season)
        => $"https://site.web.api.espn.com/apis/common/v3/sports/{sport}/{league}/athletes/{athleteId}/gamelog?season={season}";

    public static string GameSummary(string sport, string league, string eventId)
        => $"https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/summary?event={eventId}";
}
