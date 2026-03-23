using Microsoft.AspNetCore.Mvc;
using SportsStats.API.Services.Interfaces;
using System.Text.Json;

namespace SportsStats.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly IApiSportsService _apiSports;
    private readonly IConfiguration _config;

    public AdminController(IApiSportsService apiSports, IConfiguration config)
    {
        _apiSports = apiSports;
        _config = config;
    }

    // GET api/admin/api-status
    [HttpGet("api-status")]
    public async Task<ActionResult> GetApiStatus()
    {
        // The /status endpoint is the same across all API-Sports base URLs
        var result = await _apiSports.GetAsync<JsonElement>(
            "https://v1.american-football.api-sports.io",
            "/status");

        if (result is JsonElement elem && elem.ValueKind != JsonValueKind.Undefined)
        {
            return Ok(elem);
        }

        return StatusCode(503, new { error = "Unable to reach API-Sports" });
    }
}
