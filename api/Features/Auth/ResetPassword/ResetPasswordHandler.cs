using MediatR;
using Microsoft.EntityFrameworkCore;
using Worklogr.Api.Shared.Auth;
using Worklogr.Api.Shared.Db;
using Worklogr.Api.Shared.Errors;

namespace Worklogr.Api.Features.Auth.ResetPassword;

public class ResetPasswordHandler(AppDbContext db) : IRequestHandler<ResetPasswordCommand>
{
    public async Task Handle(ResetPasswordCommand cmd, CancellationToken ct)
    {
        var hash = TokenHasher.Hash(cmd.Token);
        var token = await db.PasswordResetTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == hash, ct);

        if (token is null || !token.IsValid)
            throw new ValidationException("This reset link is invalid or has expired.");

        token.User.PasswordHash = PasswordHasher.Hash(cmd.NewPassword);
        token.UsedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}
