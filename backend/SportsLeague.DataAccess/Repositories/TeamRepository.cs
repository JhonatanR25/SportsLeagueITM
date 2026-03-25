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

    public override async Task<IEnumerable<Team>> GetAllAsync()
    {
        return await _dbSet
            .Include(t => t.Players)
            .AsNoTracking()
            .OrderBy(t => t.Name)
            .ThenBy(t => t.Id)
            .ToListAsync();
    }

    public async Task<Team?> GetByNameAsync(string name)
    {
        var normalizedName = name.Trim();

        return await _dbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Name == normalizedName);
    }

    public async Task<IEnumerable<Team>> GetByCityAsync(string city)
    {
        var normalizedCity = city.Trim();

        return await _dbSet
            .Where(t => t.City == normalizedCity)
            .AsNoTracking()
            .OrderBy(t => t.Name)
            .ThenBy(t => t.Id)
            .ToListAsync();
    }
}
