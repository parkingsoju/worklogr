using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Worklogr.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUserAccentColor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AccentColor",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "teal");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AccentColor",
                table: "Users");
        }
    }
}
