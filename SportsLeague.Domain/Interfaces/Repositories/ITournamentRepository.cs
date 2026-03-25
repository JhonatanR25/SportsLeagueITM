using SportsLeague.Domain.Entities;

namespace SportsLeague.Domain.Interfaces.Repositories;

public interface ITournamentRepository : IGenericRepository<Tournament>
{
    // Este método es indispensable para que el Service no de error
    Task<Tournament?> GetByIdWithTeamsAsync(int id);
}
