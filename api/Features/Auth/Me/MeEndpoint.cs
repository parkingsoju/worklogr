using MediatR;

namespace Worklogr.Api.Features.Auth.Me;

public static class MeEndpoint
{
    public static void MapMe(this IEndpointRouteBuilder app) =>
        app.MapGet("/api/auth/me", async (IMediator mediator) =>
            Results.Ok(await mediator.Send(new MeQuery())))
           .RequireAuthorization();
}
