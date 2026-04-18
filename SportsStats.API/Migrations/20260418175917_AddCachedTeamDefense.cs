using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SportsStats.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCachedTeamDefense : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CachedTeamDefenses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ExternalTeamId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TeamName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    TeamAbbr = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    LogoUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Season = table.Column<int>(type: "int", nullable: false),
                    GamesPlayed = table.Column<int>(type: "int", nullable: false),
                    TotalPointsAllowed = table.Column<int>(type: "int", nullable: false),
                    YardsAllowed = table.Column<int>(type: "int", nullable: false),
                    Sacks = table.Column<int>(type: "int", nullable: false),
                    ForcedFumbles = table.Column<int>(type: "int", nullable: false),
                    FumblesRecovered = table.Column<int>(type: "int", nullable: false),
                    Interceptions = table.Column<int>(type: "int", nullable: false),
                    DefensiveTDs = table.Column<int>(type: "int", nullable: false),
                    SpecialTeamsTDs = table.Column<int>(type: "int", nullable: false),
                    Safeties = table.Column<int>(type: "int", nullable: false),
                    BlockedKicks = table.Column<int>(type: "int", nullable: false),
                    PerGamePointsAllowedJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CachedTeamDefenses", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CachedTeamDefenses_ExternalTeamId_Season",
                table: "CachedTeamDefenses",
                columns: new[] { "ExternalTeamId", "Season" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CachedTeamDefenses");
        }
    }
}
