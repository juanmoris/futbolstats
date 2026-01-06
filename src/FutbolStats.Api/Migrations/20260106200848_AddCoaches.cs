using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FutbolStats.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCoaches : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AwayCoachId",
                table: "Matches",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "HomeCoachId",
                table: "Matches",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Coaches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FirstName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LastName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Nationality = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    PhotoUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    BirthDate = table.Column<DateOnly>(type: "date", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Coaches", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CoachTeamAssignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CoachId = table.Column<Guid>(type: "uuid", nullable: false),
                    TeamId = table.Column<Guid>(type: "uuid", nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CoachTeamAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CoachTeamAssignments_Coaches_CoachId",
                        column: x => x.CoachId,
                        principalTable: "Coaches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CoachTeamAssignments_Teams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "Teams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Matches_AwayCoachId",
                table: "Matches",
                column: "AwayCoachId");

            migrationBuilder.CreateIndex(
                name: "IX_Matches_HomeCoachId",
                table: "Matches",
                column: "HomeCoachId");

            migrationBuilder.CreateIndex(
                name: "IX_CoachTeamAssignments_CoachId",
                table: "CoachTeamAssignments",
                column: "CoachId");

            migrationBuilder.CreateIndex(
                name: "IX_CoachTeamAssignments_TeamId",
                table: "CoachTeamAssignments",
                column: "TeamId");

            migrationBuilder.CreateIndex(
                name: "IX_CoachTeamAssignments_TeamId_EndDate",
                table: "CoachTeamAssignments",
                columns: new[] { "TeamId", "EndDate" });

            migrationBuilder.AddForeignKey(
                name: "FK_Matches_Coaches_AwayCoachId",
                table: "Matches",
                column: "AwayCoachId",
                principalTable: "Coaches",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Matches_Coaches_HomeCoachId",
                table: "Matches",
                column: "HomeCoachId",
                principalTable: "Coaches",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Matches_Coaches_AwayCoachId",
                table: "Matches");

            migrationBuilder.DropForeignKey(
                name: "FK_Matches_Coaches_HomeCoachId",
                table: "Matches");

            migrationBuilder.DropTable(
                name: "CoachTeamAssignments");

            migrationBuilder.DropTable(
                name: "Coaches");

            migrationBuilder.DropIndex(
                name: "IX_Matches_AwayCoachId",
                table: "Matches");

            migrationBuilder.DropIndex(
                name: "IX_Matches_HomeCoachId",
                table: "Matches");

            migrationBuilder.DropColumn(
                name: "AwayCoachId",
                table: "Matches");

            migrationBuilder.DropColumn(
                name: "HomeCoachId",
                table: "Matches");
        }
    }
}
