using SportsLeague.Domain.Entities;

namespace SportsLeague.Domain.Interfaces.Repositories;

public interface IPlayerRepository : IGenericRepository<Player>
{
    Task<IEnumerable<Player>> GetByTeamAsync(int teamId);
    Task<Player?> GetByTeamAndNumberAsync(int teamId, int number);
    Task<Player?> GetByIdentityAsync(int teamId, string firstName, string lastName, DateTime birthDate);
    Task<IEnumerable<Player>> GetAllWithTeamAsync();
    Task<Player?> GetByIdWithTeamAsync(int id);
}

