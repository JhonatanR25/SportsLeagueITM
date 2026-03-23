using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using SportsLeague.API.DTOs.Request;
using SportsLeague.API.DTOs.Response;
using SportsLeague.Domain.Entities;
using SportsLeague.Domain.Interfaces.Services;

namespace SportsLeague.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlayerController : ControllerBase
{
    private readonly IPlayerService _playerService;
    private readonly IMapper _mapper;
    private readonly ILogger<PlayerController> _logger;

    public PlayerController(
        IPlayerService playerService,
        IMapper mapper,
        ILogger<PlayerController> logger)
    {
        _playerService = playerService;
        _mapper = mapper;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PlayerResponseDTO>>> GetAll()
    {
        _logger.LogInformation("Request received to get all players");

        var players = await _playerService.GetAllAsync();
        var playersDto = _mapper.Map<IEnumerable<PlayerResponseDTO>>(players);

        _logger.LogInformation("Returning {Count} players", playersDto.Count());

        return Ok(playersDto);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PlayerResponseDTO>> GetById(int id)
    {
        _logger.LogInformation("Request received to get player with ID {PlayerId}", id);

        var player = await _playerService.GetByIdAsync(id);

        if (player == null)
        {
            _logger.LogWarning("Player with ID {PlayerId} not found", id);
            return NotFound(new { message = $"Jugador con ID {id} no encontrado" });
        }

        var playerDto = _mapper.Map<PlayerResponseDTO>(player);
        return Ok(playerDto);
    }

    [HttpGet("team/{teamId:int}")]
    public async Task<ActionResult<IEnumerable<PlayerResponseDTO>>> GetByTeam(int teamId)
    {
        _logger.LogInformation("Request received to get players for team ID {TeamId}", teamId);

        try
        {
            var players = await _playerService.GetByTeamAsync(teamId);
            var playersDto = _mapper.Map<IEnumerable<PlayerResponseDTO>>(players);

            _logger.LogInformation(
                "Returning {Count} players for team ID {TeamId}",
                playersDto.Count(),
                teamId);

            return Ok(playersDto);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Team with ID {TeamId} was not found", teamId);
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<PlayerResponseDTO>> Create([FromBody] PlayerRequestDTO dto)
    {
        _logger.LogInformation(
            "Request received to create player {FirstName} {LastName} for team ID {TeamId}",
            dto.FirstName,
            dto.LastName,
            dto.TeamId);

        try
        {
            var player = _mapper.Map<Player>(dto);
            var createdPlayer = await _playerService.CreateAsync(player);

            // Recargar con Team para que TeamName llegue correctamente en el response
            var playerWithTeam = await _playerService.GetByIdAsync(createdPlayer.Id);

            if (playerWithTeam == null)
            {
                _logger.LogError(
                    "Player with ID {PlayerId} was created but could not be reloaded",
                    createdPlayer.Id);

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new { message = "El jugador fue creado, pero no pudo cargarse para la respuesta." });
            }

            var responseDto = _mapper.Map<PlayerResponseDTO>(playerWithTeam);

            _logger.LogInformation("Player created successfully with ID {PlayerId}", responseDto.Id);

            return CreatedAtAction(
                nameof(GetById),
                new { id = responseDto.Id },
                responseDto);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Could not create player because the team was not found");
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Business validation failed while creating a player");
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult> Update(int id, [FromBody] PlayerRequestDTO dto)
    {
        _logger.LogInformation("Request received to update player with ID {PlayerId}", id);

        try
        {
            var player = _mapper.Map<Player>(dto);
            await _playerService.UpdateAsync(id, player);

            _logger.LogInformation("Player with ID {PlayerId} updated successfully", id);

            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Could not update player with ID {PlayerId}", id);
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Business validation failed while updating player ID {PlayerId}", id);
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        _logger.LogInformation("Request received to delete player with ID {PlayerId}", id);

        try
        {
            await _playerService.DeleteAsync(id);

            _logger.LogInformation("Player with ID {PlayerId} deleted successfully", id);

            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Could not delete player with ID {PlayerId}", id);
            return NotFound(new { message = ex.Message });
        }
    }
}