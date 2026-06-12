using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Worklogr.Api.Features.Sessions.StartSession;
using Worklogr.Api.Shared.Auth;
using Worklogr.Api.Shared.Db;
using Worklogr.Api.Shared.Entities;
using Worklogr.Api.Shared.Errors;

namespace Worklogr.Api.Tests.Features.Sessions.StartSession;

public class StartSessionHandlerTests
{
    private static AppDbContext CreateDb()
    {
        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(opts);
    }

    private static ICurrentUser FakeUser(Guid id)
    {
        var mock = Moq.Mock.Of<ICurrentUser>(u => u.Id == id && u.Email == "test@test.com");
        return mock;
    }

    private static async Task<User> SeedUser(AppDbContext db)
    {
        var user = new User { Id = Guid.NewGuid(), Name = "Test", Email = "t@t.com", PasswordHash = "x", Timezone = "UTC" };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user;
    }

    [Fact]
    public async Task Rejects_when_active_session_exists()
    {
        using var db = CreateDb();
        var user = await SeedUser(db);
        var log = new DailyLog { Id = Guid.NewGuid(), UserId = user.Id, Date = DateOnly.FromDateTime(DateTime.UtcNow) };
        db.DailyLogs.Add(log);
        db.WorkSessions.Add(new WorkSession
        {
            Id = Guid.NewGuid(), DailyLogId = log.Id, UserId = user.Id,
            StartTime = DateTime.UtcNow.AddHours(-1), LocationType = LocationType.Office,
        });
        await db.SaveChangesAsync();

        var handler = new StartSessionHandler(db, FakeUser(user.Id));
        var act = () => handler.Handle(new StartSessionCommand("Office", null), default);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*active session*");
    }

    [Fact]
    public async Task Creates_daily_log_automatically()
    {
        using var db = CreateDb();
        var user = await SeedUser(db);

        var handler = new StartSessionHandler(db, FakeUser(user.Id));
        var result = await handler.Handle(new StartSessionCommand("Remote", null), default);

        var logs = await db.DailyLogs.Where(l => l.UserId == user.Id).ToListAsync();
        logs.Should().HaveCount(1);
        result.EndTime.Should().BeNull();
    }
}
