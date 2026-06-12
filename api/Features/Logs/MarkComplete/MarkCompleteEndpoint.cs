using MediatR;

namespace Worklogr.Api.Features.Logs.MarkComplete;

public static class MarkCompleteEndpoint
{
    public static void MapMarkComplete(this IEndpointRouteBuilder app) =>
        app.MapPost("/api/daily-logs/{id:guid}/complete", async (Guid id, IMediator mediator) =>
            Results.Ok(await mediator.Send(new MarkCompleteCommand(id))))
           .RequireAuthorization();
}
