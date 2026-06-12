using Microsoft.EntityFrameworkCore;
using Worklogr.Api.Shared.Entities;

namespace Worklogr.Api.Shared.Db;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<DailyLog> DailyLogs => Set<DailyLog>();
    public DbSet<WorkSession> WorkSessions => Set<WorkSession>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.Email).IsRequired();
            e.Property(x => x.Name).IsRequired();
            e.Property(x => x.PasswordHash).IsRequired();
            e.Property(x => x.Timezone).HasDefaultValue("UTC");
            e.Property(x => x.WeekStartsOn).HasDefaultValue(1);
            e.Property(x => x.Theme).HasDefaultValue("system");
            e.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
            e.Property(x => x.UpdatedAt).HasDefaultValueSql("now()");
        });

        b.Entity<DailyLog>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.UserId, x.Date }).IsUnique();
            e.Property(x => x.Status).HasConversion<string>();
            e.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
            e.Property(x => x.UpdatedAt).HasDefaultValueSql("now()");
            e.HasOne(x => x.User).WithMany(x => x.DailyLogs).HasForeignKey(x => x.UserId);
        });

        b.Entity<WorkSession>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.LocationType).HasConversion<string>();
            e.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
            e.Property(x => x.UpdatedAt).HasDefaultValueSql("now()");
            e.Ignore(x => x.IsActive);
            e.HasOne(x => x.DailyLog).WithMany(x => x.WorkSessions).HasForeignKey(x => x.DailyLogId);
            e.HasOne(x => x.User).WithMany(x => x.WorkSessions).HasForeignKey(x => x.UserId);
        });

        b.Entity<PasswordResetToken>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TokenHash).IsUnique();
            e.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
            e.Ignore(x => x.IsValid);
            e.HasOne(x => x.User).WithMany(x => x.PasswordResetTokens).HasForeignKey(x => x.UserId);
        });
    }
}
