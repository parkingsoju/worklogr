using MediatR;
using Microsoft.EntityFrameworkCore;
using Worklogr.Api.Shared.Auth;
using Worklogr.Api.Shared.Db;
using Worklogr.Api.Shared.Email;
using Worklogr.Api.Shared.Entities;

namespace Worklogr.Api.Features.Auth.ForgotPassword;

public class ForgotPasswordHandler(AppDbContext db, ResendClient email, IConfiguration config)
    : IRequestHandler<ForgotPasswordCommand>
{
    public async Task Handle(ForgotPasswordCommand cmd, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == cmd.Email.ToLowerInvariant(), ct);
        if (user is null) return; // Always succeed — never reveal whether the email exists

        var rawToken = TokenHasher.GenerateRawToken();
        db.PasswordResetTokens.Add(new PasswordResetToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = TokenHasher.Hash(rawToken),
            ExpiresAt = DateTime.UtcNow.AddHours(1),
        });
        await db.SaveChangesAsync(ct);

        var frontendUrl = config["App:FrontendUrl"] ?? "http://localhost:5173";
        var link = $"{frontendUrl}/reset-password?token={rawToken}";
        await email.SendAsync(user.Email, "Reset your Worklogr password",
            $"<p>Click the link below to reset your password. It expires in 1 hour.</p><p><a href=\"{link}\">{link}</a></p>");
    }
}
