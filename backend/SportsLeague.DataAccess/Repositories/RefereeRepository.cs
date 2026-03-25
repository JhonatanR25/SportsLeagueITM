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

    public async Task<Referee?> GetByIdentityAsync(string firstName, string lastName, string nationality)
    {
        var normalizedFirstName = firstName.Trim();
        var normalizedLastName = lastName.Trim();
        var normalizedNationality = nationality.Trim();

        return await _context.Referees
            .AsNoTracking()
            .FirstOrDefaultAsync(r =>
                r.FirstName == normalizedFirstName &&
                r.LastName == normalizedLastName &&
                r.Nationality == normalizedNationality);
    }

    public async Task<IEnumerable<Referee>> GetByNationalityAsync(string nationality)
    {
        var normalizedNationality = nationality.Trim();

        return await _context.Referees
            .Where(r => r.Nationality == normalizedNationality)
            .AsNoTracking()
            .OrderBy(r => r.LastName)
            .ThenBy(r => r.FirstName)
            .ToListAsync();
    }

    public async Task<bool> HasMatchesAsync(int refereeId)
    {
        return await _context.Matches
            .AsNoTracking()
            .AnyAsync(m => m.RefereeId == refereeId);
    }

    public override async Task UpdateAsync(Referee entity)
    {
        _context.Entry(entity).State = EntityState.Modified;
        await _context.SaveChangesAsync();
    }
}
