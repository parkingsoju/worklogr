using Microsoft.EntityFrameworkCore;
using Worklogr.Api.Shared.Db;
using Worklogr.Api.Shared.Entities;

namespace Worklogr.Api.Shared.Sessions;

public static class DailyLogService
{
    public static DateOnly LocalDateFor(DateTime utcTime, string timezone)
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById(timezone);
        return DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(utcTime, tz));
    }

    // Upsert: find the daily log for userId+localDate or create a new Draft one
    public static async Task<DailyLog> GetOrCreateAsync(
        AppDbContext db,
        Guid userId,
        DateOnly localDate,
        CancellationToken ct = default)
    {
        var log = await db.DailyLogs
            .FirstOrDefaultAsync(l => l.UserId == userId && l.Date == localDate, ct);

        if (log is not null) return log;

        log = new DailyLog { Id = Guid.NewGuid(), UserId = userId, Date = localDate };
        db.DailyLogs.Add(log);
        return log;
    }
}
