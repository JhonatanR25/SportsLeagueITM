namespace SportsLeague.API.Responses;

public sealed class ApiErrorResponse
{
    public int Status { get; init; }
    public string Message { get; init; } = string.Empty;
    public string? Detail { get; init; }
    public string TraceId { get; init; } = string.Empty;
}
