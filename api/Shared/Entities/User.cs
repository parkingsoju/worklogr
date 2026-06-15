namespace Worklogr.Api.Shared.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Timezone { get; set; } = "Asia/Manila";
    public string? DefaultLocationType { get; set; }  // null = no default
    public int WeekStartsOn { get; set; } = 1;        // 1 = Monday, 0 = Sunday
    public string Theme { get; set; } = "system";
    public string AccentColor { get; set; } = "teal";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<DailyLog> DailyLogs { get; set; } = [];
    public ICollection<WorkSession> WorkSessions { get; set; } = [];
    public ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = [];
}
