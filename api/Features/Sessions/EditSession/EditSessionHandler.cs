using MediatR;
using Microsoft.EntityFrameworkCore;
using Worklogr.Api.Shared.Auth;
using Worklogr.Api.Shared.Db;
using Worklogr.Api.Shared.Entities;
using Worklogr.Api.Shared.Errors;
using Worklogr.Api.Shared.Sessions;

namespace Worklogr.Api.Features.Sessions.EditSession;

public class EditSessionHandler(AppDbContext db, ICurrentUser currentUser)
    : IRequestHandler<EditSessionCommand, SessionDto>
{
    public async Task<SessionDto> Handle(EditSessionCommand cmd, CancellationToken ct)
    {
        var session = await db.WorkSessions
            .Include(s => s.DailyLog)
            .FirstOrDefaultAsync(s => s.Id == cmd.SessionId, ct)
            ?? throw new NotFoundException("Session not found.");

        if (session.UserId != currentUser.Id) throw new NotFoundException("Session not found.");
        if (session.DailyLog.Status == DailyLogStatus.Complete)
            throw new ConflictException("This log is marked complete. Reopen it to make changes.");

        // Rule 6: overlap check excluding this session
        if (await OverlapChecker.HasOverlapAsync(db, session.UserId, session.DailyLog.Date, cmd.StartTime, cmd.EndTime, session.Id, ct))
            throw new ConflictException("This session overlaps with an existing session.");

        session.StartTime = cmd.StartTime;
        session.EndTime = cmd.EndTime;
        session.LocationType = Enum.Parse<LocationType>(cmd.LocationType, ignoreCase: true);
        session.Note = cmd.Note;
        await db.SaveChangesAsync(ct);

        return new SessionDto(session.Id, session.StartTime, session.EndTime, session.LocationType.ToString(), session.Note);
    }
}
