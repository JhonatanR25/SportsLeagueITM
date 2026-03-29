using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using SportsLeague.API.DTOs.Request;
using SportsLeague.API.DTOs.Response;
using SportsLeague.API.Responses;
using SportsLeague.Domain.Entities;
using SportsLeague.Domain.Interfaces.Services;

namespace SportsLeague.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SponsorController : ControllerBase
{
    private readonly ISponsorService _sponsorService;
    private readonly IMapper _mapper;

    public SponsorController(ISponsorService sponsorService, IMapper mapper)
    {
        _sponsorService = sponsorService;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SponsorResponseDTO>>> GetAll()
    {
        var sponsors = await _sponsorService.GetAllAsync();
        return Ok(_mapper.Map<IEnumerable<SponsorResponseDTO>>(sponsors));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SponsorResponseDTO>> GetById(int id)
    {
        var sponsor = await _sponsorService.GetByIdAsync(id);
        if (sponsor == null)
        {
            return ApiErrorFactory.NotFound(this, $"No se encontro el sponsor con ID {id}.");
        }

        return Ok(_mapper.Map<SponsorResponseDTO>(sponsor));
    }

    [HttpPost]
    public async Task<ActionResult<SponsorResponseDTO>> Create([FromBody] SponsorRequestDTO dto)
    {
        var sponsor = _mapper.Map<Sponsor>(dto);
        var created = await _sponsorService.CreateAsync(sponsor);
        var responseDto = _mapper.Map<SponsorResponseDTO>(created);

        return CreatedAtAction(nameof(GetById), new { id = responseDto.Id }, responseDto);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SponsorRequestDTO dto)
    {
        var sponsor = _mapper.Map<Sponsor>(dto);
        await _sponsorService.UpdateAsync(id, sponsor);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _sponsorService.DeleteAsync(id);
        return NoContent();
    }

    [HttpGet("{id:int}/tournaments")]
    public async Task<ActionResult<IEnumerable<TournamentSponsorResponseDTO>>> GetTournaments(int id)
    {
        var tournaments = await _sponsorService.GetTournamentsBySponsorAsync(id);
        return Ok(_mapper.Map<IEnumerable<TournamentSponsorResponseDTO>>(tournaments));
    }

    [HttpPost("{id:int}/tournaments")]
    public async Task<ActionResult<TournamentSponsorResponseDTO>> LinkTournament(int id, [FromBody] TournamentSponsorRequestDTO dto)
    {
        var created = await _sponsorService.LinkTournamentAsync(id, dto.TournamentId, dto.ContractAmount);
        var responseDto = _mapper.Map<TournamentSponsorResponseDTO>(created);

        return CreatedAtAction(nameof(GetTournaments), new { id }, responseDto);
    }

    [HttpDelete("{id:int}/tournaments/{tid:int}")]
    public async Task<IActionResult> UnlinkTournament(int id, int tid)
    {
        await _sponsorService.UnlinkTournamentAsync(id, tid);
        return NoContent();
    }
}
