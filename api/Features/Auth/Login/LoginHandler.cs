using MediatR;
using Microsoft.EntityFrameworkCore;
using Worklogr.Api.Shared.Auth;
using Worklogr.Api.Shared.Db;
using Worklogr.Api.Shared.Errors;

namespace Worklogr.Api.Features.Auth.Login;

public class LoginHandler(AppDbContext db, JwtHelper jwt) : IRequestHandler<LoginCommand, LoginResult>
{
    public async Task<LoginResult> Handle(LoginCommand cmd, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == cmd.Email.ToLowerInvariant(), ct);

        // Deliberately generic — never reveal whether the email exists
        if (user is null || !PasswordHasher.Verify(cmd.Password, user.PasswordHash))
            throw new UnauthorizedException("Invalid email or password.");

        return new LoginResult(
            user.Id, user.Name, user.Email, user.Timezone,
            user.DefaultLocationType, user.WeekStartsOn, user.Theme, user.AccentColor, jwt.CreateToken(user));
    }
}
