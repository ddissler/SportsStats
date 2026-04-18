using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SportsStats.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPositionTeamToCachedPlayer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Position",
                table: "CachedPlayers",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Team",
                table: "CachedPlayers",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Position",
                table: "CachedPlayers");

            migrationBuilder.DropColumn(
                name: "Team",
                table: "CachedPlayers");
        }
    }
}
