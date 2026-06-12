using MediatR;
using Microsoft.EntityFrameworkCore;
using Worklogr.Api.Shared.Auth;
using Worklogr.Api.Shared.Db;
using Worklogr.Api.Shared.Entities;
using Worklogr.Api.Shared.Errors;
using Worklogr.Api.Shared.Sessions;

namespace Worklogr.Api.Features.Sessions.AddManualSession;

public class AddManualSessionHandler(AppDbContext db, ICurrentUser currentUser)
    : IRequestHandler<AddManualSessionCommand, SessionDto>
{
    public async Task<SessionDto> Handle(AddManualSessionCommand cmd, CancellationToken ct)
    {
        var userId = currentUser.Id;

        var user = await db.Users.SingleOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundException("User not found.");

        var localDate = DailyLogService.LocalDateFor(cmd.StartTime, user.Timezone);

        // Rule 6: no overlapping sessions
        if (await OverlapChecker.HasOverlapAsync(db, userId, localDate, cmd.StartTime, cmd.EndTime, ct: ct))
            throw new ConflictException("This session overlaps with an existing session.");

        var log = await DailyLogService.GetOrCreateAsync(db, userId, localDate, ct);

        var session = new WorkSession
        {
            Id = Guid.NewGuid(),
            DailyLogId = log.Id,
            UserId = userId,
            StartTime = cmd.StartTime,
            EndTime = cmd.EndTime,
            LocationType = Enum.Parse<LocationType>(cmd.LocationType, ignoreCase: true),
            Note = cmd.Note,
        };
        db.WorkSessions.Add(session);
        await db.SaveChangesAsync(ct);

        return new SessionDto(session.Id, session.StartTime, session.EndTime, session.LocationType.ToString(), session.Note);
    }
}
