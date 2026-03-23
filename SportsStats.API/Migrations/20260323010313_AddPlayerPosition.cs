using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SportsStats.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPlayerPosition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Position",
                table: "CachedPlayers",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Position",
                table: "CachedPlayers");
        }
    }
}
