using MediatR;

namespace Worklogr.Api.Features.Users.UpdateUser;

public static class UpdateUserEndpoint
{
    public static void MapUpdateUser(this IEndpointRouteBuilder app) =>
        app.MapPatch("/api/users/me", async (UpdateUserCommand cmd, IMediator mediator) =>
            Results.Ok(await mediator.Send(cmd)))
           .RequireAuthorization();
}
