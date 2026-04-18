using Microsoft.AspNetCore.Mvc;
using SportsStats.API.Models.DTOs;
using SportsStats.API.Services.Interfaces;

namespace SportsStats.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlayersController : ControllerBase
{
    private readonly IPlayerService _playerService;

    public PlayersController(IPlayerService playerService)
    {
        _playerService = playerService;
    }

    // GET api/players/search?sportId=1&name=mahomes&isActive=true&page=1&pageSize=10
    [HttpGet("search")]
    public async Task<ActionResult<PaginatedResult<PlayerDto>>> Search(
        [FromQuery] int sportId,
        [FromQuery] string name,
        [FromQuery] bool? isActive = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Length < 2)
            return BadRequest("Search term must be at least 2 characters.");

        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 50) pageSize = 10;

        try
        {
            var results = await _playerService.SearchPlayersAsync(sportId, name, isActive, page, pageSize);
            return Ok(results);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    // GET api/players/1/abc123
    [HttpGet("{sportId}/{playerId}")]
    public async Task<ActionResult<PlayerDto>> GetPlayer(int sportId, string playerId)
    {
        var player = await _playerService.GetPlayerByIdAsync(sportId, playerId);
        if (player is null) return NotFound();
        return Ok(player);
    }

    // GET api/players/list?sportId=1&season=2024&position=QB
    [HttpGet("list")]
    public async Task<ActionResult<List<PlayerWithStatsDto>>> ListPlayers(
        [FromQuery] int sportId,
        [FromQuery] int season = 2024,
        [FromQuery] string? position = null)
    {
        if (sportId <= 0) return BadRequest("sportId is required.");
        var results = await _playerService.ListPlayersWithStatsAsync(sportId, season, position);
        return Ok(results);
    }
}
