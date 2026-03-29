using System.ComponentModel.DataAnnotations;
using SportsLeague.Domain.Enums;

namespace SportsLeague.API.DTOs.Request;

public class SponsorRequestDTO
{
    [Required(ErrorMessage = "El nombre del sponsor es obligatorio.")]
    [StringLength(150, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 150 caracteres.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "El email de contacto es obligatorio.")]
    [EmailAddress(ErrorMessage = "El email de contacto debe tener un formato valido.")]
    [StringLength(150, ErrorMessage = "El email de contacto no puede superar los 150 caracteres.")]
    public string ContactEmail { get; set; } = string.Empty;

    [StringLength(30, ErrorMessage = "El telefono no puede superar los 30 caracteres.")]
    public string? Phone { get; set; }

    [Url(ErrorMessage = "El sitio web debe tener un formato valido.")]
    [StringLength(500, ErrorMessage = "El sitio web no puede superar los 500 caracteres.")]
    public string? WebsiteUrl { get; set; }

    [EnumDataType(typeof(SponsorCategory), ErrorMessage = "La categoria del sponsor no es valida.")]
    public SponsorCategory Category { get; set; }
}
