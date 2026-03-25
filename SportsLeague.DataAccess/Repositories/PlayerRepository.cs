using Microsoft.EntityFrameworkCore;
using SportsLeague.DataAccess.Context;
using SportsLeague.Domain.Entities;
using SportsLeague.Domain.Interfaces.Repositories;

namespace SportsLeague.DataAccess.Repositories;

public class PlayerRepository : GenericRepository<Player>, IPlayerRepository
{
    public PlayerRepository(LeagueDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Player>> GetByTeamAsync(int teamId)
    {
        return await _dbSet
            .Where(p => p.TeamId == teamId)
            .Include(p => p.Team)
            .AsNoTracking()
            .OrderBy(p => p.Number)
            .ThenBy(p => p.LastName)
            .ThenBy(p => p.FirstName)
            .ToListAsync();
    }

    public async Task<Player?> GetByTeamAndNumberAsync(int teamId, int number)
    {
        return await _dbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.TeamId == teamId && p.Number == number);
    }

    public async Task<IEnumerable<Player>> GetAllWithTeamAsync()
    {
        return await _dbSet
            .Include(p => p.Team)
            .AsNoTracking()
            .OrderBy(p => p.TeamId)
            .ThenBy(p => p.Number)
            .ThenBy(p => p.LastName)
            .ToListAsync();
    }

    public async Task<Player?> GetByIdWithTeamAsync(int id)
    {
        return await _dbSet
            .Include(p => p.Team)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public override async Task<Player> CreateAsync(Player entity)
    {
        await _dbSet.AddAsync(entity);
        await _context.SaveChangesAsync();
        return entity;
    }
}
