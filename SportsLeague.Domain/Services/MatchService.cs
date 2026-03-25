using Microsoft.Extensions.Logging;
using SportsLeague.Domain.Entities;
using SportsLeague.Domain.Enums;
using SportsLeague.Domain.Interfaces.Repositories;
using SportsLeague.Domain.Interfaces.Services;

namespace SportsLeague.Domain.Services;

public class MatchService : IMatchService
{
    private readonly IMatchRepository _matchRepository;
    private readonly ITeamRepository _teamRepository;
    private readonly IRefereeRepository _refereeRepository;
    private readonly ITournamentRepository _tournamentRepository;
    private readonly ITournamentTeamRepository _tournamentTeamRepository;
    private readonly ILogger<MatchService> _logger;

    public MatchService(
        IMatchRepository matchRepository,
        ITeamRepository teamRepository,
        IRefereeRepository refereeRepository,
        ITournamentRepository tournamentRepository,
        ITournamentTeamRepository tournamentTeamRepository,
        ILogger<MatchService> logger)
    {
        _matchRepository = matchRepository;
        _teamRepository = teamRepository;
        _refereeRepository = refereeRepository;
        _tournamentRepository = tournamentRepository;
        _tournamentTeamRepository = tournamentTeamRepository;
        _logger = logger;
    }

    public async Task<IEnumerable<Match>> GetAllAsync()
    {
        _logger.LogInformation("Retrieving all matches.");
        return await _matchRepository.GetAllWithDetailsAsync();
    }

    public async Task<Match?> GetByIdAsync(int id)
    {
        _logger.LogInformation("Retrieving match with ID: {MatchId}", id);
        return await _matchRepository.GetByIdWithDetailsAsync(id);
    }

    public async Task<Match> CreateAsync(Match match)
    {
        if (match == null)
            throw new ArgumentNullException(nameof(match));

        if (match.HomeTeamId <= 0 || match.AwayTeamId <= 0 || match.RefereeId <= 0 || match.TournamentId <= 0)
            throw new ArgumentException("Los IDs de equipo, árbitro y torneo deben ser mayores que cero.");

        if (match.HomeTeamId == match.AwayTeamId)
            throw new InvalidOperationException("El equipo local y visitante deben ser diferentes.");

        await ValidateEntitiesExistAsync(match);
        await ValidateTeamsRegisteredAsync(match.TournamentId, match.HomeTeamId, match.AwayTeamId);

        // Regla de creación: siempre inicia en Scheduled y marcador 0-0.
        match.Status = MatchStatus.Scheduled;
        match.HomeScore = 0;
        match.AwayScore = 0;

        _logger.LogInformation(
            "Creating match for tournament {TournamentId}: HomeTeam={HomeTeamId}, AwayTeam={AwayTeamId}.",
            match.TournamentId,
            match.HomeTeamId,
            match.AwayTeamId);

        return await _matchRepository.CreateAsync(match);
    }

    public async Task UpdateStatusAsync(int id, MatchStatus newStatus)
    {
        var match = await _matchRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"No se encontró el partido con ID {id}.");

        var validTransition = (match.Status, newStatus) switch
        {
            (MatchStatus.Scheduled, MatchStatus.InProgress) => true,
            (MatchStatus.Scheduled, MatchStatus.Suspended) => true,
            (MatchStatus.InProgress, MatchStatus.Finished) => true,
            (MatchStatus.InProgress, MatchStatus.Suspended) => true,
            (MatchStatus.Suspended, MatchStatus.InProgress) => true,
            (MatchStatus.Suspended, MatchStatus.Finished) => true,
            _ => false
        };

        if (!validTransition)
        {
            throw new InvalidOperationException($"No se puede cambiar de {match.Status} a {newStatus}.");
        }

        match.Status = newStatus;
        await _matchRepository.UpdateAsync(match);
    }

    public async Task UpdateScoreAsync(int id, int homeScore, int awayScore, bool isFinalScore = false)
    {
        var match = await _matchRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"No se encontró el partido con ID {id}.");

        if (homeScore < 0 || awayScore < 0)
            throw new ArgumentException("El marcador no puede tener valores negativos.");

        if (match.Status == MatchStatus.Scheduled)
            throw new InvalidOperationException("No se puede registrar marcador en estado Scheduled.");

        if (isFinalScore && match.Status != MatchStatus.Finished)
            throw new InvalidOperationException("El marcador final solo puede registrarse cuando el partido está Finished.");

        match.HomeScore = homeScore;
        match.AwayScore = awayScore;

        await _matchRepository.UpdateAsync(match);
    }

    private async Task ValidateEntitiesExistAsync(Match match)
    {
        var homeExists = await _teamRepository.ExistsAsync(match.HomeTeamId);
        var awayExists = await _teamRepository.ExistsAsync(match.AwayTeamId);
        var refereeExists = await _refereeRepository.ExistsAsync(match.RefereeId);
        var tournamentExists = await _tournamentRepository.ExistsAsync(match.TournamentId);

        if (!homeExists)
            throw new KeyNotFoundException($"No se encontró el equipo local con ID {match.HomeTeamId}.");

        if (!awayExists)
            throw new KeyNotFoundException($"No se encontró el equipo visitante con ID {match.AwayTeamId}.");

        if (!refereeExists)
            throw new KeyNotFoundException($"No se encontró el árbitro con ID {match.RefereeId}.");

        if (!tournamentExists)
            throw new KeyNotFoundException($"No se encontró el torneo con ID {match.TournamentId}.");
    }

    private async Task ValidateTeamsRegisteredAsync(int tournamentId, int homeTeamId, int awayTeamId)
    {
        var homeRegistration = await _tournamentTeamRepository.GetByTournamentAndTeamAsync(tournamentId, homeTeamId);
        var awayRegistration = await _tournamentTeamRepository.GetByTournamentAndTeamAsync(tournamentId, awayTeamId);

        if (homeRegistration == null || awayRegistration == null)
        {
            throw new InvalidOperationException("Ambos equipos deben estar inscritos en el torneo para crear un partido.");
        }
    }
}
