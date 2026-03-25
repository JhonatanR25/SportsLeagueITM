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
public class TournamentController : ControllerBase
{
    private readonly ITournamentService _tournamentService;
    private readonly IMapper _mapper;

    public TournamentController(ITournamentService tournamentService, IMapper mapper)
    {
        _tournamentService = tournamentService;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TournamentResponseDTO>>> GetAll()
    {
        var tournaments = await _tournamentService.GetAllAsync();
        return Ok(_mapper.Map<IEnumerable<TournamentResponseDTO>>(tournaments));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TournamentResponseDTO>> GetById(int id)
    {
        var tournament = await _tournamentService.GetByIdAsync(id);
        if (tournament == null)
        {
            return ApiErrorFactory.NotFound(this, $"No se encontro el torneo con ID {id}.");
        }

        return Ok(_mapper.Map<TournamentResponseDTO>(tournament));
    }

    [HttpPost]
    public async Task<ActionResult<TournamentResponseDTO>> Create([FromBody] TournamentRequestDTO dto)
    {
        var tournament = _mapper.Map<Tournament>(dto);
        var created = await _tournamentService.CreateAsync(tournament);
        var responseDto = _mapper.Map<TournamentResponseDTO>(created);

        return CreatedAtAction(nameof(GetById), new { id = responseDto.Id }, responseDto);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] TournamentRequestDTO dto)
    {
        var tournament = _mapper.Map<Tournament>(dto);
        await _tournamentService.UpdateAsync(id, tournament);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _tournamentService.DeleteAsync(id);
        return NoContent();
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDTO dto)
    {
        await _tournamentService.UpdateStatusAsync(id, dto.Status);
        return NoContent();
    }

    [HttpPost("{id:int}/teams")]
    public async Task<IActionResult> RegisterTeam(int id, [FromBody] RegisterTeamDTO dto)
    {
        await _tournamentService.RegisterTeamAsync(id, dto.TeamId);
        return Ok(new { message = "Equipo inscrito exitosamente" });
    }

    [HttpGet("{id:int}/teams")]
    public async Task<ActionResult<IEnumerable<TeamResponseDTO>>> GetTeams(int id)
    {
        var teams = await _tournamentService.GetTeamsByTournamentAsync(id);
        return Ok(_mapper.Map<IEnumerable<TeamResponseDTO>>(teams));
    }
}
