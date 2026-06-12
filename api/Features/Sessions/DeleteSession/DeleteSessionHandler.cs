using MediatR;
using Microsoft.EntityFrameworkCore;
using Worklogr.Api.Shared.Auth;
using Worklogr.Api.Shared.Db;
using Worklogr.Api.Shared.Entities;
using Worklogr.Api.Shared.Errors;

namespace Worklogr.Api.Features.Sessions.DeleteSession;

public class DeleteSessionHandler(AppDbContext db, ICurrentUser currentUser) : IRequestHandler<DeleteSessionCommand>
{
    public async Task Handle(DeleteSessionCommand cmd, CancellationToken ct)
    {
        var session = await db.WorkSessions
            .Include(s => s.DailyLog)
            .FirstOrDefaultAsync(s => s.Id == cmd.SessionId, ct)
            ?? throw new NotFoundException("Session not found.");

        if (session.UserId != currentUser.Id) throw new NotFoundException("Session not found.");

        // Completed session requires a Draft log; active sessions can always be deleted (cancel)
        if (session.EndTime is not null && session.DailyLog.Status == DailyLogStatus.Complete)
            throw new ConflictException("This log is marked complete. Reopen it to make changes.");

        db.WorkSessions.Remove(session);
        await db.SaveChangesAsync(ct);
    }
}
