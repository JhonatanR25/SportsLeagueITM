using System.Net.Mail;
using Microsoft.Extensions.Logging;
using SportsLeague.Domain.Entities;
using SportsLeague.Domain.Interfaces.Repositories;
using SportsLeague.Domain.Interfaces.Services;

namespace SportsLeague.Domain.Services;

public class SponsorService : ISponsorService
{
    private readonly ISponsorRepository _sponsorRepository;
    private readonly ITournamentRepository _tournamentRepository;
    private readonly ITournamentSponsorRepository _tournamentSponsorRepository;
    private readonly ILogger<SponsorService> _logger;

    public SponsorService(
        ISponsorRepository sponsorRepository,
        ITournamentRepository tournamentRepository,
        ITournamentSponsorRepository tournamentSponsorRepository,
        ILogger<SponsorService> logger)
    {
        _sponsorRepository = sponsorRepository;
        _tournamentRepository = tournamentRepository;
        _tournamentSponsorRepository = tournamentSponsorRepository;
        _logger = logger;
    }

    public async Task<IEnumerable<Sponsor>> GetAllAsync()
    {
        _logger.LogInformation("Retrieving all sponsors.");
        return await _sponsorRepository.GetAllAsync();
    }

    public async Task<Sponsor?> GetByIdAsync(int id)
    {
        _logger.LogInformation("Retrieving sponsor with ID: {SponsorId}", id);
        var sponsor = await _sponsorRepository.GetByIdAsync(id);

        if (sponsor == null)
        {
            _logger.LogWarning("Sponsor with ID {SponsorId} not found.", id);
        }

        return sponsor;
    }

    public async Task<Sponsor> CreateAsync(Sponsor sponsor)
    {
        if (sponsor == null)
            throw new ArgumentNullException(nameof(sponsor));

        if (string.IsNullOrWhiteSpace(sponsor.Name))
            throw new ArgumentException("El nombre del sponsor es obligatorio.", nameof(sponsor.Name));

        if (string.IsNullOrWhiteSpace(sponsor.ContactEmail))
            throw new ArgumentException("El email de contacto es obligatorio.", nameof(sponsor.ContactEmail));

        var normalizedName = sponsor.Name.Trim();
        var normalizedEmail = sponsor.ContactEmail.Trim();
        var normalizedPhone = string.IsNullOrWhiteSpace(sponsor.Phone) ? null : sponsor.Phone.Trim();
        var normalizedWebsiteUrl = string.IsNullOrWhiteSpace(sponsor.WebsiteUrl) ? null : sponsor.WebsiteUrl.Trim();

        ValidateEmail(normalizedEmail);

        var existingSponsor = await _sponsorRepository.GetByNameAsync(normalizedName);
        if (existingSponsor != null)
        {
            throw new InvalidOperationException($"Ya existe un sponsor con el nombre '{normalizedName}'.");
        }

        sponsor.Name = normalizedName;
        sponsor.ContactEmail = normalizedEmail;
        sponsor.Phone = normalizedPhone;
        sponsor.WebsiteUrl = normalizedWebsiteUrl;

        _logger.LogInformation("Creating sponsor: {SponsorName}", sponsor.Name);
        return await _sponsorRepository.CreateAsync(sponsor);
    }

    public async Task UpdateAsync(int id, Sponsor sponsor)
    {
        if (sponsor == null)
            throw new ArgumentNullException(nameof(sponsor));

        if (string.IsNullOrWhiteSpace(sponsor.Name))
            throw new ArgumentException("El nombre del sponsor es obligatorio.", nameof(sponsor.Name));

        if (string.IsNullOrWhiteSpace(sponsor.ContactEmail))
            throw new ArgumentException("El email de contacto es obligatorio.", nameof(sponsor.ContactEmail));

        var existingSponsor = await _sponsorRepository.GetByIdAsync(id);
        if (existingSponsor == null)
            throw new KeyNotFoundException($"No se encontro el sponsor con ID {id}.");

        var normalizedName = sponsor.Name.Trim();
        var normalizedEmail = sponsor.ContactEmail.Trim();
        var normalizedPhone = string.IsNullOrWhiteSpace(sponsor.Phone) ? null : sponsor.Phone.Trim();
        var normalizedWebsiteUrl = string.IsNullOrWhiteSpace(sponsor.WebsiteUrl) ? null : sponsor.WebsiteUrl.Trim();

        ValidateEmail(normalizedEmail);

        var duplicateSponsor = await _sponsorRepository.GetByNameAsync(normalizedName);
        if (duplicateSponsor != null && duplicateSponsor.Id != id)
        {
            throw new InvalidOperationException($"Ya existe un sponsor con el nombre '{normalizedName}'.");
        }

        existingSponsor.Name = normalizedName;
        existingSponsor.ContactEmail = normalizedEmail;
        existingSponsor.Phone = normalizedPhone;
        existingSponsor.WebsiteUrl = normalizedWebsiteUrl;
        existingSponsor.Category = sponsor.Category;

        _logger.LogInformation("Updating sponsor with ID: {SponsorId}", id);
        await _sponsorRepository.UpdateAsync(existingSponsor);
    }

    public async Task DeleteAsync(int id)
    {
        var sponsor = await _sponsorRepository.GetByIdAsync(id);
        if (sponsor == null)
            throw new KeyNotFoundException($"No se encontro el sponsor con ID {id}.");

        var linkedTournaments = await _tournamentSponsorRepository.GetBySponsorAsync(id);
        if (linkedTournaments.Any())
        {
            throw new InvalidOperationException("No se puede eliminar el sponsor porque esta vinculado a uno o mas torneos.");
        }

        _logger.LogInformation("Deleting sponsor with ID: {SponsorId}", id);
        await _sponsorRepository.DeleteAsync(id);
    }

    public async Task<TournamentSponsor> LinkTournamentAsync(int sponsorId, int tournamentId, decimal contractAmount)
    {
        var sponsor = await _sponsorRepository.GetByIdAsync(sponsorId);
        if (sponsor == null)
            throw new KeyNotFoundException($"No se encontro el sponsor con ID {sponsorId}.");

        var tournament = await _tournamentRepository.GetByIdAsync(tournamentId);
        if (tournament == null)
            throw new KeyNotFoundException($"No se encontro el torneo con ID {tournamentId}.");

        var existingLink = await _tournamentSponsorRepository.GetByTournamentAndSponsorAsync(tournamentId, sponsorId);
        if (existingLink != null)
        {
            throw new InvalidOperationException("Este sponsor ya esta vinculado al torneo.");
        }

        if (contractAmount <= 0)
        {
            throw new InvalidOperationException("El monto del contrato debe ser mayor a 0.");
        }

        var tournamentSponsor = new TournamentSponsor
        {
            TournamentId = tournamentId,
            SponsorId = sponsorId,
            ContractAmount = contractAmount,
            JoinedAt = DateTime.UtcNow
        };

        _logger.LogInformation(
            "Linking sponsor {SponsorId} to tournament {TournamentId}",
            sponsorId,
            tournamentId);

        await _tournamentSponsorRepository.CreateAsync(tournamentSponsor);

        return await _tournamentSponsorRepository.GetByTournamentAndSponsorAsync(tournamentId, sponsorId)
            ?? tournamentSponsor;
    }

    public async Task<IEnumerable<TournamentSponsor>> GetTournamentsBySponsorAsync(int sponsorId)
    {
        var sponsor = await _sponsorRepository.GetByIdAsync(sponsorId);
        if (sponsor == null)
            throw new KeyNotFoundException($"No se encontro el sponsor con ID {sponsorId}.");

        return await _tournamentSponsorRepository.GetBySponsorAsync(sponsorId);
    }

    public async Task UnlinkTournamentAsync(int sponsorId, int tournamentId)
    {
        var sponsor = await _sponsorRepository.GetByIdAsync(sponsorId);
        if (sponsor == null)
            throw new KeyNotFoundException($"No se encontro el sponsor con ID {sponsorId}.");

        var existingLink = await _tournamentSponsorRepository.GetByTournamentAndSponsorAsync(tournamentId, sponsorId);
        if (existingLink == null)
            throw new KeyNotFoundException($"No se encontro la vinculación del sponsor {sponsorId} con el torneo {tournamentId}.");

        _logger.LogInformation(
            "Unlinking sponsor {SponsorId} from tournament {TournamentId}",
            sponsorId,
            tournamentId);

        await _tournamentSponsorRepository.DeleteAsync(existingLink.Id);
    }

    private static void ValidateEmail(string contactEmail)
    {
        try
        {
            _ = new MailAddress(contactEmail);
        }
        catch (FormatException)
        {
            throw new InvalidOperationException("El email de contacto debe tener un formato valido.");
        }
    }
}
