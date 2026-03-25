using Microsoft.EntityFrameworkCore;
using SportsLeague.DataAccess.Context;
using SportsLeague.Domain.Entities;
using SportsLeague.Domain.Interfaces.Repositories;

namespace SportsLeague.DataAccess.Repositories;

public class TeamRepository : GenericRepository<Team>, ITeamRepository
{
    public TeamRepository(LeagueDbContext context) : base(context)
    {
    }

    // Mejora de rendimiento: Carga de jugadores relacionada
    public override async Task<IEnumerable<Team>> GetAllAsync()
    {
        return await _dbSet
            .Include(t => t.Players)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<Team?> GetByNameAsync(string name)
    {
        return await _dbSet
            .FirstOrDefaultAsync(t => t.Name.ToLower() == name.ToLower().Trim());
    }

    // Corrección del error CS0535: Implementación requerida por la interfaz
    public async Task<IEnumerable<Team>> GetByCityAsync(string city)
    {
        return await _dbSet
            .Where(t => t.City.ToLower() == city.ToLower().Trim())
            .ToListAsync();
    }
}