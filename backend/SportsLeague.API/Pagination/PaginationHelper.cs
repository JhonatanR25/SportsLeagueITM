namespace SportsLeague.API.Pagination;

public static class PaginationHelper
{
    public const int DefaultPageNumber = 1;
    public const int DefaultPageSize = 10;
    public const int MaxPageSize = 100;

    public static (int PageNumber, int PageSize) Normalize(int? pageNumber, int? pageSize)
    {
        var normalizedPageNumber = pageNumber.GetValueOrDefault(DefaultPageNumber);
        var normalizedPageSize = pageSize.GetValueOrDefault(DefaultPageSize);

        if (normalizedPageNumber <= 0)
        {
            throw new ArgumentException("pageNumber debe ser mayor que cero.", nameof(pageNumber));
        }

        if (normalizedPageSize <= 0)
        {
            throw new ArgumentException("pageSize debe ser mayor que cero.", nameof(pageSize));
        }

        if (normalizedPageSize > MaxPageSize)
        {
            normalizedPageSize = MaxPageSize;
        }

        return (normalizedPageNumber, normalizedPageSize);
    }

    public static void AddHeaders(HttpResponse response, int pageNumber, int pageSize, int totalCount, int totalPages)
    {
        response.Headers["X-Page-Number"] = pageNumber.ToString();
        response.Headers["X-Page-Size"] = pageSize.ToString();
        response.Headers["X-Total-Count"] = totalCount.ToString();
        response.Headers["X-Total-Pages"] = totalPages.ToString();
    }
}
