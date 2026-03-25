using Microsoft.Extensions.Logging;
using SportsLeague.Domain.Entities;
using SportsLeague.Domain.Interfaces.Repositories;
using SportsLeague.Domain.Interfaces.Services;

namespace SportsLeague.Domain.Services;

public class RefereeService : IRefereeService
{
    private readonly IRefereeRepository _refereeRepository;
    private readonly ILogger<RefereeService> _logger;

    public RefereeService(
        IRefereeRepository refereeRepository,
        ILogger<RefereeService> logger)
    {
        _refereeRepository = refereeRepository;
        _logger = logger;
    }

    public async Task<IEnumerable<Referee>> GetAllAsync()
    {
        _logger.LogInformation("Retrieving all referees");
        return await _refereeRepository.GetAllAsync();
    }

    public async Task<Referee?> GetByIdAsync(int id)
    {
        _logger.LogInformation("Retrieving referee with ID: {RefereeId}", id);
        var referee = await _refereeRepository.GetByIdAsync(id);
        if (referee == null)
            _logger.LogWarning("Referee with ID {RefereeId} not found", id);
        return referee;
    }

    public async Task<Referee> CreateAsync(Referee referee)
    {
        if (referee == null)
            throw new ArgumentNullException(nameof(referee));

        if (string.IsNullOrWhiteSpace(referee.FirstName))
            throw new ArgumentException("El nombre del arbitro es obligatorio.", nameof(referee.FirstName));

        if (string.IsNullOrWhiteSpace(referee.LastName))
            throw new ArgumentException("El apellido del arbitro es obligatorio.", nameof(referee.LastName));

        if (string.IsNullOrWhiteSpace(referee.Nationality))
            throw new ArgumentException("La nacionalidad es obligatoria.", nameof(referee.Nationality));

        var normalizedFirstName = referee.FirstName.Trim();
        var normalizedLastName = referee.LastName.Trim();
        var normalizedNationality = referee.Nationality.Trim();

        var existingReferee = await _refereeRepository.GetByIdentityAsync(
            normalizedFirstName,
            normalizedLastName,
            normalizedNationality);

        if (existingReferee != null)
        {
            throw new InvalidOperationException(
                $"Ya existe un arbitro con el nombre '{normalizedFirstName} {normalizedLastName}' y nacionalidad '{normalizedNationality}'.");
        }

        referee.FirstName = normalizedFirstName;
        referee.LastName = normalizedLastName;
        referee.Nationality = normalizedNationality;

        _logger.LogInformation(
            "Creating referee: {FirstName} {LastName}",
            referee.FirstName, referee.LastName);
        return await _refereeRepository.CreateAsync(referee);
    }

    public async Task UpdateAsync(int id, Referee referee)
    {
        if (referee == null)
            throw new ArgumentNullException(nameof(referee));

        if (string.IsNullOrWhiteSpace(referee.FirstName))
            throw new ArgumentException("El nombre del arbitro es obligatorio.", nameof(referee.FirstName));

        if (string.IsNullOrWhiteSpace(referee.LastName))
            throw new ArgumentException("El apellido del arbitro es obligatorio.", nameof(referee.LastName));

        if (string.IsNullOrWhiteSpace(referee.Nationality))
            throw new ArgumentException("La nacionalidad es obligatoria.", nameof(referee.Nationality));

        var existing = await _refereeRepository.GetByIdAsync(id);
        if (existing == null)
            throw new KeyNotFoundException($"No se encontró el árbitro con ID {id}");

        var normalizedFirstName = referee.FirstName.Trim();
        var normalizedLastName = referee.LastName.Trim();
        var normalizedNationality = referee.Nationality.Trim();

        var duplicateReferee = await _refereeRepository.GetByIdentityAsync(
            normalizedFirstName,
            normalizedLastName,
            normalizedNationality);

        if (duplicateReferee != null && duplicateReferee.Id != id)
        {
            throw new InvalidOperationException(
                $"Ya existe un arbitro con el nombre '{normalizedFirstName} {normalizedLastName}' y nacionalidad '{normalizedNationality}'.");
        }

        existing.FirstName = normalizedFirstName;
        existing.LastName = normalizedLastName;
        existing.Nationality = normalizedNationality;

        _logger.LogInformation("Updating referee with ID: {RefereeId}", id);
        await _refereeRepository.UpdateAsync(existing);
    }
    public async Task DeleteAsync(int id)
    {
        var exists = await _refereeRepository.ExistsAsync(id);
        if (!exists)
            throw new KeyNotFoundException($"No se encontró el árbitro con ID {id}");

        var hasMatches = await _refereeRepository.HasMatchesAsync(id);
        if (hasMatches)
        {
            throw new InvalidOperationException("No se puede eliminar el arbitro porque tiene partidos asociados.");
        }

        _logger.LogInformation("Deleting referee with ID: {RefereeId}", id);
        await _refereeRepository.DeleteAsync(id);
    }
}

