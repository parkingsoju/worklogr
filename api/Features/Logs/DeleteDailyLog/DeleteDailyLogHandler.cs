using MediatR;
using Microsoft.EntityFrameworkCore;
using Worklogr.Api.Shared.Auth;
using Worklogr.Api.Shared.Db;
using Worklogr.Api.Shared.Entities;
using Worklogr.Api.Shared.Errors;

namespace Worklogr.Api.Features.Logs.DeleteDailyLog;

public class DeleteDailyLogHandler(AppDbContext db, ICurrentUser currentUser)
    : IRequestHandler<DeleteDailyLogCommand>
{
    public async Task Handle(DeleteDailyLogCommand cmd, CancellationToken ct)
    {
        var log = await db.DailyLogs
            .Include(l => l.WorkSessions)
            .FirstOrDefaultAsync(l => l.Id == cmd.LogId, ct)
            ?? throw new NotFoundException("Log not found.");

        if (log.UserId != currentUser.Id) throw new NotFoundException("Log not found.");
        if (log.Status == DailyLogStatus.Complete)
            throw new ConflictException("This log is marked complete. Reopen it before deleting.");
        // Only a blank day can be removed — sessions are the real data; delete them first.
        if (log.WorkSessions.Count != 0)
            throw new ConflictException("Only an empty day can be deleted. Remove its sessions first.");

        db.DailyLogs.Remove(log);
        await db.SaveChangesAsync(ct);
    }
}
