using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SportsStats.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Sports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IconUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ApiSportsLeagueId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ApiSportsBaseUrl = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Sports", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CachedPlayers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SportId = table.Column<int>(type: "int", nullable: false),
                    ExternalPlayerId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    PhotoUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CachedPlayers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CachedPlayers_Sports_SportId",
                        column: x => x.SportId,
                        principalTable: "Sports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CachedStats",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CachedPlayerId = table.Column<int>(type: "int", nullable: false),
                    StatType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Season = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    DataJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CachedStats", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CachedStats_CachedPlayers_CachedPlayerId",
                        column: x => x.CachedPlayerId,
                        principalTable: "CachedPlayers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Sports",
                columns: new[] { "Id", "ApiSportsBaseUrl", "ApiSportsLeagueId", "IconUrl", "Name", "Slug" },
                values: new object[,]
                {
                    { 1, "https://v1.american-football.api-sports.io", "1", null, "NFL", "nfl" },
                    { 2, "https://v1.basketball.api-sports.io", "12", null, "NBA", "nba" },
                    { 3, "https://v1.baseball.api-sports.io", "1", null, "MLB", "mlb" },
                    { 4, "https://v1.hockey.api-sports.io", "57", null, "NHL", "nhl" },
                    { 5, "https://v3.football.api-sports.io", "253", null, "MLS", "mls" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_CachedPlayers_SportId_ExternalPlayerId",
                table: "CachedPlayers",
                columns: new[] { "SportId", "ExternalPlayerId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CachedStats_CachedPlayerId",
                table: "CachedStats",
                column: "CachedPlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_Sports_Slug",
                table: "Sports",
                column: "Slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CachedStats");

            migrationBuilder.DropTable(
                name: "CachedPlayers");

            migrationBuilder.DropTable(
                name: "Sports");
        }
    }
}
