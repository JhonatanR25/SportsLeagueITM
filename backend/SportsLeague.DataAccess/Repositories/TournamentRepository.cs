using Microsoft.EntityFrameworkCore;
using SportsLeague.DataAccess.Context;
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

    public async Task<IEnumerable<Tournament>> GetAllWithTeamsAsync()
    {
        return await _dbSet
            .Include(t => t.TournamentTeams)
            .AsNoTracking()
            .OrderBy(t => t.StartDate)
            .ThenBy(t => t.Id)
            .ToListAsync();
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
