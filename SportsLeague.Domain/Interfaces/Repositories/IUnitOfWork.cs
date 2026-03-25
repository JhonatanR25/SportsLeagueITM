using SportsLeague.Domain.Interfaces.Repositories;

namespace SportsLeague.Domain.Interfaces.Repositories;

public interface IUnitOfWork : IDisposable
{
    // Exponemos los repositorios específicos
    ITeamRepository Teams { get; }
    IPlayerRepository Players { get; }
    IRefereeRepository Referees { get; }
    ITournamentRepository Tournaments { get; }

    // Método centralizado para guardar cambios en la BD
    Task<int> SaveChangesAsync();
}