using System.ComponentModel.DataAnnotations;
using SportsLeague.Domain.Enums;

namespace SportsLeague.API.DTOs.Request;

public class MatchUpdateStatusDTO
{
    [EnumDataType(typeof(MatchStatus), ErrorMessage = "El estado del partido no es valido.")]
    public MatchStatus Status { get; set; }
}
