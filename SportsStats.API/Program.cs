using Microsoft.EntityFrameworkCore;
using SportsStats.API.Data;
using SportsStats.API.Services;
using SportsStats.API.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// EF Core
builder.Services.AddDbContext<SportsStatsDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Named HTTP client for API-Sports (one client handles all sports — base URL is passed per call)
builder.Services.AddHttpClient("ApiSports", client =>
{
    client.DefaultRequestHeaders.Add("x-apisports-key",
        builder.Configuration["ApiSports:ApiKey"]);
    client.Timeout = TimeSpan.FromSeconds(15);
});

// Named HTTP client for ESPN (no auth, 10s timeout)
builder.Services.AddHttpClient("Espn", client =>
{
    client.Timeout = TimeSpan.FromSeconds(10);
});

// Services
builder.Services.AddScoped<IApiSportsService, ApiSportsService>();
builder.Services.AddScoped<IEspnService, EspnService>();
builder.Services.AddScoped<ISeasonStatusService, SeasonStatusService>();
builder.Services.AddScoped<IPlayerService, PlayerService>();
builder.Services.AddScoped<IStatsService, StatsService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS for Vite dev server
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactDev", policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseCors("ReactDev");
}

// Serve React build from wwwroot (index.html + static assets)
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseHttpsRedirection();
app.MapControllers();

// SPA fallback — any non-/api route returns index.html so React Router handles it
app.MapFallbackToFile("index.html");

app.Run();
