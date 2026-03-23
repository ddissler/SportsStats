using System.Text.Json;
using SportsStats.API.Models.DTOs;

namespace SportsStats.API.Services;

/// <summary>
/// Normalizes ESPN API responses into the shapes the frontend StatsTable already parses.
/// Target shape (NFL-style): { response: [{ teams: [{ team: {id,name}, groups: [{ name, statistics: [{name,value}] }] }] }] }
/// </summary>
public static class EspnResponseNormalizer
{
    /// <summary>
    /// Normalizes ESPN splits response into NFL-style JSON.
    /// ESPN format:
    ///   displayNames: ["Completions", "Passing Attempts", ...]  (flat across all categories)
    ///   categories: [{ displayName: "Passing", count: 10 }, { displayName: "Rushing", count: 5 }]
    ///   splitCategories: [{ splits: [{ displayName: "All Splits", stats: ["327","498",...] }] }]
    /// The categories[].count tells how many displayNames/stats belong to each group.
    /// </summary>
    public static string NormalizeSplits(JsonElement espnJson)
    {
        var groups = new List<object>();

        // Get the full stat names list
        string[] statNames;
        if (espnJson.TryGetProperty("displayNames", out var displayNames))
            statNames = displayNames.EnumerateArray().Select(n => n.GetString() ?? "").ToArray();
        else if (espnJson.TryGetProperty("labels", out var labels))
            statNames = labels.EnumerateArray().Select(n => n.GetString() ?? "").ToArray();
        else
            return BuildEmptyResponse();

        // Find the "All Splits" stats from splitCategories
        string[]? allStats = null;
        if (espnJson.TryGetProperty("splitCategories", out var splitCats))
        {
            foreach (var splitCat in splitCats.EnumerateArray())
            {
                if (!splitCat.TryGetProperty("splits", out var splits)) continue;
                foreach (var split in splits.EnumerateArray())
                {
                    var splitName = split.TryGetProperty("displayName", out var sdn) ? sdn.GetString() ?? "" : "";
                    if (splitName == "All Splits" || splitName == "Total")
                    {
                        if (split.TryGetProperty("stats", out var stats))
                            allStats = stats.EnumerateArray().Select(s => s.GetString() ?? "0").ToArray();
                        break;
                    }
                }
                if (allStats is not null) break;
            }
        }

        if (allStats is null || allStats.Length == 0)
            return BuildEmptyResponse();

        // Group stats by category using the count field
        if (espnJson.TryGetProperty("categories", out var categories))
        {
            int offset = 0;
            foreach (var cat in categories.EnumerateArray())
            {
                var catName = cat.TryGetProperty("displayName", out var dn) ? dn.GetString() ?? "Stats" : "Stats";
                var count = cat.TryGetProperty("count", out var c) ? c.GetInt32() : 0;

                if (count <= 0) continue;

                var statEntries = new List<object>();
                for (int i = offset; i < offset + count && i < allStats.Length && i < statNames.Length; i++)
                {
                    statEntries.Add(new { name = statNames[i], value = allStats[i] });
                }

                if (statEntries.Count > 0)
                    groups.Add(new { name = catName, statistics = statEntries });

                offset += count;
            }
        }
        else
        {
            // No categories — put all stats in a single group
            var statEntries = new List<object>();
            for (int i = 0; i < allStats.Length && i < statNames.Length; i++)
            {
                statEntries.Add(new { name = statNames[i], value = allStats[i] });
            }
            if (statEntries.Count > 0)
                groups.Add(new { name = "Statistics", statistics = statEntries });
        }

        return BuildResponse(groups);
    }

    /// <summary>
    /// Normalizes ESPN gamelog into a list of GameDto.
    /// ESPN format:
    ///   events: { "401772976": { id, week, atVs, gameDate, score, opponent: {displayName, logo}, ... }, ... }
    ///   (events is an object keyed by event ID, or may be an array)
    /// </summary>
    public static List<GameDto> NormalizeGameLog(JsonElement espnJson)
    {
        var games = new List<GameDto>();
        var seenEventIds = new HashSet<string>();

        if (!espnJson.TryGetProperty("events", out var events))
            return games;

        // Events can be an object (keyed by ID) or an array
        IEnumerable<JsonElement> eventList;
        if (events.ValueKind == JsonValueKind.Object)
            eventList = events.EnumerateObject().Select(p => p.Value);
        else if (events.ValueKind == JsonValueKind.Array)
            eventList = events.EnumerateArray();
        else
            return games;

        foreach (var evt in eventList)
        {
            var eventId = evt.TryGetProperty("id", out var eid) ? eid.GetString() ?? "" : "";
            // Fallback to eventId field name
            if (string.IsNullOrEmpty(eventId) && evt.TryGetProperty("eventId", out var eid2))
                eventId = eid2.GetString() ?? "";
            if (string.IsNullOrEmpty(eventId) || !seenEventIds.Add(eventId)) continue;

            var gameDate = "";
            var opponentName = "";
            string? opponentLogo = null;

            if (evt.TryGetProperty("opponent", out var opponent))
            {
                opponentName = opponent.TryGetProperty("displayName", out var odn) ? odn.GetString() ?? "" : "";
                opponentLogo = opponent.TryGetProperty("logo", out var ologo) ? ologo.GetString() : null;
            }

            if (evt.TryGetProperty("gameDate", out var gd))
                gameDate = gd.GetString() ?? "";

            var atVs = evt.TryGetProperty("atVs", out var av) ? av.GetString() ?? "" : "";
            var score = evt.TryGetProperty("score", out var sc) ? sc.GetString() ?? "" : "";
            var gameResult = evt.TryGetProperty("gameResult", out var gr) ? gr.GetString() ?? "" : "";

            // Week can be int or string
            var week = "";
            if (evt.TryGetProperty("week", out var w))
            {
                if (w.ValueKind == JsonValueKind.Number)
                    week = $"Wk {w.GetInt32()}";
                else if (w.ValueKind == JsonValueKind.String)
                    week = w.GetString() ?? "";
                else if (w.ValueKind == JsonValueKind.Object && w.TryGetProperty("text", out var wt))
                    week = wt.GetString() ?? "";
            }

            // Parse date to short format
            if (DateTime.TryParse(gameDate, out var parsedDate))
                gameDate = parsedDate.ToString("MM/dd");

            // Parse score "30-6" into home/away scores
            int? homeScore = null;
            int? awayScore = null;
            if (!string.IsNullOrEmpty(score) && score.Contains('-'))
            {
                var parts = score.Split('-');
                if (parts.Length == 2 && int.TryParse(parts[0], out var s1) && int.TryParse(parts[1], out var s2))
                {
                    // ESPN score format: "awayScore-homeScore" when atVs=="vs" (home), or contextual
                    // The score string from ESPN's perspective: first number is opponent, second is player's team?
                    // Actually from the data: score="30-6", awayTeamScore="30", homeTeamScore="6"
                    // So score is "away-home" format
                    if (atVs == "vs") // player's team is home
                    {
                        awayScore = s1;
                        homeScore = s2;
                    }
                    else // player's team is away
                    {
                        homeScore = s1;
                        awayScore = s2;
                    }
                }
            }

            // Also try explicit score fields
            if (homeScore is null && evt.TryGetProperty("homeTeamScore", out var hts))
            {
                var htsStr = hts.GetString() ?? "";
                if (int.TryParse(htsStr, out var h)) homeScore = h;
            }
            if (awayScore is null && evt.TryGetProperty("awayTeamScore", out var ats))
            {
                var atsStr = ats.GetString() ?? "";
                if (int.TryParse(atsStr, out var a)) awayScore = a;
            }

            // Add event note to week if present (e.g. "AFC Wild Card Playoffs")
            if (evt.TryGetProperty("eventNote", out var note))
            {
                var noteStr = note.GetString();
                if (!string.IsNullOrEmpty(noteStr))
                    week = string.IsNullOrEmpty(week) ? noteStr : $"{week} - {noteStr}";
            }

            if (int.TryParse(eventId, out var gameIdInt))
            {
                // atVs=="vs" means player's team is home, opponent is away
                // atVs=="@" means player's team is away, opponent is home
                games.Add(new GameDto
                {
                    GameId = gameIdInt,
                    Date = gameDate,
                    Stage = gameResult,
                    Week = week,
                    HomeTeam = atVs == "vs" ? "" : opponentName,
                    HomeTeamLogo = atVs == "vs" ? null : opponentLogo,
                    HomeScore = homeScore,
                    AwayTeam = atVs == "vs" ? opponentName : "",
                    AwayTeamLogo = atVs == "vs" ? opponentLogo : null,
                    AwayScore = awayScore
                });
            }
        }

        return games;
    }

    /// <summary>
    /// Normalizes ESPN game summary (boxscore) for a specific player into NFL-style JSON.
    /// ESPN format: boxscore.players[].{ team, statistics[].{ name, labels, athletes[].{ athlete: {id}, stats[] } } }
    /// </summary>
    public static string NormalizeBoxScore(JsonElement espnJson, string athleteId)
    {
        var playerGroups = new List<object>();
        var teamName = "";

        if (!espnJson.TryGetProperty("boxscore", out var boxscore)) goto done;
        if (!boxscore.TryGetProperty("players", out var players)) goto done;

        foreach (var teamEntry in players.EnumerateArray())
        {
            var currentTeamName = "";
            if (teamEntry.TryGetProperty("team", out var team))
            {
                currentTeamName = team.TryGetProperty("displayName", out var tdn) ? tdn.GetString() ?? "" : "";
                if (string.IsNullOrEmpty(currentTeamName))
                    currentTeamName = team.TryGetProperty("name", out var tn) ? tn.GetString() ?? "" : "";
            }

            if (!teamEntry.TryGetProperty("statistics", out var statistics)) continue;

            foreach (var statCategory in statistics.EnumerateArray())
            {
                var catName = statCategory.TryGetProperty("name", out var cn) ? cn.GetString() ?? "Stats" : "Stats";

                // Get labels (abbreviations like "C/ATT", "YDS", "TD")
                var labels = new List<string>();
                if (statCategory.TryGetProperty("labels", out var labelsArr))
                {
                    foreach (var label in labelsArr.EnumerateArray())
                        labels.Add(label.GetString() ?? "");
                }

                // Prefer full descriptions if available
                if (statCategory.TryGetProperty("descriptions", out var descArr))
                {
                    var descs = descArr.EnumerateArray().Select(d => d.GetString() ?? "").ToArray();
                    if (descs.Length == labels.Count)
                        labels = descs.ToList();
                }

                if (!statCategory.TryGetProperty("athletes", out var athletes)) continue;

                foreach (var athlete in athletes.EnumerateArray())
                {
                    var aid = "";
                    if (athlete.TryGetProperty("athlete", out var ath))
                        aid = ath.TryGetProperty("id", out var aId) ? aId.GetString() ?? "" : "";

                    if (aid != athleteId) continue;

                    teamName = currentTeamName;

                    if (athlete.TryGetProperty("stats", out var stats))
                    {
                        var statEntries = new List<object>();
                        var statsArr = stats.EnumerateArray().ToArray();
                        for (int i = 0; i < statsArr.Length && i < labels.Count; i++)
                        {
                            statEntries.Add(new { name = labels[i], value = statsArr[i].GetString() ?? "0" });
                        }

                        if (statEntries.Count > 0)
                            playerGroups.Add(new { name = catName, statistics = statEntries });
                    }
                }
            }
        }

        done:
        return BuildResponse(playerGroups, teamName);
    }

    private static string BuildResponse(List<object> groups, string teamName = "")
    {
        var result = new
        {
            response = new[]
            {
                new
                {
                    teams = new[]
                    {
                        new
                        {
                            team = new { id = 0, name = teamName },
                            groups
                        }
                    }
                }
            }
        };
        return JsonSerializer.Serialize(result);
    }

    private static string BuildEmptyResponse()
    {
        return JsonSerializer.Serialize(new
        {
            response = new[]
            {
                new
                {
                    teams = new[]
                    {
                        new
                        {
                            team = new { id = 0, name = "" },
                            groups = new List<object>()
                        }
                    }
                }
            }
        });
    }
}
