using System.ComponentModel.DataAnnotations;

namespace SportsLeague.API.DTOs.Request;

public class TournamentSponsorRequestDTO
{
    [Range(1, int.MaxValue, ErrorMessage = "TournamentId debe ser mayor que cero.")]
    public int TournamentId { get; set; }

    public decimal ContractAmount { get; set; }
}
