using Microsoft.EntityFrameworkCore;
using SportsLeague.DataAccess.Context;
using SportsLeague.Domain.Entities;
using SportsLeague.Domain.Interfaces.Repositories;

namespace SportsLeague.DataAccess.Repositories;

public class TournamentTeamRepository : GenericRepository<TournamentTeam>, ITournamentTeamRepository
{
    public TournamentTeamRepository(LeagueDbContext context) : base(context)
    {
    }

    public async Task<TournamentTeam?> GetByTournamentAndTeamAsync(int tournamentId, int teamId)
    {
        return await _dbSet
            .Where(tt => tt.TournamentId == tournamentId && tt.TeamId == teamId)
            .AsNoTracking()
            .FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<TournamentTeam>> GetByTournamentAsync(int tournamentId)
    {
        return await _dbSet
            .Where(tt => tt.TournamentId == tournamentId)
            .Include(tt => tt.Team)
            .AsNoTracking()
            .OrderBy(tt => tt.Team.Name)
            .ThenBy(tt => tt.TeamId)
            .ToListAsync();
    }

    public override async Task DeleteAsync(int id)
    {
        var entity = await _dbSet.FindAsync(id);
        if (entity is null)
            return;

        _dbSet.Remove(entity);
        await _context.SaveChangesAsync();
    }
}
