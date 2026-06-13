using MediatR;
using Microsoft.EntityFrameworkCore;
using Worklogr.Api.Shared.Auth;
using Worklogr.Api.Shared.Db;
using Worklogr.Api.Shared.Errors;

namespace Worklogr.Api.Features.Auth.Me;

public class MeHandler(AppDbContext db, ICurrentUser currentUser) : IRequestHandler<MeQuery, MeResult>
{
    public async Task<MeResult> Handle(MeQuery _, CancellationToken ct)
    {
        var user = await db.Users.SingleOrDefaultAsync(u => u.Id == currentUser.Id, ct)
            ?? throw new NotFoundException("User not found.");
        return new MeResult(user.Id, user.Name, user.Email, user.Timezone, user.DefaultLocationType, user.WeekStartsOn, user.Theme, user.AccentColor);
    }
}
