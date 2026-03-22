using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SportsStats.API.Data;
using SportsStats.API.Models.DTOs;

namespace SportsStats.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SportsController : ControllerBase
{
    private readonly SportsStatsDbContext _db;

    public SportsController(SportsStatsDbContext db)
    {
        _db = db;
    }

    // GET api/sports
    [HttpGet]
    public async Task<ActionResult<List<SportDto>>> GetAll()
    {
        var sports = await _db.Sports
            .OrderBy(s => s.Name)
            .Select(s => new SportDto
            {
                Id = s.Id,
                Name = s.Name,
                Slug = s.Slug,
                IconUrl = s.IconUrl
            })
            .ToListAsync();

        return Ok(sports);
    }

    // GET api/sports/nfl
    [HttpGet("{slug}")]
    public async Task<ActionResult<SportDto>> GetBySlug(string slug)
    {
        var sport = await _db.Sports
            .Where(s => s.Slug == slug.ToLower())
            .Select(s => new SportDto
            {
                Id = s.Id,
                Name = s.Name,
                Slug = s.Slug,
                IconUrl = s.IconUrl
            })
            .FirstOrDefaultAsync();

        if (sport is null) return NotFound();
        return Ok(sport);
    }
}
