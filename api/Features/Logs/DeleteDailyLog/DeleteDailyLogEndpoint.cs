using MediatR;

namespace Worklogr.Api.Features.Logs.DeleteDailyLog;

public static class DeleteDailyLogEndpoint
{
    public static void MapDeleteDailyLog(this IEndpointRouteBuilder app) =>
        app.MapDelete("/api/daily-logs/{id:guid}", async (Guid id, IMediator mediator) =>
        {
            await mediator.Send(new DeleteDailyLogCommand(id));
            return Results.NoContent();
        }).RequireAuthorization();
}
