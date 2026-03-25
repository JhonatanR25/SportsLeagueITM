using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using SportsLeague.API.DTOs.Request;
using SportsLeague.API.DTOs.Response;
using SportsLeague.API.Responses;
using SportsLeague.Domain.Entities;
using SportsLeague.Domain.Enums;
using SportsLeague.Domain.Interfaces.Services;

namespace SportsLeague.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MatchController : ControllerBase
{
    private readonly IMatchService _matchService;
    private readonly IMapper _mapper;

    public MatchController(IMatchService matchService, IMapper mapper)
    {
        _matchService = matchService;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MatchResponseDTO>>> GetAll(
        [FromQuery] int? tournamentId,
        [FromQuery] MatchStatus? status,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        var matches = tournamentId.HasValue || status.HasValue || fromDate.HasValue || toDate.HasValue
            ? await _matchService.GetFilteredAsync(tournamentId, status, fromDate, toDate)
            : await _matchService.GetAllAsync();

        return Ok(_mapper.Map<IEnumerable<MatchResponseDTO>>(matches));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<MatchResponseDTO>> GetById(int id)
    {
        var match = await _matchService.GetByIdAsync(id);
        if (match == null)
        {
            return ApiErrorFactory.NotFound(this, $"No se encontro el partido con ID {id}.");
        }

        return Ok(_mapper.Map<MatchResponseDTO>(match));
    }

    [HttpPost]
    public async Task<ActionResult<MatchResponseDTO>> Create([FromBody] MatchRequestDTO dto)
    {
        var match = _mapper.Map<Match>(dto);
        var created = await _matchService.CreateAsync(match);
        var loadedMatch = await _matchService.GetByIdAsync(created.Id);
        var response = _mapper.Map<MatchResponseDTO>(loadedMatch ?? created);
        return CreatedAtAction(nameof(GetById), new { id = response.Id }, response);
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] MatchUpdateStatusDTO dto)
    {
        await _matchService.UpdateStatusAsync(id, dto.Status);
        return NoContent();
    }

    [HttpPatch("{id:int}/score")]
    public async Task<IActionResult> UpdateScore(int id, [FromBody] MatchUpdateScoreDTO dto)
    {
        await _matchService.UpdateScoreAsync(id, dto.HomeScore, dto.AwayScore, dto.IsFinalScore);
        return NoContent();
    }
}
