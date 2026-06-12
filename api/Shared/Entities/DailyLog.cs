namespace Worklogr.Api.Shared.Entities;

public class DailyLog
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public DateOnly Date { get; set; }
    public DailyLogStatus Status { get; set; } = DailyLogStatus.Draft;
    public string? Note { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public User User { get; set; } = null!;
    public ICollection<WorkSession> WorkSessions { get; set; } = [];
}

public enum DailyLogStatus { Draft, Complete }
