namespace Worklogr.Api.Shared.Entities;

public class WorkSession
{
    public Guid Id { get; set; }
    public Guid DailyLogId { get; set; }
    public Guid UserId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public LocationType LocationType { get; set; }
    public string? Note { get; set; }
    public bool StartTimeWasManual { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public DailyLog DailyLog { get; set; } = null!;
    public User User { get; set; } = null!;

    public bool IsActive => EndTime is null;
}

public enum LocationType { Office, Remote, Other }
