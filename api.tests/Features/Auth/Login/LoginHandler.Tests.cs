using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Worklogr.Api.Features.Auth.Login;
using Worklogr.Api.Shared.Auth;
using Worklogr.Api.Shared.Db;
using Worklogr.Api.Shared.Entities;
using Worklogr.Api.Shared.Errors;

namespace Worklogr.Api.Tests.Features.Auth.Login;

public class LoginHandlerTests
{
    private static AppDbContext CreateDb()
    {
        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(opts);
    }

    private static JwtHelper CreateJwt() => new(new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Secret"] = "test-secret-that-is-at-least-32-characters-long!!",
            ["Jwt:Issuer"] = "worklogr",
            ["Jwt:Audience"] = "worklogr",
            ["Jwt:ExpiryDays"] = "7",
        })
        .Build());

    private static async Task<User> SeedUserAsync(AppDbContext db)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = "Test User",
            Email = "test@example.com",
            PasswordHash = PasswordHasher.Hash("correct-password"),
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user;
    }

    [Fact]
    public async Task Valid_credentials_return_token()
    {
        using var db = CreateDb();
        await SeedUserAsync(db);
        var handler = new LoginHandler(db, CreateJwt());

        var result = await handler.Handle(new LoginCommand("test@example.com", "correct-password"), default);

        result.Token.Should().NotBeNullOrEmpty();
        result.Email.Should().Be("test@example.com");
    }

    [Fact]
    public async Task Wrong_password_throws_unauthorized()
    {
        using var db = CreateDb();
        await SeedUserAsync(db);
        var handler = new LoginHandler(db, CreateJwt());

        var act = () => handler.Handle(new LoginCommand("test@example.com", "wrong-password"), default);

        await act.Should().ThrowAsync<UnauthorizedException>()
            .WithMessage("Invalid email or password.");
    }

    [Fact]
    public async Task Unknown_email_throws_same_message_as_wrong_password()
    {
        using var db = CreateDb();
        var handler = new LoginHandler(db, CreateJwt());

        var act = () => handler.Handle(new LoginCommand("nobody@example.com", "any-password"), default);

        // Same error message regardless — prevents email enumeration
        await act.Should().ThrowAsync<UnauthorizedException>()
            .WithMessage("Invalid email or password.");
    }
}
