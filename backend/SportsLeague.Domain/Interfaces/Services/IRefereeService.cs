using SportsLeague.Domain.Common;
using SportsLeague.Domain.Entities;

namespace SportsLeague.Domain.Interfaces.Services;

public interface IRefereeService
{
    Task<PagedResult<Referee>> GetPagedAsync(int pageNumber, int pageSize);
    Task<IEnumerable<Referee>> GetAllAsync();
    Task<Referee?> GetByIdAsync(int id);
    Task<Referee> CreateAsync(Referee referee);
    Task UpdateAsync(int id, Referee referee);
    Task DeleteAsync(int id);
}
