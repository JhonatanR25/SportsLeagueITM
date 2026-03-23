using Microsoft.Extensions.Logging;
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
            _logger.LogWarning("Equipo con ID {TeamId} no encontrado.", id);

        return team;
    }

    public async Task<Team> CreateAsync(Team team)
    {
        _logger.LogInformation("Intentando crear un nuevo equipo: {TeamName}", team.Name);

        // Validación de negocio: El nombre del equipo debe ser único
        var existingTeam = await _teamRepository.GetByNameAsync(team.Name);
        if (existingTeam != null)
        {
            _logger.LogWarning("Error al crear: El nombre '{TeamName}' ya existe.", team.Name);
            throw new InvalidOperationException($"Ya existe un equipo con el nombre '{team.Name}'");
        }

        return await _teamRepository.CreateAsync(team);
    }

    public async Task UpdateAsync(int id, Team team)
    {
        _logger.LogInformation("Intentando actualizar equipo con ID: {TeamId}", id);

        var existingTeam = await _teamRepository.GetByIdAsync(id);
        if (existingTeam == null)
        {
            _logger.LogWarning("Update fallido: Equipo {TeamId} no existe.", id);
            throw new KeyNotFoundException($"No se encontró el equipo con ID {id}");
        }

        // Validar nombre único solo si el nombre ha cambiado
        if (existingTeam.Name != team.Name)
        {
            var teamWithSameName = await _teamRepository.GetByNameAsync(team.Name);
            if (teamWithSameName != null)
            {
                throw new InvalidOperationException($"El nombre '{team.Name}' ya está siendo usado por otro equipo.");
            }
        }

        // Mapeo manual (Clean Code: Mantiene el Dominio independiente de librerías externas)
        existingTeam.Name = team.Name;
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
            throw new KeyNotFoundException($"No se encontró el equipo con ID {id}");
        }

        await _teamRepository.DeleteAsync(id);
        _logger.LogInformation("Equipo {TeamId} eliminado correctamente.", id);
    }
}