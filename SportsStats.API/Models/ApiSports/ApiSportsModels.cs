using System.Text.Json.Serialization;

namespace SportsStats.API.Models.ApiSports;

public class ApiSportsResponse<T>
{
    [JsonPropertyName("errors")]
    public object? Errors { get; set; }

    [JsonPropertyName("results")]
    public int Results { get; set; }

    [JsonPropertyName("response")]
    public List<T> Response { get; set; } = new();
}

// ---------- Player ----------

public class ApiSportsPlayer
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("firstname")]
    public string? Firstname { get; set; }

    [JsonPropertyName("lastname")]
    public string? Lastname { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }  // some sports use full name directly

    [JsonPropertyName("photo")]
    public string? Photo { get; set; }

    [JsonPropertyName("position")]
    public string? Position { get; set; }

    // Used by NBA
    [JsonPropertyName("leagues")]
    public ApiSportsLeagues? Leagues { get; set; }
}

public class ApiSportsLeagues
{
    [JsonPropertyName("standard")]
    public ApiSportsLeagueInfo? Standard { get; set; }
}

public class ApiSportsLeagueInfo
{
    [JsonPropertyName("active")]
    public bool Active { get; set; }

    [JsonPropertyName("jersey")]
    public int? Jersey { get; set; }
}

// ---------- Team ----------

public class ApiSportsTeam
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("logo")]
    public string? Logo { get; set; }
}

// ---------- Statistics ----------

public class ApiSportsStatEntry
{
    // Generic holder — each sport has different stat shapes.
    // We store the raw JSON and let the frontend render it.
    [JsonPropertyName("team")]
    public ApiSportsTeam? Team { get; set; }

    [JsonPropertyName("game")]
    public ApiSportsGame? Game { get; set; }

    [JsonPropertyName("season")]
    public object? Season { get; set; }
}

// ---------- League / Season ----------

public class ApiSportsLeagueDetail
{
    [JsonPropertyName("league")]
    public ApiSportsLeagueInfo2? League { get; set; }

    [JsonPropertyName("seasons")]
    public List<ApiSportsSeasonInfo>? Seasons { get; set; }
}

public class ApiSportsLeagueInfo2
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }
}

public class ApiSportsSeasonInfo
{
    [JsonPropertyName("year")]
    public int Year { get; set; }

    [JsonPropertyName("current")]
    public bool? Current { get; set; }

    [JsonPropertyName("start")]
    public string? Start { get; set; }

    [JsonPropertyName("end")]
    public string? End { get; set; }
}

public class ApiSportsGame
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("date")]
    public string? Date { get; set; }
}
