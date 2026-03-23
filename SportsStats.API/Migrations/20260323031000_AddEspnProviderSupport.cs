using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SportsStats.API.Migrations
{
    /// <inheritdoc />
    public partial class AddEspnProviderSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add ESPN config columns to Sports table
            migrationBuilder.AddColumn<string>(
                name: "EspnSport",
                table: "Sports",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EspnLeague",
                table: "Sports",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            // Add dual provider ID columns to CachedPlayers table
            migrationBuilder.AddColumn<string>(
                name: "EspnPlayerId",
                table: "CachedPlayers",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ApiSportsPlayerId",
                table: "CachedPlayers",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            // Index on (SportId, EspnPlayerId) for lookups
            migrationBuilder.CreateIndex(
                name: "IX_CachedPlayers_SportId_EspnPlayerId",
                table: "CachedPlayers",
                columns: new[] { "SportId", "EspnPlayerId" });

            // Data migration: set ApiSportsPlayerId = ExternalPlayerId for all existing players
            migrationBuilder.Sql("UPDATE CachedPlayers SET ApiSportsPlayerId = ExternalPlayerId");

            // Update seed data: set ESPN mappings for each sport
            migrationBuilder.UpdateData(
                table: "Sports",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "EspnSport", "EspnLeague" },
                values: new object[] { "football", "nfl" });

            migrationBuilder.UpdateData(
                table: "Sports",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "EspnSport", "EspnLeague" },
                values: new object[] { "basketball", "nba" });

            migrationBuilder.UpdateData(
                table: "Sports",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "EspnSport", "EspnLeague" },
                values: new object[] { "baseball", "mlb" });

            migrationBuilder.UpdateData(
                table: "Sports",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "EspnSport", "EspnLeague" },
                values: new object[] { "hockey", "nhl" });

            migrationBuilder.UpdateData(
                table: "Sports",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "EspnSport", "EspnLeague" },
                values: new object[] { "soccer", "usa.1" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CachedPlayers_SportId_EspnPlayerId",
                table: "CachedPlayers");

            migrationBuilder.DropColumn(name: "EspnPlayerId", table: "CachedPlayers");
            migrationBuilder.DropColumn(name: "ApiSportsPlayerId", table: "CachedPlayers");

            migrationBuilder.DropColumn(name: "EspnSport", table: "Sports");
            migrationBuilder.DropColumn(name: "EspnLeague", table: "Sports");
        }
    }
}
