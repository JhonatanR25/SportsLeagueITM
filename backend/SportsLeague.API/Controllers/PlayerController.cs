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
public class PlayerController : ControllerBase
{
    private readonly IPlayerService _playerService;
    private readonly IMapper _mapper;

    public PlayerController(IPlayerService playerService, IMapper mapper)
    {
        _playerService = playerService;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PlayerResponseDTO>>> GetAll()
    {
        var players = await _playerService.GetAllAsync();
        return Ok(_mapper.Map<IEnumerable<PlayerResponseDTO>>(players));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PlayerResponseDTO>> GetById(int id)
    {
        var player = await _playerService.GetByIdAsync(id);
        if (player == null)
        {
            return ApiErrorFactory.NotFound(this, $"No se encontro el jugador con ID {id}.");
        }

        return Ok(_mapper.Map<PlayerResponseDTO>(player));
    }

    [HttpPost]
    public async Task<ActionResult<PlayerResponseDTO>> Create([FromBody] PlayerRequestDTO dto)
    {
        var player = _mapper.Map<Player>(dto);
        var createdPlayer = await _playerService.CreateAsync(player);

        var result = await _playerService.GetByIdAsync(createdPlayer.Id);
        return CreatedAtAction(nameof(GetById), new { id = result!.Id }, _mapper.Map<PlayerResponseDTO>(result));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] PlayerRequestDTO dto)
    {
        var player = _mapper.Map<Player>(dto);
        await _playerService.UpdateAsync(id, player);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _playerService.DeleteAsync(id);
        return NoContent();
    }
}
