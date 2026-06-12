using MediatR;
using Microsoft.EntityFrameworkCore;
using Worklogr.Api.Shared.Auth;
using Worklogr.Api.Shared.Db;
using Worklogr.Api.Shared.Errors;
using Worklogr.Api.Shared.Sessions;

namespace Worklogr.Api.Features.Logs.GetToday;

public class GetTodayHandler(AppDbContext db, ICurrentUser currentUser)
    : IRequestHandler<GetTodayQuery, TodayResult>
{
    public async Task<TodayResult> Handle(GetTodayQuery _, CancellationToken ct)
    {
        var userId = currentUser.Id;

        var user = await db.Users.SingleOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundException("User not found.");

        var localDate = DailyLogService.LocalDateFor(DateTime.UtcNow, user.Timezone);

        var log = await db.DailyLogs
            .Include(l => l.WorkSessions)
            .FirstOrDefaultAsync(l => l.UserId == userId && l.Date == localDate, ct);

        // Stale session: active session from a previous date (Rule 10)
        var stale = await db.WorkSessions
            .Include(s => s.DailyLog)
            .FirstOrDefaultAsync(s => s.UserId == userId && s.EndTime == null && s.DailyLog.Date < localDate, ct);

        if (log is null)
        {
            return new TodayResult(
                localDate, null, "Draft", null, null, [],
                stale is null ? null : new StaleSessionDto(stale.Id, stale.DailyLog.Date, stale.StartTime, stale.LocationType.ToString()));
        }

        var ordered = log.WorkSessions.OrderBy(s => s.StartTime).ToList();
        var active = ordered.FirstOrDefault(s => s.EndTime is null);
        var completed = ordered.Where(s => s.EndTime is not null).Select(Map).ToList();

        return new TodayResult(
            localDate,
            log.Id,
            log.Status.ToString(),
            log.Note,
            active is null ? null : Map(active),
            completed,
            stale is null ? null : new StaleSessionDto(stale.Id, stale.DailyLog.Date, stale.StartTime, stale.LocationType.ToString()));
    }

    private static SessionDto Map(Worklogr.Api.Shared.Entities.WorkSession s) =>
        new(s.Id, s.StartTime, s.EndTime, s.LocationType.ToString(), s.Note);
}
