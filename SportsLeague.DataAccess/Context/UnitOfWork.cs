using SportsLeague.DataAccess.Context;
using SportsLeague.Domain.Interfaces.Repositories;

namespace SportsLeague.DataAccess.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly LeagueDbContext _context;

    // Propiedades de solo lectura para los repositorios
    public ITeamRepository Teams { get; }
    public IPlayerRepository Players { get; }
    public IRefereeRepository Referees { get; }
    public ITournamentRepository Tournaments { get; }

    public UnitOfWork(
        LeagueDbContext context,
        ITeamRepository teamRepository,
        IPlayerRepository playerRepository,
        IRefereeRepository refereeRepository,
        ITournamentRepository tournamentRepository)
    {
        _context = context;
        Teams = teamRepository;
        Players = playerRepository;
        Referees = refereeRepository;
        Tournaments = tournamentRepository;
    }

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}