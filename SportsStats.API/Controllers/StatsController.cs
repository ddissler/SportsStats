using Microsoft.AspNetCore.Mvc;
using SportsStats.API.Models.DTOs;
using SportsStats.API.Services.Interfaces;

namespace SportsStats.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatsController : ControllerBase
{
    private readonly IStatsService _statsService;

    public StatsController(IStatsService statsService)
    {
        _statsService = statsService;
    }

    // GET api/stats/seasonal?sportId=1&playerId=abc&season=2024
    [HttpGet("seasonal")]
    public async Task<ActionResult<StatsResponseDto>> GetSeasonal(
        [FromQuery] int sportId,
        [FromQuery] string playerId,
        [FromQuery] int season)
    {
        var result = await _statsService.GetSeasonalStatsAsync(sportId, playerId, season);
        if (result is null) return NotFound();
        return Ok(result);
    }

    // GET api/stats/games?sportId=1&playerId=abc&season=2024
    [HttpGet("games")]
    public async Task<ActionResult<List<GameDto>>> GetGames(
        [FromQuery] int sportId,
        [FromQuery] string playerId,
        [FromQuery] int season)
    {
        var results = await _statsService.GetGamesAsync(sportId, playerId, season);
        return Ok(results);
    }

    // GET api/stats/game?sportId=1&playerId=abc&gameId=12345
    [HttpGet("game")]
    public async Task<ActionResult<StatsResponseDto>> GetGameStats(
        [FromQuery] int sportId,
        [FromQuery] string playerId,
        [FromQuery] int gameId)
    {
        var result = await _statsService.GetGameStatsAsync(sportId, playerId, gameId);
        if (result is null) return NotFound();
        return Ok(result);
    }
}
