using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FutbolStats.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCoachCountryRelation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Nationality",
                table: "Coaches");

            migrationBuilder.AddColumn<Guid>(
                name: "CountryId",
                table: "Coaches",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Coaches_CountryId",
                table: "Coaches",
                column: "CountryId");

            migrationBuilder.AddForeignKey(
                name: "FK_Coaches_Countries_CountryId",
                table: "Coaches",
                column: "CountryId",
                principalTable: "Countries",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Coaches_Countries_CountryId",
                table: "Coaches");

            migrationBuilder.DropIndex(
                name: "IX_Coaches_CountryId",
                table: "Coaches");

            migrationBuilder.DropColumn(
                name: "CountryId",
                table: "Coaches");

            migrationBuilder.AddColumn<string>(
                name: "Nationality",
                table: "Coaches",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }
    }
}
