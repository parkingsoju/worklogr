using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Worklogr.Api.Features.Logs.DeleteDailyLog;
using Worklogr.Api.Shared.Auth;
using Worklogr.Api.Shared.Db;
using Worklogr.Api.Shared.Entities;
using Worklogr.Api.Shared.Errors;

namespace Worklogr.Api.Tests.Features.Logs.DeleteDailyLog;

public class DeleteDailyLogHandlerTests
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
        var user = new User { Id = Guid.NewGuid(), Name = "Test", Email = "t@t.com", PasswordHash = "x", Timezone = "Asia/Manila" };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user;
    }

    private static DailyLog AddLog(AppDbContext db, Guid userId, DailyLogStatus status = DailyLogStatus.Draft)
    {
        var log = new DailyLog { Id = Guid.NewGuid(), UserId = userId, Date = DateOnly.FromDateTime(DateTime.UtcNow), Status = status };
        db.DailyLogs.Add(log);
        return log;
    }

    [Fact]
    public async Task Deletes_empty_draft_log()
    {
        using var db = CreateDb();
        var user = await SeedUser(db);
        var log = AddLog(db, user.Id);
        await db.SaveChangesAsync();

        var handler = new DeleteDailyLogHandler(db, FakeUser(user.Id));
        await handler.Handle(new DeleteDailyLogCommand(log.Id), default);

        (await db.DailyLogs.AnyAsync(l => l.Id == log.Id)).Should().BeFalse();
    }

    [Fact]
    public async Task Rejects_when_log_has_sessions()
    {
        using var db = CreateDb();
        var user = await SeedUser(db);
        var log = AddLog(db, user.Id);
        db.WorkSessions.Add(new WorkSession
        {
            Id = Guid.NewGuid(), DailyLogId = log.Id, UserId = user.Id,
            StartTime = DateTime.UtcNow.AddHours(-1), EndTime = DateTime.UtcNow, LocationType = LocationType.Office,
        });
        await db.SaveChangesAsync();

        var handler = new DeleteDailyLogHandler(db, FakeUser(user.Id));
        var act = () => handler.Handle(new DeleteDailyLogCommand(log.Id), default);

        await act.Should().ThrowAsync<ConflictException>().WithMessage("*empty*");
        (await db.DailyLogs.AnyAsync(l => l.Id == log.Id)).Should().BeTrue();
    }

    [Fact]
    public async Task Rejects_when_complete()
    {
        using var db = CreateDb();
        var user = await SeedUser(db);
        var log = AddLog(db, user.Id, DailyLogStatus.Complete);
        await db.SaveChangesAsync();

        var handler = new DeleteDailyLogHandler(db, FakeUser(user.Id));
        var act = () => handler.Handle(new DeleteDailyLogCommand(log.Id), default);

        await act.Should().ThrowAsync<ConflictException>().WithMessage("*complete*");
    }

    [Fact]
    public async Task Rejects_when_not_owned()
    {
        using var db = CreateDb();
        var owner = await SeedUser(db);
        var log = AddLog(db, owner.Id);
        await db.SaveChangesAsync();

        var handler = new DeleteDailyLogHandler(db, FakeUser(Guid.NewGuid())); // different user
        var act = () => handler.Handle(new DeleteDailyLogCommand(log.Id), default);

        await act.Should().ThrowAsync<NotFoundException>();
        (await db.DailyLogs.AnyAsync(l => l.Id == log.Id)).Should().BeTrue();
    }
}
