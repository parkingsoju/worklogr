using MediatR;
using Microsoft.EntityFrameworkCore;
using Worklogr.Api.Shared.Auth;
using Worklogr.Api.Shared.Db;

namespace Worklogr.Api.Features.Reports.GetSessionsExport;

public class GetSessionsExportHandler(AppDbContext db, ICurrentUser currentUser)
    : IRequestHandler<GetSessionsExportQuery, IList<SessionExportDto>>
{
    public async Task<IList<SessionExportDto>> Handle(GetSessionsExportQuery query, CancellationToken ct)
    {
        var userId = currentUser.Id;

        var q = db.WorkSessions
            .Include(s => s.DailyLog)
            .Where(s => s.UserId == userId && s.EndTime.HasValue);

        if (DateOnly.TryParseExact(query.From, "yyyy-MM-dd", out var from))
            q = q.Where(s => s.DailyLog.Date >= from);

        if (DateOnly.TryParseExact(query.To, "yyyy-MM-dd", out var to))
            q = q.Where(s => s.DailyLog.Date <= to);

        var sessions = await q.OrderBy(s => s.DailyLog.Date).ThenBy(s => s.StartTime).ToListAsync(ct);

        return sessions.Select(s => new SessionExportDto(
            s.DailyLog.Date,
            s.StartTime,
            s.EndTime!.Value,
            (int)(s.EndTime.Value - s.StartTime).TotalSeconds,
            s.LocationType.ToString(),
            s.Note,
            s.DailyLog.Status.ToString(),
            s.DailyLog.Note
        )).ToList();
    }
}
