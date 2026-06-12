using MediatR;
using Microsoft.EntityFrameworkCore;
using Worklogr.Api.Features.Logs.GetToday;
using Worklogr.Api.Shared.Auth;
using Worklogr.Api.Shared.Db;
using Worklogr.Api.Shared.Errors;
using Worklogr.Api.Shared.Sessions;

namespace Worklogr.Api.Features.Logs.GetByDate;

public class GetByDateHandler(AppDbContext db, ICurrentUser currentUser)
    : IRequestHandler<GetByDateQuery, TodayResult>
{
    public async Task<TodayResult> Handle(GetByDateQuery query, CancellationToken ct)
    {
        if (!DateOnly.TryParseExact(query.Date, "yyyy-MM-dd", out var localDate))
            throw new ValidationException("Invalid date format. Use yyyy-MM-dd.");

        var userId = currentUser.Id;

        var log = await db.DailyLogs
            .Include(l => l.WorkSessions)
            .FirstOrDefaultAsync(l => l.UserId == userId && l.Date == localDate, ct)
            ?? throw new NotFoundException($"No log found for {query.Date}.");

        var ordered = log.WorkSessions.OrderBy(s => s.StartTime).ToList();
        var active = ordered.FirstOrDefault(s => s.EndTime is null);
        var completed = ordered.Where(s => s.EndTime is not null)
            .Select(s => new SessionDto(s.Id, s.StartTime, s.EndTime, s.LocationType.ToString(), s.Note))
            .ToList();

        return new TodayResult(
            localDate, log.Id, log.Status.ToString(), log.Note,
            active is null ? null : new SessionDto(active.Id, active.StartTime, active.EndTime, active.LocationType.ToString(), active.Note),
            completed, null);
    }
}
