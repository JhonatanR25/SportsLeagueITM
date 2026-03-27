using Microsoft.EntityFrameworkCore;
using SportsLeague.DataAccess.Context;
using SportsLeague.Domain.Common;
using SportsLeague.Domain.Entities;
using SportsLeague.Domain.Enums;
using SportsLeague.Domain.Interfaces.Repositories;

namespace SportsLeague.DataAccess.Repositories;

public class TournamentRepository : GenericRepository<Tournament>, ITournamentRepository
{
    public TournamentRepository(LeagueDbContext context) : base(context)
    {
    }

    public override async Task<IEnumerable<Tournament>> GetAllAsync()
    {
        return await GetAllWithTeamsAsync();
    }

    public async Task<PagedResult<Tournament>> GetPagedWithTeamsAsync(int pageNumber, int pageSize)
    {
        var query = _dbSet
            .Include(t => t.TournamentTeams)
            .AsNoTracking()
            .OrderBy(t => t.StartDate)
            .ThenBy(t => t.Id);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<Tournament>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize)
        };
    }

    public async Task<IEnumerable<Tournament>> GetAllWithTeamsAsync()
    {
        return await _dbSet
            .Include(t => t.TournamentTeams)
            .AsNoTracking()
            .OrderBy(t => t.StartDate)
            .ThenBy(t => t.Id)
            .ToListAsync();
    }

    public async Task<Tournament?> GetByNameAndSeasonAsync(string name, string season)
    {
        var normalizedName = name.Trim();
        var normalizedSeason = season.Trim();

        return await _dbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Name == normalizedName && t.Season == normalizedSeason);
    }

    public async Task<bool> HasRegisteredTeamsAsync(int tournamentId)
    {
        return await _context.TournamentTeams
            .AsNoTracking()
            .AnyAsync(tt => tt.TournamentId == tournamentId);
    }

    public async Task<bool> HasMatchesAsync(int tournamentId)
    {
        return await _context.Matches
            .AsNoTracking()
            .AnyAsync(m => m.TournamentId == tournamentId);
    }

    public async Task<IEnumerable<Tournament>> GetByStatusAsync(TournamentStatus status)
    {
        return await _dbSet
            .Where(t => t.Status == status)
            .AsNoTracking()
            .OrderBy(t => t.StartDate)
            .ThenBy(t => t.Id)
            .ToListAsync();
    }

    public async Task<Tournament?> GetByIdWithTeamsAsync(int id)
    {
        return await _dbSet
            .Where(t => t.Id == id)
            .Include(t => t.TournamentTeams)
                .ThenInclude(tt => tt.Team)
            .AsNoTracking()
            .FirstOrDefaultAsync();
    }
}
