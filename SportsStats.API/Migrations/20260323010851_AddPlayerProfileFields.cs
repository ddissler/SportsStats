using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SportsStats.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPlayerProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Age",
                table: "CachedPlayers",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "College",
                table: "CachedPlayers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Experience",
                table: "CachedPlayers",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Height",
                table: "CachedPlayers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Number",
                table: "CachedPlayers",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Weight",
                table: "CachedPlayers",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Age",
                table: "CachedPlayers");

            migrationBuilder.DropColumn(
                name: "College",
                table: "CachedPlayers");

            migrationBuilder.DropColumn(
                name: "Experience",
                table: "CachedPlayers");

            migrationBuilder.DropColumn(
                name: "Height",
                table: "CachedPlayers");

            migrationBuilder.DropColumn(
                name: "Number",
                table: "CachedPlayers");

            migrationBuilder.DropColumn(
                name: "Weight",
                table: "CachedPlayers");
        }
    }
}
