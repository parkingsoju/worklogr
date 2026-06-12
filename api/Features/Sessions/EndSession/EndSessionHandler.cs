using MediatR;
using Microsoft.EntityFrameworkCore;
using Worklogr.Api.Shared.Auth;
using Worklogr.Api.Shared.Db;
using Worklogr.Api.Shared.Errors;
using Worklogr.Api.Shared.Sessions;

namespace Worklogr.Api.Features.Sessions.EndSession;

public class EndSessionHandler(AppDbContext db, ICurrentUser currentUser)
    : IRequestHandler<EndSessionCommand, SessionDto>
{
    public async Task<SessionDto> Handle(EndSessionCommand cmd, CancellationToken ct)
    {
        var session = await db.WorkSessions.FindAsync([cmd.SessionId], ct)
            ?? throw new NotFoundException("Session not found.");

        if (session.UserId != currentUser.Id) throw new NotFoundException("Session not found.");
        if (session.EndTime is not null) throw new ConflictException("Session is already ended.");

        session.EndTime = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return new SessionDto(session.Id, session.StartTime, session.EndTime, session.LocationType.ToString(), session.Note);
    }
}
