using MediatR;

namespace Worklogr.Api.Features.Sessions.StartSession;

public static class StartSessionEndpoint
{
    public static void MapStartSession(this IEndpointRouteBuilder app) =>
        app.MapPost("/api/work-sessions/start", async (StartSessionCommand cmd, IMediator mediator) =>
            Results.Ok(await mediator.Send(cmd)))
           .RequireAuthorization();
}
