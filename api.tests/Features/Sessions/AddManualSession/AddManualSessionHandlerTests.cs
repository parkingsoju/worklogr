using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Worklogr.Api.Features.Sessions.AddManualSession;
using Worklogr.Api.Shared.Auth;
using Worklogr.Api.Shared.Db;
using Worklogr.Api.Shared.Entities;
using Worklogr.Api.Shared.Errors;

namespace Worklogr.Api.Tests.Features.Sessions.AddManualSession;

public class AddManualSessionHandlerTests
{
    private static AppDbContext CreateDb()
    {
        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(opts);
    }

    private static ICurrentUser FakeUser(Guid id) =>
        Moq.Mock.Of<ICurrentUser>(u => u.Id == id && u.Email == "t@t.com");

    private static async Task<User> SeedUser(AppDbContext db)
    {
        var user = new User { Id = Guid.NewGuid(), Name = "Test", Email = "t@t.com", PasswordHash = "x", Timezone = "UTC" };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user;
    }

    [Fact]
    public async Task Creates_daily_log_automatically()
    {
        using var db = CreateDb();
        var user = await SeedUser(db);
        var start = new DateTime(2026, 6, 11, 9, 0, 0, DateTimeKind.Utc);
        var end = start.AddHours(3);

        var handler = new AddManualSessionHandler(db, FakeUser(user.Id));
        await handler.Handle(new AddManualSessionCommand(start, end, "Office", null), default);

        (await db.DailyLogs.CountAsync()).Should().Be(1);
        (await db.WorkSessions.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task Rejects_overlapping_session()
    {
        using var db = CreateDb();
        var user = await SeedUser(db);
        var log = new DailyLog { Id = Guid.NewGuid(), UserId = user.Id, Date = new DateOnly(2026, 6, 11) };
        db.DailyLogs.Add(log);
        db.WorkSessions.Add(new WorkSession
        {
            Id = Guid.NewGuid(), DailyLogId = log.Id, UserId = user.Id,
            StartTime = new DateTime(2026, 6, 11, 9, 0, 0, DateTimeKind.Utc),
            EndTime = new DateTime(2026, 6, 11, 12, 0, 0, DateTimeKind.Utc),
            LocationType = LocationType.Office,
        });
        await db.SaveChangesAsync();

        // Overlaps existing 9-12 session
        var start = new DateTime(2026, 6, 11, 11, 0, 0, DateTimeKind.Utc);
        var end = new DateTime(2026, 6, 11, 14, 0, 0, DateTimeKind.Utc);

        var handler = new AddManualSessionHandler(db, FakeUser(user.Id));
        var act = () => handler.Handle(new AddManualSessionCommand(start, end, "Remote", null), default);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*overlaps*");
    }
}
