using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SportsLeague.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueConstraintsForCoreEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Teams_Name",
                table: "Teams");

            migrationBuilder.CreateIndex(
                name: "IX_Tournaments_Name_Season",
                table: "Tournaments",
                columns: new[] { "Name", "Season" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Teams_Name",
                table: "Teams",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Referees_FirstName_LastName_Nationality",
                table: "Referees",
                columns: new[] { "FirstName", "LastName", "Nationality" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Players_TeamId_FirstName_LastName_BirthDate",
                table: "Players",
                columns: new[] { "TeamId", "FirstName", "LastName", "BirthDate" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Players_TeamId_Number",
                table: "Players",
                columns: new[] { "TeamId", "Number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Matches_TournamentId_HomeTeamId_AwayTeamId_MatchDate",
                table: "Matches",
                columns: new[] { "TournamentId", "HomeTeamId", "AwayTeamId", "MatchDate" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tournaments_Name_Season",
                table: "Tournaments");

            migrationBuilder.DropIndex(
                name: "IX_Teams_Name",
                table: "Teams");

            migrationBuilder.DropIndex(
                name: "IX_Referees_FirstName_LastName_Nationality",
                table: "Referees");

            migrationBuilder.DropIndex(
                name: "IX_Players_TeamId_FirstName_LastName_BirthDate",
                table: "Players");

            migrationBuilder.DropIndex(
                name: "IX_Players_TeamId_Number",
                table: "Players");

            migrationBuilder.DropIndex(
                name: "IX_Matches_TournamentId_HomeTeamId_AwayTeamId_MatchDate",
                table: "Matches");

            migrationBuilder.CreateIndex(
                name: "IX_Teams_Name",
                table: "Teams",
                column: "Name");
        }
    }
}
