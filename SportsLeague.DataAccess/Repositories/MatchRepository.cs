using Microsoft.EntityFrameworkCore;
using SportsLeague.DataAccess.Context;
using SportsLeague.Domain.Entities;
using SportsLeague.Domain.Enums;
using SportsLeague.Domain.Interfaces.Repositories;

namespace SportsLeague.DataAccess.Repositories;

public class MatchRepository : GenericRepository<Match>, IMatchRepository
{
    public MatchRepository(LeagueDbContext context) : base(context)
    {
    }

    public async Task<Match?> GetByIdWithDetailsAsync(int id)
    {
        return await _dbSet
            .Include(m => m.HomeTeam)
            .Include(m => m.AwayTeam)
            .Include(m => m.Referee)
            .Include(m => m.Tournament)
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == id);
    }

    public async Task<IEnumerable<Match>> GetAllWithDetailsAsync()
    {
        return await _dbSet
            .Include(m => m.HomeTeam)
            .Include(m => m.AwayTeam)
            .Include(m => m.Referee)
            .Include(m => m.Tournament)
            .OrderBy(m => m.MatchDate)
            .ThenBy(m => m.Id)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<IEnumerable<Match>> GetFilteredAsync(int? tournamentId, MatchStatus? status, DateTime? fromDate, DateTime? toDate)
    {
        var query = _dbSet
            .Include(m => m.HomeTeam)
            .Include(m => m.AwayTeam)
            .Include(m => m.Referee)
            .Include(m => m.Tournament)
            .AsNoTracking()
            .AsQueryable();

        if (tournamentId.HasValue)
        {
            query = query.Where(m => m.TournamentId == tournamentId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(m => m.Status == status.Value);
        }

        if (fromDate.HasValue)
        {
            query = query.Where(m => m.MatchDate >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(m => m.MatchDate <= toDate.Value);
        }

        return await query
            .OrderBy(m => m.MatchDate)
            .ThenBy(m => m.Id)
            .ToListAsync();
    }

    public async Task<IEnumerable<Match>> GetByTournamentAsync(int tournamentId)
    {
        return await _dbSet
            .Where(m => m.TournamentId == tournamentId)
            .Include(m => m.HomeTeam)
            .Include(m => m.AwayTeam)
            .Include(m => m.Referee)
            .Include(m => m.Tournament)
            .OrderBy(m => m.MatchDate)
            .ThenBy(m => m.Id)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<IEnumerable<Match>> GetByStatusAsync(MatchStatus status)
    {
        return await _dbSet
            .Where(m => m.Status == status)
            .Include(m => m.HomeTeam)
            .Include(m => m.AwayTeam)
            .Include(m => m.Referee)
            .Include(m => m.Tournament)
            .OrderBy(m => m.MatchDate)
            .ThenBy(m => m.Id)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<IEnumerable<Match>> GetByDateRangeAsync(DateTime fromDate, DateTime toDate)
    {
        return await _dbSet
            .Where(m => m.MatchDate >= fromDate && m.MatchDate <= toDate)
            .Include(m => m.HomeTeam)
            .Include(m => m.AwayTeam)
            .Include(m => m.Referee)
            .Include(m => m.Tournament)
            .OrderBy(m => m.MatchDate)
            .ThenBy(m => m.Id)
            .AsNoTracking()
            .ToListAsync();
    }
}
