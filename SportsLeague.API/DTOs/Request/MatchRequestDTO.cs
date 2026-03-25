using System.ComponentModel.DataAnnotations;

namespace SportsLeague.API.DTOs.Request;

public class MatchRequestDTO
{
    [Required(ErrorMessage = "La fecha del partido es obligatoria.")]
    public DateTime MatchDate { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "HomeTeamId debe ser mayor que cero.")]
    public int HomeTeamId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "AwayTeamId debe ser mayor que cero.")]
    public int AwayTeamId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "RefereeId debe ser mayor que cero.")]
    public int RefereeId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "TournamentId debe ser mayor que cero.")]
    public int TournamentId { get; set; }
}
