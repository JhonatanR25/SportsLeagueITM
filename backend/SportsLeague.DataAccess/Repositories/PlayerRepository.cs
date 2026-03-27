using Microsoft.EntityFrameworkCore;
using SportsLeague.DataAccess.Context;
using SportsLeague.Domain.Common;
using SportsLeague.Domain.Entities;
using SportsLeague.Domain.Interfaces.Repositories;

namespace SportsLeague.DataAccess.Repositories;

public class PlayerRepository : GenericRepository<Player>, IPlayerRepository
{
    public PlayerRepository(LeagueDbContext context) : base(context)
    {
    }

    public async Task<PagedResult<Player>> GetPagedAsync(int pageNumber, int pageSize)
    {
        var query = _dbSet
            .Include(p => p.Team)
            .AsNoTracking()
            .OrderBy(p => p.TeamId)
            .ThenBy(p => p.Number)
            .ThenBy(p => p.LastName);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<Player>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize)
        };
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

    public async Task<Player?> GetByIdentityAsync(int teamId, string firstName, string lastName, DateTime birthDate)
    {
        var normalizedFirstName = firstName.Trim();
        var normalizedLastName = lastName.Trim();
        var normalizedBirthDate = birthDate.Date;

        return await _dbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(p =>
                p.TeamId == teamId &&
                p.FirstName == normalizedFirstName &&
                p.LastName == normalizedLastName &&
                p.BirthDate.Date == normalizedBirthDate);
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
