using MediatR;

namespace Worklogr.Api.Features.Logs.ReopenLog;

public static class ReopenLogEndpoint
{
    public static void MapReopenLog(this IEndpointRouteBuilder app) =>
        app.MapPost("/api/daily-logs/{id:guid}/reopen", async (Guid id, IMediator mediator) =>
            Results.Ok(await mediator.Send(new ReopenLogCommand(id))))
           .RequireAuthorization();
}
