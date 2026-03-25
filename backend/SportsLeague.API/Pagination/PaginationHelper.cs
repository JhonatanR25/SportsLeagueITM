namespace SportsLeague.API.Pagination;

public static class PaginationHelper
{
    private const int DefaultPageNumber = 1;
    private const int DefaultPageSize = 10;
    private const int MaxPageSize = 100;

    public static IReadOnlyList<T> Apply<T>(
        HttpResponse response,
        IEnumerable<T> items,
        int? pageNumber,
        int? pageSize)
    {
        var source = items.ToList();
        var totalCount = source.Count;

        if (!pageNumber.HasValue && !pageSize.HasValue)
        {
            AddHeaders(response, 1, totalCount == 0 ? 0 : totalCount, totalCount, totalCount == 0 ? 0 : 1);
            return source;
        }

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

        var totalPages = totalCount == 0
            ? 0
            : (int)Math.Ceiling(totalCount / (double)normalizedPageSize);

        var pagedItems = source
            .Skip((normalizedPageNumber - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .ToList();

        AddHeaders(response, normalizedPageNumber, normalizedPageSize, totalCount, totalPages);
        return pagedItems;
    }

    private static void AddHeaders(
        HttpResponse response,
        int pageNumber,
        int pageSize,
        int totalCount,
        int totalPages)
    {
        response.Headers["X-Page-Number"] = pageNumber.ToString();
        response.Headers["X-Page-Size"] = pageSize.ToString();
        response.Headers["X-Total-Count"] = totalCount.ToString();
        response.Headers["X-Total-Pages"] = totalPages.ToString();
    }
}
