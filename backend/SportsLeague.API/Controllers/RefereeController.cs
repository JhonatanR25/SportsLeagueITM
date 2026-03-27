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
public class RefereeController : ControllerBase
{
    private readonly IRefereeService _refereeService;
    private readonly IMapper _mapper;

    public RefereeController(
        IRefereeService refereeService,
        IMapper mapper)
    {
        _refereeService = refereeService;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RefereeResponseDTO>>> GetAll(
        [FromQuery] int? pageNumber,
        [FromQuery] int? pageSize)
    {
        if (pageNumber.HasValue || pageSize.HasValue)
        {
            var (normalizedPageNumber, normalizedPageSize) = PaginationHelper.Normalize(pageNumber, pageSize);
            var pagedReferees = await _refereeService.GetPagedAsync(normalizedPageNumber, normalizedPageSize);
            PaginationHelper.AddHeaders(Response, pagedReferees.PageNumber, pagedReferees.PageSize, pagedReferees.TotalCount, pagedReferees.TotalPages);
            return Ok(_mapper.Map<IEnumerable<RefereeResponseDTO>>(pagedReferees.Items));
        }

        var referees = await _refereeService.GetAllAsync();
        return Ok(_mapper.Map<IEnumerable<RefereeResponseDTO>>(referees));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<RefereeResponseDTO>> GetById(int id)
    {
        var referee = await _refereeService.GetByIdAsync(id);
        if (referee == null)
        {
            return ApiErrorFactory.NotFound(this, $"No se encontro el arbitro con ID {id}.");
        }

        return Ok(_mapper.Map<RefereeResponseDTO>(referee));
    }

    [HttpPost]
    public async Task<ActionResult<RefereeResponseDTO>> Create([FromBody] RefereeRequestDTO dto)
    {
        var referee = _mapper.Map<Referee>(dto);
        var created = await _refereeService.CreateAsync(referee);
        var responseDto = _mapper.Map<RefereeResponseDTO>(created);
        return CreatedAtAction(nameof(GetById), new { id = responseDto.Id }, responseDto);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] RefereeRequestDTO dto)
    {
        var referee = _mapper.Map<Referee>(dto);
        await _refereeService.UpdateAsync(id, referee);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _refereeService.DeleteAsync(id);
        return NoContent();
    }
}
