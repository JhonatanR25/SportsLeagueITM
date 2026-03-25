using System.ComponentModel.DataAnnotations;

namespace SportsLeague.API.DTOs.Request;

public class RegisterTeamDTO
{
    [Range(1, int.MaxValue, ErrorMessage = "TeamId debe ser mayor que cero.")]
    public int TeamId { get; set; }
}
