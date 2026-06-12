using MediatR;
using Microsoft.EntityFrameworkCore;
using Worklogr.Api.Shared.Auth;
using Worklogr.Api.Shared.Db;
using Worklogr.Api.Shared.Entities;
using Worklogr.Api.Shared.Errors;

namespace Worklogr.Api.Features.Sessions.UpdateSessionNote;

public class UpdateSessionNoteHandler(AppDbContext db, ICurrentUser currentUser)
    : IRequestHandler<UpdateSessionNoteCommand>
{
    public async Task Handle(UpdateSessionNoteCommand cmd, CancellationToken ct)
    {
        var session = await db.WorkSessions
            .Include(s => s.DailyLog)
            .FirstOrDefaultAsync(s => s.Id == cmd.SessionId, ct)
            ?? throw new NotFoundException("Session not found.");

        if (session.UserId != currentUser.Id) throw new NotFoundException("Session not found.");

        if (session.DailyLog.Status == DailyLogStatus.Complete)
            throw new ConflictException("This log is marked complete. Reopen it to make changes.");

        session.Note = cmd.Note;
        await db.SaveChangesAsync(ct);
    }
}
