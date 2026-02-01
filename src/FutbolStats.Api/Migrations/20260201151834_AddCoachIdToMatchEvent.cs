using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FutbolStats.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCoachIdToMatchEvent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "PlayerId",
                table: "MatchEvents",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<Guid>(
                name: "CoachId",
                table: "MatchEvents",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MatchEvents_CoachId",
                table: "MatchEvents",
                column: "CoachId");

            migrationBuilder.AddForeignKey(
                name: "FK_MatchEvents_Coaches_CoachId",
                table: "MatchEvents",
                column: "CoachId",
                principalTable: "Coaches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MatchEvents_Coaches_CoachId",
                table: "MatchEvents");

            migrationBuilder.DropIndex(
                name: "IX_MatchEvents_CoachId",
                table: "MatchEvents");

            migrationBuilder.DropColumn(
                name: "CoachId",
                table: "MatchEvents");

            migrationBuilder.AlterColumn<Guid>(
                name: "PlayerId",
                table: "MatchEvents",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);
        }
    }
}
