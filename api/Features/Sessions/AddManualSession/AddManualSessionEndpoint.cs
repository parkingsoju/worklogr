using MediatR;

namespace Worklogr.Api.Features.Sessions.AddManualSession;

public static class AddManualSessionEndpoint
{
    public static void MapAddManualSession(this IEndpointRouteBuilder app) =>
        app.MapPost("/api/work-sessions", async (AddManualSessionCommand cmd, IMediator mediator) =>
            Results.Ok(await mediator.Send(cmd)))
           .RequireAuthorization();
}
