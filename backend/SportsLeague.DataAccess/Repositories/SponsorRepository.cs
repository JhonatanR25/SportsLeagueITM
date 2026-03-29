using Microsoft.EntityFrameworkCore;
using SportsLeague.DataAccess.Context;
using SportsLeague.Domain.Entities;
using SportsLeague.Domain.Interfaces.Repositories;

namespace SportsLeague.DataAccess.Repositories;

public class SponsorRepository : GenericRepository<Sponsor>, ISponsorRepository
{
    public SponsorRepository(LeagueDbContext context) : base(context)
    {
    }

    public async Task<Sponsor?> GetByNameAsync(string name)
    {
        var normalizedName = name.Trim();

        return await _dbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Name == normalizedName);
    }
}
