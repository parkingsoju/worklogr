using MediatR;
using Microsoft.EntityFrameworkCore;
using Worklogr.Api.Features.Auth.Me;
using Worklogr.Api.Shared.Auth;
using Worklogr.Api.Shared.Db;
using Worklogr.Api.Shared.Errors;

namespace Worklogr.Api.Features.Users.UpdateUser;

public class UpdateUserHandler(AppDbContext db, ICurrentUser currentUser)
    : IRequestHandler<UpdateUserCommand, MeResult>
{
    public async Task<MeResult> Handle(UpdateUserCommand cmd, CancellationToken ct)
    {
        var user = await db.Users.SingleOrDefaultAsync(u => u.Id == currentUser.Id, ct)
            ?? throw new NotFoundException("User not found.");

        if (cmd.Name is not null) user.Name = cmd.Name;
        if (cmd.Timezone is not null) user.Timezone = cmd.Timezone;
        if (cmd.DefaultLocationType is not null) user.DefaultLocationType = cmd.DefaultLocationType == "None" ? null : cmd.DefaultLocationType;
        if (cmd.WeekStartsOn is not null) user.WeekStartsOn = cmd.WeekStartsOn.Value;
        if (cmd.Theme is not null) user.Theme = cmd.Theme;
        if (cmd.AccentColor is not null) user.AccentColor = cmd.AccentColor;

        await db.SaveChangesAsync(ct);
        return new MeResult(user.Id, user.Name, user.Email, user.Timezone, user.DefaultLocationType, user.WeekStartsOn, user.Theme, user.AccentColor);
    }
}
