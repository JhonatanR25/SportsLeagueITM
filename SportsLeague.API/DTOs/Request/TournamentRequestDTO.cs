using System.ComponentModel.DataAnnotations;

namespace SportsLeague.API.DTOs.Request;

public class TournamentRequestDTO
{
    [Required(ErrorMessage = "El nombre del torneo es obligatorio.")]
    [StringLength(150, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 150 caracteres.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "La temporada es obligatoria.")]
    [StringLength(20, MinimumLength = 2, ErrorMessage = "La temporada debe tener entre 2 y 20 caracteres.")]
    public string Season { get; set; } = string.Empty;

    [Required(ErrorMessage = "La fecha de inicio es obligatoria.")]
    public DateTime StartDate { get; set; }

    [Required(ErrorMessage = "La fecha de finalizacion es obligatoria.")]
    public DateTime EndDate { get; set; }
}
