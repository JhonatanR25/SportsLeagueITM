using SportsLeague.Domain.Entities;
using SportsLeague.Domain.Enums;

namespace SportsLeague.Domain.Interfaces.Repositories;

public interface ITournamentRepository : IGenericRepository<Tournament>
{
    Task<IEnumerable<Tournament>> GetAllWithTeamsAsync();
    Task<Tournament?> GetByNameAndSeasonAsync(string name, string season);
    Task<bool> HasRegisteredTeamsAsync(int tournamentId);
    Task<bool> HasMatchesAsync(int tournamentId);
    Task<IEnumerable<Tournament>> GetByStatusAsync(TournamentStatus status);
    Task<Tournament?> GetByIdWithTeamsAsync(int id);
}
