using MediatR;

namespace Worklogr.Api.Features.Sessions.EndSession;

public static class EndSessionEndpoint
{
    public static void MapEndSession(this IEndpointRouteBuilder app) =>
        app.MapPost("/api/work-sessions/{id:guid}/end", async (Guid id, IMediator mediator) =>
            Results.Ok(await mediator.Send(new EndSessionCommand(id))))
           .RequireAuthorization();
}
