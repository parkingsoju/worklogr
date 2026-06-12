using MediatR;
using Microsoft.EntityFrameworkCore;
using Worklogr.Api.Features.Logs.MarkComplete;
using Worklogr.Api.Shared.Auth;
using Worklogr.Api.Shared.Db;
using Worklogr.Api.Shared.Entities;
using Worklogr.Api.Shared.Errors;

namespace Worklogr.Api.Features.Logs.ReopenLog;

public class ReopenLogHandler(AppDbContext db, ICurrentUser currentUser)
    : IRequestHandler<ReopenLogCommand, LogStatusResult>
{
    public async Task<LogStatusResult> Handle(ReopenLogCommand cmd, CancellationToken ct)
    {
        var log = await db.DailyLogs.FirstOrDefaultAsync(l => l.Id == cmd.LogId, ct)
            ?? throw new NotFoundException("Log not found.");

        if (log.UserId != currentUser.Id) throw new NotFoundException("Log not found.");
        if (log.Status == DailyLogStatus.Draft) throw new ConflictException("Log is already open.");

        log.Status = DailyLogStatus.Draft;
        log.CompletedAt = null;
        await db.SaveChangesAsync(ct);

        return new LogStatusResult(log.Id, log.Status.ToString(), log.CompletedAt);
    }
}
