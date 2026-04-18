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
            // Position already added by AddPlayerPosition migration.
            // Only add Team here.
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
                name: "Team",
                table: "CachedPlayers");
        }
    }
}
