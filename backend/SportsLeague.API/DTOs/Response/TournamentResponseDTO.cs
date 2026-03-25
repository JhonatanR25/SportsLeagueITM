using SportsLeague.Domain.Enums;

namespace SportsLeague.API.DTOs.Response;

public class TournamentResponseDTO
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Season { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public TournamentStatus Status { get; set; } // VOLVEMOS A ENUM
    public int TeamsCount { get; set; }
    public DateTime CreatedAt { get; set; }
}