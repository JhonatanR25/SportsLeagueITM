using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using SportsLeague.API.DTOs.Request;
using SportsLeague.API.DTOs.Response;
using SportsLeague.API.Pagination;
using SportsLeague.API.Responses;
using SportsLeague.Domain.Entities;
using SportsLeague.Domain.Interfaces.Services;

namespace SportsLeague.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TeamController : ControllerBase
{
    private readonly ITeamService _teamService;
    private readonly IMapper _mapper;

    public TeamController(ITeamService teamService, IMapper mapper)
    {
        _teamService = teamService;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TeamResponseDTO>>> GetAll(
        [FromQuery] int? pageNumber,
        [FromQuery] int? pageSize)
    {
        var teams = await _teamService.GetAllAsync();
        var mappedTeams = _mapper.Map<IEnumerable<TeamResponseDTO>>(teams);
        var response = PaginationHelper.Apply(Response, mappedTeams, pageNumber, pageSize);
        return Ok(response);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TeamResponseDTO>> GetById(int id)
    {
        var team = await _teamService.GetByIdAsync(id);

        if (team is null)
        {
            return ApiErrorFactory.NotFound(this, $"No se encontro el equipo con ID {id}.");
        }

        var response = _mapper.Map<TeamResponseDTO>(team);
        return Ok(response);
    }

    [HttpPost]
    public async Task<ActionResult<TeamResponseDTO>> Create([FromBody] TeamRequestDTO dto)
    {
        var team = _mapper.Map<Team>(dto);
        var createdTeam = await _teamService.CreateAsync(team);
        var response = _mapper.Map<TeamResponseDTO>(createdTeam);

        return CreatedAtAction(nameof(GetById), new { id = response.Id }, response);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] TeamRequestDTO dto)
    {
        var team = _mapper.Map<Team>(dto);
        await _teamService.UpdateAsync(id, team);

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _teamService.DeleteAsync(id);
        return NoContent();
    }
}
