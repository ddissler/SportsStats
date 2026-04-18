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

    [JsonPropertyName("image")]
    public string? Image { get; set; }

    [JsonPropertyName("age")]
    public int? Age { get; set; }

    [JsonPropertyName("height")]
    public string? Height { get; set; }

    [JsonPropertyName("weight")]
    public string? Weight { get; set; }

    [JsonPropertyName("college")]
    public string? College { get; set; }

    [JsonPropertyName("position")]
    public string? Position { get; set; }

    [JsonPropertyName("group")]
    public string? Group { get; set; }

    [JsonPropertyName("number")]
    public int? Number { get; set; }

    [JsonPropertyName("experience")]
    public int? Experience { get; set; }

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

// ---------- NFL Teams ----------

public class NflTeamDetail
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("logo")]
    public string? Logo { get; set; }

    [JsonPropertyName("abbreviation")]
    public string? Abbreviation { get; set; }

    // Some response shapes nest team under a "team" key
    [JsonPropertyName("team")]
    public NflTeamDetail? Team { get; set; }
}

// ---------- NFL Games ----------

public class NflGame
{
    [JsonPropertyName("game")]
    public NflGameInfo? Game { get; set; }

    [JsonPropertyName("teams")]
    public NflGameTeams? Teams { get; set; }

    [JsonPropertyName("scores")]
    public NflGameScores? Scores { get; set; }

    [JsonPropertyName("status")]
    public NflGameStatus? Status { get; set; }
}

public class NflGameInfo
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("week")]
    public string? Week { get; set; }

    [JsonPropertyName("stage")]
    public string? Stage { get; set; }
}

public class NflGameTeams
{
    [JsonPropertyName("home")]
    public NflTeamRef? Home { get; set; }

    [JsonPropertyName("away")]
    public NflTeamRef? Away { get; set; }
}

public class NflTeamRef
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("logo")]
    public string? Logo { get; set; }
}

public class NflGameScores
{
    [JsonPropertyName("home")]
    public NflGameScore? Home { get; set; }

    [JsonPropertyName("away")]
    public NflGameScore? Away { get; set; }
}

public class NflGameScore
{
    [JsonPropertyName("total")]
    public int? Total { get; set; }
}

public class NflGameStatus
{
    // "FT" = Final, "AOT" = Final (OT), "NS" = Not Started, etc.
    [JsonPropertyName("short")]
    public string? Short { get; set; }
}

// ---------- NFL Team Statistics ----------

public class NflTeamStatsEntry
{
    [JsonPropertyName("team")]
    public NflTeamRef? Team { get; set; }

    [JsonPropertyName("statistics")]
    public List<NflStatCategory>? Statistics { get; set; }
}

public class NflStatCategory
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("groups")]
    public List<NflStatGroup>? Groups { get; set; }
}

public class NflStatGroup
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("statistics")]
    public List<NflStatItem>? Statistics { get; set; }
}

public class NflStatItem
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("value")]
    public string? Value { get; set; }
}
