using Microsoft.EntityFrameworkCore;
using SportsLeague.DataAccess.Context;
using SportsLeague.Domain.Common;
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

    public async Task<PagedResult<Team>> GetPagedAsync(int pageNumber, int pageSize)
    {
        var query = _dbSet
            .Include(t => t.Players)
            .AsNoTracking()
            .OrderBy(t => t.Name)
            .ThenBy(t => t.Id);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<Team>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize)
        };
    }

    public async Task<Team?> GetByNameAsync(string name)
    {
        var normalizedName = name.Trim();

        return await _dbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Name == normalizedName);
    }

    public async Task<bool> HasPlayersAsync(int teamId)
    {
        return await _context.Players
            .AsNoTracking()
            .AnyAsync(p => p.TeamId == teamId);
    }

    public async Task<bool> HasTournamentRegistrationsAsync(int teamId)
    {
        return await _context.TournamentTeams
            .AsNoTracking()
            .AnyAsync(tt => tt.TeamId == teamId);
    }

    public async Task<bool> HasMatchesAsync(int teamId)
    {
        return await _context.Matches
            .AsNoTracking()
            .AnyAsync(m => m.HomeTeamId == teamId || m.AwayTeamId == teamId);
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
