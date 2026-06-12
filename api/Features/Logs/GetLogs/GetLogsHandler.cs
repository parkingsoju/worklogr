using MediatR;
using Microsoft.EntityFrameworkCore;
using Worklogr.Api.Shared.Auth;
using Worklogr.Api.Shared.Db;
using Worklogr.Api.Shared.Entities;

namespace Worklogr.Api.Features.Logs.GetLogs;

public class GetLogsHandler(AppDbContext db, ICurrentUser currentUser)
    : IRequestHandler<GetLogsQuery, IList<LogSummaryDto>>
{
    public async Task<IList<LogSummaryDto>> Handle(GetLogsQuery query, CancellationToken ct)
    {
        var userId = currentUser.Id;

        var q = db.DailyLogs
            .Include(l => l.WorkSessions)
            .Where(l => l.UserId == userId);

        if (DateOnly.TryParseExact(query.From, "yyyy-MM-dd", out var from))
            q = q.Where(l => l.Date >= from);

        if (DateOnly.TryParseExact(query.To, "yyyy-MM-dd", out var to))
            q = q.Where(l => l.Date <= to);

        if (query.Status is "Draft" or "Complete")
            q = q.Where(l => l.Status == Enum.Parse<DailyLogStatus>(query.Status));

        var logs = await q.OrderByDescending(l => l.Date).ToListAsync(ct);

        return logs.Select(l => new LogSummaryDto(
            l.Id,
            l.Date,
            l.Status.ToString(),
            l.WorkSessions
                .Where(s => s.EndTime.HasValue)
                .Sum(s => (int)(s.EndTime!.Value - s.StartTime).TotalSeconds)
        )).ToList();
    }
}
