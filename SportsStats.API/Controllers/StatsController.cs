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

    // GET api/stats/career?sportId=1&playerId=abc
    [HttpGet("career")]
    public async Task<ActionResult<List<StatsResponseDto>>> GetCareer(
        [FromQuery] int sportId,
        [FromQuery] string playerId)
    {
        var results = await _statsService.GetCareerStatsAsync(sportId, playerId);
        return Ok(results);
    }

    // GET api/stats/gamelogs?sportId=1&playerId=abc&season=2024
    [HttpGet("gamelogs")]
    public async Task<ActionResult<StatsResponseDto>> GetGameLogs(
        [FromQuery] int sportId,
        [FromQuery] string playerId,
        [FromQuery] int season)
    {
        var result = await _statsService.GetGameLogsAsync(sportId, playerId, season);
        if (result is null) return NotFound();
        return Ok(result);
    }
}
