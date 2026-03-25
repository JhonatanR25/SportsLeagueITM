using System.ComponentModel.DataAnnotations;

namespace SportsLeague.API.DTOs.Request;

public class RefereeRequestDTO
{
    [Required(ErrorMessage = "El nombre del arbitro es obligatorio.")]
    [StringLength(80, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 80 caracteres.")]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "El apellido del arbitro es obligatorio.")]
    [StringLength(80, MinimumLength = 2, ErrorMessage = "El apellido debe tener entre 2 y 80 caracteres.")]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "La nacionalidad es obligatoria.")]
    [StringLength(80, MinimumLength = 2, ErrorMessage = "La nacionalidad debe tener entre 2 y 80 caracteres.")]
    public string Nationality { get; set; } = string.Empty;
}
