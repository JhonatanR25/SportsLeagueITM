using SportsLeague.Domain.Entities;
using SportsLeague.Domain.Enums;

namespace SportsLeague.Domain.Interfaces.Services;

public interface IMatchService
{
    Task<IEnumerable<Match>> GetAllAsync();
    Task<IEnumerable<Match>> GetFilteredAsync(int? tournamentId, MatchStatus? status, DateTime? fromDate, DateTime? toDate);
    Task<Match?> GetByIdAsync(int id);
    Task<Match> CreateAsync(Match match);
    Task UpdateStatusAsync(int id, MatchStatus newStatus);
    Task UpdateScoreAsync(int id, int homeScore, int awayScore, bool isFinalScore = false);
}
