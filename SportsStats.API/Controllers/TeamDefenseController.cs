using Microsoft.AspNetCore.Mvc;
using SportsStats.API.Models.DTOs;
using SportsStats.API.Services.Interfaces;

namespace SportsStats.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TeamDefenseController : ControllerBase
{
    private readonly ITeamDefenseService _teamDefense;

    public TeamDefenseController(ITeamDefenseService teamDefense)
    {
        _teamDefense = teamDefense;
    }

    // GET api/teamdefense?season=2024
    [HttpGet]
    public async Task<ActionResult<List<TeamDefenseDto>>> GetDefense([FromQuery] int season = 2024)
    {
        if (season < 2020 || season > DateTime.UtcNow.Year + 1)
            return BadRequest("Season out of supported range.");

        var results = await _teamDefense.GetSeasonDefenseAsync(season);
        return Ok(results);
    }
}
