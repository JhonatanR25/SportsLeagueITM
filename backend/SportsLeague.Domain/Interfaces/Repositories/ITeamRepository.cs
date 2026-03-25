using SportsLeague.Domain.Entities;

namespace SportsLeague.Domain.Interfaces.Repositories;

public interface ITeamRepository : IGenericRepository<Team>
{
    Task<Team?> GetByNameAsync(string name);
    Task<bool> HasPlayersAsync(int teamId);
    Task<bool> HasTournamentRegistrationsAsync(int teamId);
    Task<bool> HasMatchesAsync(int teamId);
    Task<IEnumerable<Team>> GetByCityAsync(string city);
}
