using System.ComponentModel.DataAnnotations;
using SportsLeague.Domain.Enums;

namespace SportsLeague.API.DTOs.Request;

public class PlayerRequestDTO
{
    [Required(ErrorMessage = "El nombre del jugador es obligatorio.")]
    [StringLength(80, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 80 caracteres.")]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "El apellido del jugador es obligatorio.")]
    [StringLength(80, MinimumLength = 2, ErrorMessage = "El apellido debe tener entre 2 y 80 caracteres.")]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "La fecha de nacimiento es obligatoria.")]
    public DateTime BirthDate { get; set; }

    [Range(1, 999, ErrorMessage = "El numero del jugador debe estar entre 1 y 999.")]
    public int Number { get; set; }

    [EnumDataType(typeof(PlayerPosition), ErrorMessage = "La posicion del jugador no es valida.")]
    public PlayerPosition Position { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "TeamId debe ser mayor que cero.")]
    public int TeamId { get; set; }
}
