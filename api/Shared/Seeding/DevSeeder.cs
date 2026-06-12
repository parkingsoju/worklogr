using Bogus;
using Microsoft.EntityFrameworkCore;
using Worklogr.Api.Shared.Auth;
using Worklogr.Api.Shared.Db;
using Worklogr.Api.Shared.Entities;

namespace Worklogr.Api.Shared.Seeding;

public static class DevSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Users.AnyAsync()) return;

        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = "Test User",
            Email = "test@local.dev",
            PasswordHash = PasswordHasher.Hash("test1234"),
            Timezone = "Asia/Manila",
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var faker = new Faker();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        for (var i = 29; i >= 0; i--)
        {
            var date = today.AddDays(-i);
            var log = new DailyLog
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Date = date,
                Status = i > 0 ? DailyLogStatus.Complete : DailyLogStatus.Draft,
                CompletedAt = i > 0 ? DateTime.UtcNow.AddDays(-i) : null,
            };
            db.DailyLogs.Add(log);

            var sessionCount = faker.Random.Int(1, 3);
            var startHour = 8;
            for (var s = 0; s < sessionCount; s++)
            {
                var start = new DateTime(date.Year, date.Month, date.Day, startHour, faker.Random.Int(0, 30), 0, DateTimeKind.Utc);
                var end = start.AddHours(faker.Random.Double(1.5, 4.0));
                db.WorkSessions.Add(new WorkSession
                {
                    Id = Guid.NewGuid(),
                    DailyLogId = log.Id,
                    UserId = user.Id,
                    StartTime = start,
                    EndTime = end,
                    LocationType = faker.PickRandom<LocationType>(),
                    Note = faker.Random.Bool(0.3f) ? faker.Lorem.Sentence() : null,
                });
                startHour = (int)end.Hour + 1;
            }
        }
        await db.SaveChangesAsync();
    }
}
