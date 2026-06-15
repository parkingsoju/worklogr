using MediatR;
using Microsoft.EntityFrameworkCore;
using Worklogr.Api.Shared.Auth;
using Worklogr.Api.Shared.Db;
using Worklogr.Api.Shared.Entities;
using Worklogr.Api.Shared.Errors;
using Worklogr.Api.Shared.Sessions;

namespace Worklogr.Api.Features.Sessions.StartSession;

public class StartSessionHandler(AppDbContext db, ICurrentUser currentUser)
    : IRequestHandler<StartSessionCommand, SessionDto>
{
    public async Task<SessionDto> Handle(StartSessionCommand cmd, CancellationToken ct)
    {
        var userId = currentUser.Id;

        var user = await db.Users.SingleOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundException("User not found.");

        // Rule 3: only one active session at a time
        var hasActive = await db.WorkSessions.AnyAsync(s => s.UserId == userId && s.EndTime == null, ct);
        if (hasActive) throw new ConflictException("You already have an active session. End it before starting a new one.");

        var now = DateTime.UtcNow;
        var isManual = cmd.StartTime is not null;
        var startTime = cmd.StartTime ?? now;

        if (isManual)
        {
            if (startTime > now)
                throw new ValidationException("Start time can't be in the future.");
            if (DailyLogService.LocalDateFor(startTime, user.Timezone)
                != DailyLogService.LocalDateFor(now, user.Timezone))
                throw new ValidationException("Start time must be earlier today.");
        }

        var localDate = DailyLogService.LocalDateFor(startTime, user.Timezone);

        // Rule 6: a backdated start can't fall inside an already-completed session today
        if (isManual && await OverlapChecker.HasOverlapAsync(db, userId, localDate, startTime, now, ct: ct))
            throw new ConflictException("This start time overlaps with an existing session.");

        var log = await DailyLogService.GetOrCreateAsync(db, userId, localDate, ct);

        var locationType = Enum.Parse<LocationType>(cmd.LocationType, ignoreCase: true);
        var session = new WorkSession
        {
            Id = Guid.NewGuid(),
            DailyLogId = log.Id,
            UserId = userId,
            StartTime = startTime,
            LocationType = locationType,
            Note = cmd.Note,
            StartTimeWasManual = isManual,
        };
        db.WorkSessions.Add(session);
        await db.SaveChangesAsync(ct);

        return new SessionDto(session.Id, session.StartTime, session.EndTime, session.LocationType.ToString(), session.Note);
    }
}
