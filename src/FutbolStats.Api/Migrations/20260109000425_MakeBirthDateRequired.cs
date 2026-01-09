using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FutbolStats.Api.Migrations
{
    /// <inheritdoc />
    public partial class MakeBirthDateRequired : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Primero actualizar registros NULL con una fecha por defecto
            migrationBuilder.Sql(
                "UPDATE \"Players\" SET \"BirthDate\" = '1990-01-01' WHERE \"BirthDate\" IS NULL");

            // Luego cambiar la columna a NOT NULL
            migrationBuilder.AlterColumn<DateOnly>(
                name: "BirthDate",
                table: "Players",
                type: "date",
                nullable: false,
                oldClrType: typeof(DateOnly),
                oldType: "date",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateOnly>(
                name: "BirthDate",
                table: "Players",
                type: "date",
                nullable: true,
                oldClrType: typeof(DateOnly),
                oldType: "date");
        }
    }
}
