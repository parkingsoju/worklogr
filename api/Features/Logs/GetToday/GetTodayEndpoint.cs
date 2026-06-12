using MediatR;

namespace Worklogr.Api.Features.Logs.GetToday;

public static class GetTodayEndpoint
{
    public static void MapGetToday(this IEndpointRouteBuilder app) =>
        app.MapGet("/api/daily-logs/today", async (IMediator mediator) =>
            Results.Ok(await mediator.Send(new GetTodayQuery())))
           .RequireAuthorization();
}
