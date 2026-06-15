using MediatR;
using Microsoft.EntityFrameworkCore;
using Worklogr.Api.Shared.Auth;
using Worklogr.Api.Shared.Db;
using Worklogr.Api.Shared.Entities;
using Worklogr.Api.Shared.Errors;

namespace Worklogr.Api.Features.Auth.Register;

public class RegisterHandler(AppDbContext db) : IRequestHandler<RegisterCommand, RegisterResult>
{
    public async Task<RegisterResult> Handle(RegisterCommand cmd, CancellationToken ct)
    {
        var email = cmd.Email.ToLowerInvariant();

        if (await db.Users.AnyAsync(u => u.Email == email, ct))
            throw new ConflictException("Email is already registered.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = cmd.Name,
            Email = email,
            PasswordHash = PasswordHasher.Hash(cmd.Password),
            Timezone = ResolveTimezone(cmd.Timezone),
        };
        db.Users.Add(user);
        await db.SaveChangesAsync(ct);
        return new RegisterResult(user.Id, user.Name, user.Email);
    }

    // Trust the browser-sent IANA zone, but never let a bad string through —
    // FindSystemTimeZoneById throws on garbage, which would 500 the signup.
    private static string ResolveTimezone(string? tz) =>
        !string.IsNullOrWhiteSpace(tz) && TimeZoneInfo.TryFindSystemTimeZoneById(tz, out _)
            ? tz
            : "Asia/Manila";
}
