namespace FutbolStats.Api.Common.Models;

public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; }
    public int Page { get; }
    public int PageSize { get; }
    public int TotalCount { get; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasPreviousPage => Page > 1;
    public bool HasNextPage => Page < TotalPages;

    public PagedResult(IReadOnlyList<T> items, int page, int pageSize, int totalCount)
    {
        Items = items;
        Page = page;
        PageSize = pageSize;
        TotalCount = totalCount;
    }
}

public record PaginationParams(int Page = 1, int PageSize = 10)
{
    public int Page { get; init; } = Page < 1 ? 1 : Page;
    public int PageSize { get; init; } = PageSize < 1 ? 10 : PageSize > 100 ? 100 : PageSize;
    public int Skip => (Page - 1) * PageSize;
}
