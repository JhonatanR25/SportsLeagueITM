using System.ComponentModel.DataAnnotations;

namespace SportsLeague.API.DTOs.Request;

public class TournamentSponsorRequestDTO
{
    [Range(1, int.MaxValue, ErrorMessage = "TournamentId debe ser mayor que cero.")]
    public int TournamentId { get; set; }

    [Range(typeof(decimal), "0.01", "79228162514264337593543950335", ErrorMessage = "ContractAmount debe ser mayor que cero.")]
    public decimal ContractAmount { get; set; }
}
