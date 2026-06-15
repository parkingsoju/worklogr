using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Worklogr.Api.Migrations
{
    /// <inheritdoc />
    public partial class DefaultTimezoneToManila : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Timezone",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "Asia/Manila",
                oldClrType: typeof(string),
                oldType: "text",
                oldDefaultValue: "UTC");

            // Backfill existing users still on the old UTC default so display flips to PH time.
            migrationBuilder.Sql("UPDATE \"Users\" SET \"Timezone\" = 'Asia/Manila' WHERE \"Timezone\" = 'UTC';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Timezone",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "UTC",
                oldClrType: typeof(string),
                oldType: "text",
                oldDefaultValue: "Asia/Manila");
        }
    }
}
