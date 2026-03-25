using SportsLeague.Domain.Entities;
using SportsLeague.Domain.Enums;

namespace SportsLeague.Domain.Interfaces.Repositories;

public interface IMatchRepository : IGenericRepository<Match>
{
    Task<Match?> GetByIdWithDetailsAsync(int id);
    Task<Match?> GetByIdentityAsync(int tournamentId, int homeTeamId, int awayTeamId, DateTime matchDate);
    Task<IEnumerable<Match>> GetAllWithDetailsAsync();
    Task<IEnumerable<Match>> GetFilteredAsync(int? tournamentId, MatchStatus? status, DateTime? fromDate, DateTime? toDate);
    Task<IEnumerable<Match>> GetByTournamentAsync(int tournamentId);
    Task<IEnumerable<Match>> GetByStatusAsync(MatchStatus status);
    Task<IEnumerable<Match>> GetByDateRangeAsync(DateTime fromDate, DateTime toDate);
}
