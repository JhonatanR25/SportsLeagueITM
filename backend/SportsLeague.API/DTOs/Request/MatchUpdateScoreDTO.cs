using System.ComponentModel.DataAnnotations;

namespace SportsLeague.API.DTOs.Request;

public class MatchUpdateScoreDTO
{
    [Range(0, int.MaxValue, ErrorMessage = "HomeScore no puede ser negativo.")]
    public int HomeScore { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "AwayScore no puede ser negativo.")]
    public int AwayScore { get; set; }

    public bool IsFinalScore { get; set; }
}
