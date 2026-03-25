using System.ComponentModel.DataAnnotations;
using SportsLeague.Domain.Enums;

namespace SportsLeague.API.DTOs.Request;

public class UpdateStatusDTO
{
    [EnumDataType(typeof(TournamentStatus), ErrorMessage = "El estado del torneo no es valido.")]
    public TournamentStatus Status { get; set; }
}
