using Microsoft.EntityFrameworkCore;
using SportsLeague.DataAccess.Context;
using SportsLeague.Domain.Entities;
using SportsLeague.Domain.Interfaces.Repositories;

namespace SportsLeague.DataAccess.Repositories;

public class TournamentSponsorRepository : GenericRepository<TournamentSponsor>, ITournamentSponsorRepository
{
    public TournamentSponsorRepository(LeagueDbContext context) : base(context)
    {
    }

    public async Task<TournamentSponsor?> GetByTournamentAndSponsorAsync(int tournamentId, int sponsorId)
    {
        return await _dbSet
            .Where(ts => ts.TournamentId == tournamentId && ts.SponsorId == sponsorId)
            .Include(ts => ts.Tournament)
            .Include(ts => ts.Sponsor)
            .AsNoTracking()
            .FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<TournamentSponsor>> GetBySponsorAsync(int sponsorId)
    {
        return await _dbSet
            .Where(ts => ts.SponsorId == sponsorId)
            .Include(ts => ts.Tournament)
            .Include(ts => ts.Sponsor)
            .AsNoTracking()
            .OrderBy(ts => ts.Tournament.Name)
            .ThenBy(ts => ts.TournamentId)
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
