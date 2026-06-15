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

    [Fact]
    public async Task Default_start_is_now_and_not_manual()
    {
        using var db = CreateDb();
        var user = await SeedUser(db);

        var handler = new StartSessionHandler(db, FakeUser(user.Id));
        var result = await handler.Handle(new StartSessionCommand("Office", null), default);

        result.StartTime.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        var saved = await db.WorkSessions.SingleAsync(s => s.Id == result.Id);
        saved.StartTimeWasManual.Should().BeFalse();
    }

    [Fact]
    public async Task Backdated_start_is_honored_and_flagged_manual()
    {
        using var db = CreateDb();
        var user = await SeedUser(db);
        var backdated = DateTime.UtcNow.AddMinutes(-30);

        var handler = new StartSessionHandler(db, FakeUser(user.Id));
        var result = await handler.Handle(new StartSessionCommand("Office", null, backdated), default);

        result.StartTime.Should().BeCloseTo(backdated, TimeSpan.FromSeconds(1));
        var saved = await db.WorkSessions.SingleAsync(s => s.Id == result.Id);
        saved.StartTimeWasManual.Should().BeTrue();
    }

    [Fact]
    public async Task Rejects_future_start_time()
    {
        using var db = CreateDb();
        var user = await SeedUser(db);

        var handler = new StartSessionHandler(db, FakeUser(user.Id));
        var act = () => handler.Handle(
            new StartSessionCommand("Office", null, DateTime.UtcNow.AddHours(1)), default);

        await act.Should().ThrowAsync<ValidationException>().WithMessage("*future*");
    }

    [Fact]
    public async Task Rejects_start_time_not_today()
    {
        using var db = CreateDb();
        var user = await SeedUser(db);

        var handler = new StartSessionHandler(db, FakeUser(user.Id));
        var act = () => handler.Handle(
            new StartSessionCommand("Office", null, DateTime.UtcNow.AddDays(-1)), default);

        await act.Should().ThrowAsync<ValidationException>().WithMessage("*today*");
    }

    [Fact]
    public async Task Rejects_backdated_start_overlapping_completed_session()
    {
        using var db = CreateDb();
        var user = await SeedUser(db);
        var log = new DailyLog { Id = Guid.NewGuid(), UserId = user.Id, Date = DateOnly.FromDateTime(DateTime.UtcNow) };
        db.DailyLogs.Add(log);
        db.WorkSessions.Add(new WorkSession
        {
            Id = Guid.NewGuid(), DailyLogId = log.Id, UserId = user.Id,
            StartTime = DateTime.UtcNow.AddHours(-2), EndTime = DateTime.UtcNow.AddMinutes(-20),
            LocationType = LocationType.Office,
        });
        await db.SaveChangesAsync();

        var handler = new StartSessionHandler(db, FakeUser(user.Id));
        var act = () => handler.Handle(
            new StartSessionCommand("Office", null, DateTime.UtcNow.AddMinutes(-30)), default);

        await act.Should().ThrowAsync<ConflictException>().WithMessage("*overlaps*");
    }
}
