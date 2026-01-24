using FutbolStats.Api.Features.Players.Entities;

namespace FutbolStats.Api.Features.Countries.Entities;

public class Country
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? FlagUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<Player> Players { get; set; } = [];
}
