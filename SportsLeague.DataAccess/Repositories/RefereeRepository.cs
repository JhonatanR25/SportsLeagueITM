using Microsoft.EntityFrameworkCore;
using SportsLeague.DataAccess.Context;
using SportsLeague.Domain.Entities;
using SportsLeague.Domain.Interfaces.Repositories;


namespace SportsLeague.DataAccess.Repositories;

public class RefereeRepository : GenericRepository<Referee>, IRefereeRepository
{
    public RefereeRepository(LeagueDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Referee>> GetByNationalityAsync(string nationality)
    {
        return await _context.Referees
            .Where(r => r.Nationality.ToLower() == nationality.ToLower().Trim())
            .ToListAsync();
    }

    public override async Task UpdateAsync(Referee entity)
    {
        _context.Entry(entity).State = EntityState.Modified;
        await _context.SaveChangesAsync();
    }
}
