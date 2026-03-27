using SportsLeague.Domain.Common;
using SportsLeague.Domain.Entities;

namespace SportsLeague.Domain.Interfaces.Repositories;

public interface IRefereeRepository : IGenericRepository<Referee>
{
    Task<PagedResult<Referee>> GetPagedAsync(int pageNumber, int pageSize);
    Task<Referee?> GetByIdentityAsync(string firstName, string lastName, string nationality);
    Task<bool> HasMatchesAsync(int refereeId);
    Task<IEnumerable<Referee>> GetByNationalityAsync(string nationality);
}
