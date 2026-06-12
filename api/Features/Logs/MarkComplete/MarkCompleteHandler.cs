using MediatR;
using Microsoft.EntityFrameworkCore;
using Worklogr.Api.Shared.Auth;
using Worklogr.Api.Shared.Db;
using Worklogr.Api.Shared.Entities;
using Worklogr.Api.Shared.Errors;

namespace Worklogr.Api.Features.Logs.MarkComplete;

public class MarkCompleteHandler(AppDbContext db, ICurrentUser currentUser)
    : IRequestHandler<MarkCompleteCommand, LogStatusResult>
{
    public async Task<LogStatusResult> Handle(MarkCompleteCommand cmd, CancellationToken ct)
    {
        var log = await db.DailyLogs
            .Include(l => l.WorkSessions)
            .FirstOrDefaultAsync(l => l.Id == cmd.LogId, ct)
            ?? throw new NotFoundException("Log not found.");

        if (log.UserId != currentUser.Id) throw new NotFoundException("Log not found.");
        if (log.Status == DailyLogStatus.Complete) throw new ConflictException("Log is already complete.");

        // Rule 9: cannot complete with an active session
        if (log.WorkSessions.Any(s => s.EndTime is null))
            throw new ConflictException("You have an active session. End it before marking the day complete.");

        log.Status = DailyLogStatus.Complete;
        log.CompletedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return new LogStatusResult(log.Id, log.Status.ToString(), log.CompletedAt);
    }
}
