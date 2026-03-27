using Microsoft.Extensions.Logging;
using SportsLeague.Domain.Common;
using SportsLeague.Domain.Entities;
using SportsLeague.Domain.Enums;
using SportsLeague.Domain.Interfaces.Repositories;
using SportsLeague.Domain.Interfaces.Services;

namespace SportsLeague.Domain.Services;

public class TournamentService : ITournamentService
{
    private readonly ITournamentRepository _tournamentRepository;
    private readonly ITournamentTeamRepository _tournamentTeamRepository;
    private readonly ITeamRepository _teamRepository;
    private readonly ILogger<TournamentService> _logger;

    public TournamentService(
        ITournamentRepository tournamentRepository,
        ITournamentTeamRepository tournamentTeamRepository,
        ITeamRepository teamRepository,
        ILogger<TournamentService> logger)
    {
        _tournamentRepository = tournamentRepository;
        _tournamentTeamRepository = tournamentTeamRepository;
        _teamRepository = teamRepository;
        _logger = logger;
    }

    public async Task<PagedResult<Tournament>> GetPagedAsync(int pageNumber, int pageSize)
    {
        _logger.LogInformation("Retrieving paged tournaments. PageNumber={PageNumber}, PageSize={PageSize}", pageNumber, pageSize);
        return await _tournamentRepository.GetPagedWithTeamsAsync(pageNumber, pageSize);
    }

    public async Task<IEnumerable<Tournament>> GetAllAsync()
    {
        _logger.LogInformation("Retrieving all tournaments.");
        return await _tournamentRepository.GetAllWithTeamsAsync();
    }

    public async Task<Tournament?> GetByIdAsync(int id)
    {
        _logger.LogInformation("Retrieving tournament with ID: {TournamentId}", id);
        var tournament = await _tournamentRepository.GetByIdWithTeamsAsync(id);

        if (tournament == null)
        {
            _logger.LogWarning("Tournament with ID {TournamentId} not found.", id);
        }

        return tournament;
    }

    public async Task<Tournament> CreateAsync(Tournament tournament)
    {
        if (tournament == null)
            throw new ArgumentNullException(nameof(tournament));

        if (string.IsNullOrWhiteSpace(tournament.Name))
            throw new ArgumentException("El nombre del torneo es obligatorio.", nameof(tournament.Name));

        if (string.IsNullOrWhiteSpace(tournament.Season))
            throw new ArgumentException("La temporada del torneo es obligatoria.", nameof(tournament.Season));

        if (tournament.EndDate <= tournament.StartDate)
        {
            throw new InvalidOperationException("La fecha de finalización debe ser posterior a la fecha de inicio.");
        }

        tournament.Name = tournament.Name.Trim();
        tournament.Season = tournament.Season.Trim();

        var duplicateTournament = await _tournamentRepository.GetByNameAndSeasonAsync(tournament.Name, tournament.Season);
        if (duplicateTournament != null)
        {
            throw new InvalidOperationException(
                $"Ya existe un torneo con el nombre '{tournament.Name}' y temporada '{tournament.Season}'.");
        }

        tournament.Status = TournamentStatus.Pending;

        _logger.LogInformation("Creating tournament: {TournamentName}", tournament.Name);
        return await _tournamentRepository.CreateAsync(tournament);
    }

    public async Task UpdateAsync(int id, Tournament tournament)
    {
        if (tournament == null)
            throw new ArgumentNullException(nameof(tournament));

        if (string.IsNullOrWhiteSpace(tournament.Name))
            throw new ArgumentException("El nombre del torneo es obligatorio.", nameof(tournament.Name));

        if (string.IsNullOrWhiteSpace(tournament.Season))
            throw new ArgumentException("La temporada del torneo es obligatoria.", nameof(tournament.Season));

        var existing = await _tournamentRepository.GetByIdAsync(id);
        if (existing == null)
            throw new KeyNotFoundException($"No se encontró el torneo con ID {id}.");

        if (existing.Status != TournamentStatus.Pending)
        {
            throw new InvalidOperationException("Solo se pueden editar torneos en estado Pending.");
        }

        if (tournament.EndDate <= tournament.StartDate)
        {
            throw new InvalidOperationException("La fecha de finalización debe ser posterior a la fecha de inicio.");
        }

        var normalizedName = tournament.Name.Trim();
        var normalizedSeason = tournament.Season.Trim();

        var duplicateTournament = await _tournamentRepository.GetByNameAndSeasonAsync(normalizedName, normalizedSeason);
        if (duplicateTournament != null && duplicateTournament.Id != id)
        {
            throw new InvalidOperationException(
                $"Ya existe un torneo con el nombre '{normalizedName}' y temporada '{normalizedSeason}'.");
        }

        existing.Name = normalizedName;
        existing.Season = normalizedSeason;
        existing.StartDate = tournament.StartDate;
        existing.EndDate = tournament.EndDate;

        _logger.LogInformation("Updating tournament with ID: {TournamentId}", id);
        await _tournamentRepository.UpdateAsync(existing);
    }

    public async Task DeleteAsync(int id)
    {
        var existing = await _tournamentRepository.GetByIdAsync(id);
        if (existing == null)
            throw new KeyNotFoundException($"No se encontró el torneo con ID {id}.");

        if (existing.Status != TournamentStatus.Pending)
        {
            throw new InvalidOperationException("Solo se pueden eliminar torneos en estado Pending.");
        }

        if (await _tournamentRepository.HasRegisteredTeamsAsync(id))
        {
            throw new InvalidOperationException("No se puede eliminar el torneo porque tiene equipos inscritos.");
        }

        if (await _tournamentRepository.HasMatchesAsync(id))
        {
            throw new InvalidOperationException("No se puede eliminar el torneo porque tiene partidos asociados.");
        }

        _logger.LogInformation("Deleting tournament with ID: {TournamentId}", id);
        await _tournamentRepository.DeleteAsync(id);
    }

    public async Task UpdateStatusAsync(int id, TournamentStatus newStatus)
    {
        var tournament = await _tournamentRepository.GetByIdAsync(id);
        if (tournament == null)
            throw new KeyNotFoundException($"No se encontró el torneo con ID {id}.");

        var validTransition = (tournament.Status, newStatus) switch
        {
            (TournamentStatus.Pending, TournamentStatus.InProgress) => true,
            (TournamentStatus.InProgress, TournamentStatus.Finished) => true,
            _ => false
        };

        if (!validTransition)
        {
            throw new InvalidOperationException($"No se puede cambiar de {tournament.Status} a {newStatus}.");
        }

        tournament.Status = newStatus;

        _logger.LogInformation(
            "Updating tournament {TournamentId} status to {NewStatus}",
            id,
            newStatus);

        await _tournamentRepository.UpdateAsync(tournament);
    }

    public async Task RegisterTeamAsync(int tournamentId, int teamId)
    {
        var tournament = await _tournamentRepository.GetByIdAsync(tournamentId);
        if (tournament == null)
            throw new KeyNotFoundException($"No se encontró el torneo con ID {tournamentId}.");

        if (tournament.Status != TournamentStatus.Pending)
        {
            throw new InvalidOperationException("Solo se pueden inscribir equipos en torneos con estado Pending.");
        }

        var teamExists = await _teamRepository.ExistsAsync(teamId);
        if (!teamExists)
            throw new KeyNotFoundException($"No se encontró el equipo con ID {teamId}.");

        var existing = await _tournamentTeamRepository.GetByTournamentAndTeamAsync(tournamentId, teamId);
        if (existing != null)
        {
            throw new InvalidOperationException("Este equipo ya está inscrito en el torneo.");
        }

        var tournamentTeam = new TournamentTeam
        {
            TournamentId = tournamentId,
            TeamId = teamId,
            RegisteredAt = DateTime.UtcNow
        };

        _logger.LogInformation(
            "Registering team {TeamId} in tournament {TournamentId}",
            teamId,
            tournamentId);

        await _tournamentTeamRepository.CreateAsync(tournamentTeam);
    }

    public async Task<IEnumerable<Team>> GetTeamsByTournamentAsync(int tournamentId)
    {
        var tournament = await _tournamentRepository.GetByIdAsync(tournamentId);
        if (tournament == null)
            throw new KeyNotFoundException($"No se encontró el torneo con ID {tournamentId}.");

        var tournamentTeams = await _tournamentTeamRepository.GetByTournamentAsync(tournamentId);
        return tournamentTeams.Select(tt => tt.Team);
    }
}
