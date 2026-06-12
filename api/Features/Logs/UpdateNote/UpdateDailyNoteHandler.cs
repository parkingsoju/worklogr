using MediatR;
using Microsoft.EntityFrameworkCore;
using Worklogr.Api.Shared.Auth;
using Worklogr.Api.Shared.Db;
using Worklogr.Api.Shared.Errors;

namespace Worklogr.Api.Features.Logs.UpdateNote;

public class UpdateDailyNoteHandler(AppDbContext db, ICurrentUser currentUser)
    : IRequestHandler<UpdateDailyNoteCommand>
{
    public async Task Handle(UpdateDailyNoteCommand cmd, CancellationToken ct)
    {
        var log = await db.DailyLogs.FirstOrDefaultAsync(l => l.Id == cmd.LogId, ct)
            ?? throw new NotFoundException("Log not found.");

        if (log.UserId != currentUser.Id) throw new NotFoundException("Log not found.");

        log.Note = cmd.Note;
        await db.SaveChangesAsync(ct);
    }
}
