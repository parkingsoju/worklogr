using Microsoft.EntityFrameworkCore;
using Worklogr.Api.Shared.Db;

namespace Worklogr.Api.Shared.Sessions;

public static class OverlapChecker
{
    // Two intervals [s1,e1] and [s2,e2] overlap iff s1 < e2 && s2 < e1
    public static async Task<bool> HasOverlapAsync(
        AppDbContext db,
        Guid userId,
        DateOnly date,
        DateTime startTime,
        DateTime endTime,
        Guid? excludeSessionId = null,
        CancellationToken ct = default)
    {
        var query = db.WorkSessions
            .Where(s => s.UserId == userId && s.DailyLog.Date == date && s.EndTime.HasValue);

        if (excludeSessionId.HasValue)
            query = query.Where(s => s.Id != excludeSessionId.Value);

        return await query.AnyAsync(s => s.StartTime < endTime && s.EndTime! > startTime, ct);
    }
}
