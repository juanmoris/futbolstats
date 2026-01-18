using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FutbolStats.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTiebreakerTypeToChampionship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TiebreakerType",
                table: "Championships",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TiebreakerType",
                table: "Championships");
        }
    }
}
