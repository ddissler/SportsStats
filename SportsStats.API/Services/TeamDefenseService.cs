using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using SportsStats.API.Data;
using SportsStats.API.Infrastructure;
using SportsStats.API.Models.ApiSports;
using SportsStats.API.Models.DTOs;
using SportsStats.API.Models.Entities;
using SportsStats.API.Services.Interfaces;

namespace SportsStats.API.Services;

public class TeamDefenseService : ITeamDefenseService
{
    private readonly SportsStatsDbContext _db;
    private readonly IApiSportsService _apiSports;
    private readonly ISeasonStatusService _seasonStatus;
    private readonly ILogger<TeamDefenseService> _logger;

    private const int NflSportId = 1;
    private const string NflLeagueId = "1";
    private const string NflBaseUrl = "https://v1.american-football.api-sports.io";
    private static readonly TimeSpan ActiveTtl = TimeSpan.FromHours(24);

    // Standard team abbreviations for display — keyed by common name variations
    private static readonly Dictionary<string, string> KnownAbbreviations =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["Arizona Cardinals"] = "ARI",   ["Atlanta Falcons"] = "ATL",
            ["Baltimore Ravens"] = "BAL",     ["Buffalo Bills"] = "BUF",
            ["Carolina Panthers"] = "CAR",    ["Chicago Bears"] = "CHI",
            ["Cincinnati Bengals"] = "CIN",   ["Cleveland Browns"] = "CLE",
            ["Dallas Cowboys"] = "DAL",       ["Denver Broncos"] = "DEN",
            ["Detroit Lions"] = "DET",        ["Green Bay Packers"] = "GB",
            ["Houston Texans"] = "HOU",       ["Indianapolis Colts"] = "IND",
            ["Jacksonville Jaguars"] = "JAX", ["Kansas City Chiefs"] = "KC",
            ["Las Vegas Raiders"] = "LV",     ["Los Angeles Chargers"] = "LAC",
            ["Los Angeles Rams"] = "LAR",     ["Miami Dolphins"] = "MIA",
            ["Minnesota Vikings"] = "MIN",    ["New England Patriots"] = "NE",
            ["New Orleans Saints"] = "NO",    ["New York Giants"] = "NYG",
            ["New York Jets"] = "NYJ",        ["Philadelphia Eagles"] = "PHI",
            ["Pittsburgh Steelers"] = "PIT",  ["San Francisco 49ers"] = "SF",
            ["Seattle Seahawks"] = "SEA",     ["Tampa Bay Buccaneers"] = "TB",
            ["Tennessee Titans"] = "TEN",     ["Washington Commanders"] = "WAS",
            ["Washington Football Team"] = "WAS",
        };

    public TeamDefenseService(
        SportsStatsDbContext db,
        IApiSportsService apiSports,
        ISeasonStatusService seasonStatus,
        ILogger<TeamDefenseService> logger)
    {
        _db = db;
        _apiSports = apiSports;
        _seasonStatus = seasonStatus;
        _logger = logger;
    }

    public async Task<List<TeamDefenseDto>> GetSeasonDefenseAsync(int season)
    {
        var isCompleted = await _seasonStatus.IsSeasonCompletedAsync(NflSportId, season);

        // Ensure we have a team roster for this season
        await EnsureTeamListAsync(season);

        // For each cached team, refresh stale records
        var teams = await _db.CachedTeamDefenses
            .Where(t => t.Season == season)
            .ToListAsync();

        foreach (var record in teams)
        {
            if (isCompleted) continue;   // completed season — permanent cache
            if (DateTime.UtcNow - record.LastUpdated < ActiveTtl) continue;

            await RefreshTeamDefenseAsync(record, season);
        }

        // Re-load (some records may have been updated)
        var results = await _db.CachedTeamDefenses
            .Where(t => t.Season == season)
            .ToListAsync();

        return results
            .Select(MapToDto)
            .OrderByDescending(d => d.TotalFantasyPoints)
            .ToList();
    }

    // ── team list ──────────────────────────────────────────────────────────────

    private async Task EnsureTeamListAsync(int season)
    {
        // If we already have records for this season, nothing to do
        if (await _db.CachedTeamDefenses.AnyAsync(t => t.Season == season))
            return;

        _logger.LogInformation("Fetching NFL team list for season {Season}", season);

        var response = await _apiSports.GetAsync<ApiSportsResponse<NflTeamDetail>>(
            NflBaseUrl,
            ApiSportsEndpoints.TeamsPath,
            ApiSportsEndpoints.TeamsListParams(NflLeagueId, season));

        if (response?.Response is not { Count: > 0 })
        {
            _logger.LogWarning("No teams returned from API for NFL season {Season}", season);
            return;
        }

        foreach (var apiTeam in response.Response)
        {
            // Some endpoints wrap team data under a nested "team" object
            var t = apiTeam.Team ?? apiTeam;
            if (t.Id == 0 || string.IsNullOrWhiteSpace(t.Name)) continue;

            var teamId = t.Id.ToString();
            var abbr = t.Abbreviation ?? DeriveAbbr(t.Name);

            var record = await _db.CachedTeamDefenses
                .FirstOrDefaultAsync(x => x.ExternalTeamId == teamId && x.Season == season);

            if (record is null)
            {
                record = new CachedTeamDefense
                {
                    ExternalTeamId = teamId,
                    Season = season
                };
                _db.CachedTeamDefenses.Add(record);
            }

            record.TeamName = t.Name;
            record.TeamAbbr = abbr;
            record.LogoUrl = t.Logo;
            // LastUpdated stays at default (DateTime.MinValue) so it will be
            // treated as stale and refreshed on the next pass
        }

        await _db.SaveChangesAsync();

        // Now fetch actual stats for each team
        var newRecords = await _db.CachedTeamDefenses
            .Where(t => t.Season == season)
            .ToListAsync();

        foreach (var record in newRecords)
            await RefreshTeamDefenseAsync(record, season);
    }

    // ── per-team data refresh ──────────────────────────────────────────────────

    private async Task RefreshTeamDefenseAsync(CachedTeamDefense record, int season)
    {
        _logger.LogInformation(
            "Refreshing DEF/ST data for {TeamName} (id={TeamId}) season {Season}",
            record.TeamName, record.ExternalTeamId, season);

        var games = await FetchTeamGamesAsync(record.ExternalTeamId, season);
        var statsEntry = await FetchTeamStatsAsync(record.ExternalTeamId, season);

        var perGamePA = ExtractPerGamePointsAllowed(games, int.Parse(record.ExternalTeamId));
        var (sacks, ff, fr, ints, defTDs, stTDs, safeties, blocked, yardsAllowed)
            = ExtractDefenseStats(statsEntry);

        record.GamesPlayed = perGamePA.Count;
        record.TotalPointsAllowed = perGamePA.Sum();
        record.PerGamePointsAllowedJson = JsonSerializer.Serialize(perGamePA);
        record.YardsAllowed = yardsAllowed;
        record.Sacks = sacks;
        record.ForcedFumbles = ff;
        record.FumblesRecovered = fr;
        record.Interceptions = ints;
        record.DefensiveTDs = defTDs;
        record.SpecialTeamsTDs = stTDs;
        record.Safeties = safeties;
        record.BlockedKicks = blocked;
        record.LastUpdated = DateTime.UtcNow;

        await _db.SaveChangesAsync();
    }

    // ── API calls ──────────────────────────────────────────────────────────────

    private async Task<List<NflGame>> FetchTeamGamesAsync(string teamId, int season)
    {
        var response = await _apiSports.GetAsync<ApiSportsResponse<NflGame>>(
            NflBaseUrl,
            ApiSportsEndpoints.GamesPath,
            ApiSportsEndpoints.TeamGamesParams(NflLeagueId, season, teamId));

        return response?.Response ?? new List<NflGame>();
    }

    private async Task<NflTeamStatsEntry?> FetchTeamStatsAsync(string teamId, int season)
    {
        var response = await _apiSports.GetAsync<ApiSportsResponse<NflTeamStatsEntry>>(
            NflBaseUrl,
            ApiSportsEndpoints.TeamStatsPath,
            ApiSportsEndpoints.TeamStatsQueryParams(NflLeagueId, season, teamId));

        return response?.Response?.FirstOrDefault();
    }

    // ── parsing ────────────────────────────────────────────────────────────────

    private static List<int> ExtractPerGamePointsAllowed(List<NflGame> games, int teamId)
    {
        var result = new List<int>();
        foreach (var game in games)
        {
            // Only finished games
            var status = game.Status?.Short?.ToUpper();
            if (status is not ("FT" or "AOT" or "FINAL")) continue;

            var isHome = game.Teams?.Home?.Id == teamId;
            var opponentTotal = isHome
                ? game.Scores?.Away?.Total
                : game.Scores?.Home?.Total;

            if (opponentTotal.HasValue)
                result.Add(opponentTotal.Value);
        }
        return result;
    }

    /// <summary>
    /// Flattens all stat name→value pairs from the nested statistics structure and
    /// extracts known defensive stats by trying multiple possible API field names.
    /// </summary>
    private static (int sacks, int forcedFumbles, int fumblesRecovered, int interceptions,
                    int defensiveTDs, int specialTeamsTDs, int safeties, int blockedKicks,
                    int yardsAllowed)
        ExtractDefenseStats(NflTeamStatsEntry? entry)
    {
        if (entry?.Statistics is null)
            return (0, 0, 0, 0, 0, 0, 0, 0, 0);

        // Build a flat lookup: stat name (case-insensitive) → value string
        var lookup = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var cat in entry.Statistics)
        {
            foreach (var grp in cat.Groups ?? [])
            {
                foreach (var item in grp.Statistics ?? [])
                {
                    if (item.Name is not null && item.Value is not null)
                        lookup.TryAdd(item.Name.Trim(), item.Value.Trim());
                }
            }
        }

        int Get(params string[] names)
        {
            foreach (var n in names)
                if (lookup.TryGetValue(n, out var v) && int.TryParse(v, out var i))
                    return i;
            return 0;
        }

        // Try multiple plausible API field names for each stat
        return (
            sacks: Get("Sacks Total", "Sacks", "Total Sacks", "Defensive Sacks"),
            forcedFumbles: Get("Fumbles Forced Total", "Fumbles Forced", "Forced Fumbles",
                               "Fumble Forced", "FF"),
            fumblesRecovered: Get("Fumbles Recovered Total", "Fumbles Recovered",
                                  "Fumble Recovery Total", "Fumble Recoveries", "FR"),
            interceptions: Get("Interceptions Total", "Interceptions", "Total Interceptions",
                               "INT Total", "INT"),
            defensiveTDs: Get("Defensive Touchdowns", "Defensive TD", "Defense TD",
                               "Touchdowns", "Def TD"),
            specialTeamsTDs: Get("Special Teams Touchdowns", "Special Teams TD", "Return Touchdowns",
                                  "Kick Return Touchdowns", "Punt Return Touchdowns", "ST TD"),
            safeties: Get("Safeties", "Safety"),
            blockedKicks: Get("Blocked Kicks", "Blocked Kick", "Blocked Field Goals",
                               "Blocked Punts", "Blocked FG"),
            yardsAllowed: Get("Yards Allowed", "Total Yards Against", "Opponents Total Yards",
                               "Total Yards Allowed", "Defense Total Yards", "Opp Total Yards")
        );
    }

    // ── DTO mapping ────────────────────────────────────────────────────────────

    private static TeamDefenseDto MapToDto(CachedTeamDefense t)
    {
        List<int> perGamePA;
        try { perGamePA = JsonSerializer.Deserialize<List<int>>(t.PerGamePointsAllowedJson) ?? []; }
        catch { perGamePA = []; }

        var (fpPA, fpSacks, fpInts, fpFumbles, fpTDs, fpSafe, fpBlocked, total) =
            NflDefenseFantasyScoring.Calculate(
                perGamePA,
                t.Sacks,
                t.Interceptions,
                t.FumblesRecovered,
                t.DefensiveTDs,
                t.SpecialTeamsTDs,
                t.Safeties,
                t.BlockedKicks);

        var gp = t.GamesPlayed > 0 ? t.GamesPlayed : 1;

        return new TeamDefenseDto
        {
            TeamId = t.ExternalTeamId,
            TeamName = t.TeamName,
            TeamAbbr = t.TeamAbbr,
            LogoUrl = t.LogoUrl,
            Season = t.Season,
            GamesPlayed = t.GamesPlayed,
            TotalPointsAllowed = t.TotalPointsAllowed,
            AvgPointsAllowed = Math.Round((double)t.TotalPointsAllowed / gp, 1),
            YardsAllowed = t.YardsAllowed,
            Sacks = t.Sacks,
            ForcedFumbles = t.ForcedFumbles,
            FumblesRecovered = t.FumblesRecovered,
            Interceptions = t.Interceptions,
            DefensiveTDs = t.DefensiveTDs,
            SpecialTeamsTDs = t.SpecialTeamsTDs,
            Safeties = t.Safeties,
            BlockedKicks = t.BlockedKicks,
            FpPointsAllowed = Math.Round(fpPA, 1),
            FpSacks = fpSacks,
            FpInterceptions = fpInts,
            FpFumblesRecovered = fpFumbles,
            FpTouchdowns = fpTDs,
            FpSafeties = fpSafe,
            FpBlockedKicks = fpBlocked,
            TotalFantasyPoints = Math.Round(total, 1),
            LastUpdated = t.LastUpdated
        };
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private static string? DeriveAbbr(string? name)
    {
        if (name is null) return null;
        return KnownAbbreviations.TryGetValue(name, out var abbr) ? abbr : null;
    }
}
