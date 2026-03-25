using System.ComponentModel.DataAnnotations;

namespace SportsLeague.API.DTOs.Request;

public class TeamRequestDTO
{
    [Required(ErrorMessage = "El nombre del equipo es obligatorio.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 100 caracteres.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "La ciudad es obligatoria.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "La ciudad debe tener entre 2 y 100 caracteres.")]
    public string City { get; set; } = string.Empty;

    [Required(ErrorMessage = "El estadio es obligatorio.")]
    [StringLength(150, MinimumLength = 2, ErrorMessage = "El estadio debe tener entre 2 y 150 caracteres.")]
    public string Stadium { get; set; } = string.Empty;

    [Url(ErrorMessage = "LogoUrl debe ser una URL valida.")]
    [StringLength(500, ErrorMessage = "LogoUrl no puede superar 500 caracteres.")]
    public string? LogoUrl { get; set; }

    [Required(ErrorMessage = "La fecha de fundacion es obligatoria.")]
    public DateTime FoundedDate { get; set; }
}
