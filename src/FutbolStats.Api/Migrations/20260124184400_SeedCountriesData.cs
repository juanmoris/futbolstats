using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FutbolStats.Api.Migrations
{
    /// <inheritdoc />
    public partial class SeedCountriesData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Countries",
                columns: new[] { "Id", "Code", "CreatedAt", "FlagUrl", "Name", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("00000000-0000-0000-0001-000000000001"), "AR", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Argentina", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000002"), "BO", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Bolivia", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000003"), "BR", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Brasil", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000004"), "CL", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Chile", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000005"), "CO", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Colombia", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000006"), "EC", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Ecuador", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000007"), "PY", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Paraguay", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000008"), "PE", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Peru", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000009"), "UY", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Uruguay", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000010"), "VE", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Venezuela", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000011"), "MX", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Mexico", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000012"), "US", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Estados Unidos", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000013"), "CR", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Costa Rica", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000014"), "PA", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Panama", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000015"), "HN", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Honduras", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000016"), "ES", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Espana", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000017"), "DE", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Alemania", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000018"), "FR", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Francia", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000019"), "IT", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Italia", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000020"), "GB", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Inglaterra", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000021"), "PT", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Portugal", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000022"), "NL", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Paises Bajos", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000023"), "BE", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Belgica", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000024"), "HR", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Croacia", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000025"), "RS", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Serbia", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000026"), "PL", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Polonia", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000027"), "CH", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Suiza", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000028"), "AT", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Austria", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000029"), "NG", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Nigeria", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000030"), "SN", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Senegal", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000031"), "MA", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Marruecos", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000032"), "GH", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Ghana", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000033"), "CM", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Camerun", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000034"), "JP", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Japon", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000035"), "KR", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Corea del Sur", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0001-000000000036"), "AU", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Australia", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000001"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000002"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000003"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000004"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000005"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000006"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000007"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000008"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000009"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000010"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000011"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000012"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000013"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000014"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000015"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000016"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000017"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000018"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000019"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000020"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000021"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000022"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000023"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000024"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000025"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000026"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000027"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000028"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000029"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000030"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000031"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000032"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000033"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000034"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000035"));

            migrationBuilder.DeleteData(
                table: "Countries",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0001-000000000036"));
        }
    }
}
