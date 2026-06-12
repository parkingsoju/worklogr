using MediatR;

namespace Worklogr.Api.Features.Logs.GetLogs;

public static class GetLogsEndpoint
{
    public static void MapGetLogs(this IEndpointRouteBuilder app) =>
        app.MapGet("/api/daily-logs", async (string? from, string? to, string? status, IMediator mediator) =>
            Results.Ok(await mediator.Send(new GetLogsQuery(from, to, status))))
           .RequireAuthorization();
}
