using Microsoft.Extensions.Logging;
using SportsLeague.Domain.Common;
using SportsLeague.Domain.Entities;
using SportsLeague.Domain.Interfaces.Repositories;
using SportsLeague.Domain.Interfaces.Services;

namespace SportsLeague.Domain.Services;

public class TeamService : ITeamService
{
    private readonly ITeamRepository _teamRepository;
    private readonly ILogger<TeamService> _logger;

    public TeamService(ITeamRepository teamRepository, ILogger<TeamService> logger)
    {
        _teamRepository = teamRepository;
        _logger = logger;
    }

    public async Task<PagedResult<Team>> GetPagedAsync(int pageNumber, int pageSize)
    {
        _logger.LogInformation("Consultando equipos paginados. PageNumber={PageNumber}, PageSize={PageSize}", pageNumber, pageSize);
        return await _teamRepository.GetPagedAsync(pageNumber, pageSize);
    }

    public async Task<IEnumerable<Team>> GetAllAsync()
    {
        _logger.LogInformation("Consultando todos los equipos.");
        return await _teamRepository.GetAllAsync();
    }

    public async Task<Team?> GetByIdAsync(int id)
    {
        _logger.LogInformation("Consultando equipo con ID: {TeamId}", id);

        var team = await _teamRepository.GetByIdAsync(id);

        if (team == null)
        {
            _logger.LogWarning("Equipo con ID {TeamId} no encontrado.", id);
        }

        return team;
    }

    public async Task<Team> CreateAsync(Team team)
    {
        if (team == null)
            throw new ArgumentNullException(nameof(team));

        if (string.IsNullOrWhiteSpace(team.Name))
            throw new ArgumentException("El nombre del equipo es obligatorio.", nameof(team.Name));

        var normalizedName = team.Name.Trim();

        _logger.LogInformation("Intentando crear un nuevo equipo: {TeamName}", normalizedName);

        var existingTeam = await _teamRepository.GetByNameAsync(normalizedName);
        if (existingTeam != null)
        {
            _logger.LogWarning("Error al crear: El nombre '{TeamName}' ya existe.", normalizedName);
            throw new InvalidOperationException($"Ya existe un equipo con el nombre '{normalizedName}'.");
        }

        team.Name = normalizedName;

        return await _teamRepository.CreateAsync(team);
    }

    public async Task UpdateAsync(int id, Team team)
    {
        if (team == null)
            throw new ArgumentNullException(nameof(team));

        if (string.IsNullOrWhiteSpace(team.Name))
            throw new ArgumentException("El nombre del equipo es obligatorio.", nameof(team.Name));

        _logger.LogInformation("Intentando actualizar equipo con ID: {TeamId}", id);

        var existingTeam = await _teamRepository.GetByIdAsync(id);
        if (existingTeam == null)
        {
            _logger.LogWarning("Update fallido: Equipo {TeamId} no existe.", id);
            throw new KeyNotFoundException($"No se encontró el equipo con ID {id}.");
        }

        var normalizedName = team.Name.Trim();

        if (!string.Equals(existingTeam.Name, normalizedName, StringComparison.OrdinalIgnoreCase))
        {
            var teamWithSameName = await _teamRepository.GetByNameAsync(normalizedName);
            if (teamWithSameName != null)
            {
                _logger.LogWarning("El nombre '{TeamName}' ya está siendo usado por otro equipo.", normalizedName);
                throw new InvalidOperationException($"El nombre '{normalizedName}' ya está siendo usado por otro equipo.");
            }
        }

        existingTeam.Name = normalizedName;
        existingTeam.City = team.City;
        existingTeam.Stadium = team.Stadium;
        existingTeam.LogoUrl = team.LogoUrl;
        existingTeam.FoundedDate = team.FoundedDate;

        await _teamRepository.UpdateAsync(existingTeam);

        _logger.LogInformation("Equipo {TeamId} actualizado con éxito.", id);
    }

    public async Task DeleteAsync(int id)
    {
        _logger.LogInformation("Intentando eliminar equipo con ID: {TeamId}", id);

        var exists = await _teamRepository.ExistsAsync(id);
        if (!exists)
        {
            _logger.LogWarning("Eliminación fallida: Equipo {TeamId} no existe.", id);
            throw new KeyNotFoundException($"No se encontró el equipo con ID {id}.");
        }

        if (await _teamRepository.HasPlayersAsync(id))
        {
            throw new InvalidOperationException("No se puede eliminar el equipo porque tiene jugadores asociados.");
        }

        if (await _teamRepository.HasTournamentRegistrationsAsync(id))
        {
            throw new InvalidOperationException("No se puede eliminar el equipo porque esta inscrito en uno o mas torneos.");
        }

        if (await _teamRepository.HasMatchesAsync(id))
        {
            throw new InvalidOperationException("No se puede eliminar el equipo porque tiene partidos asociados.");
        }

        await _teamRepository.DeleteAsync(id);

        _logger.LogInformation("Equipo {TeamId} eliminado correctamente.", id);
    }
}
