using MediatR;

namespace Worklogr.Api.Features.Logs.GetByDate;

public static class GetByDateEndpoint
{
    public static void MapGetByDate(this IEndpointRouteBuilder app) =>
        app.MapGet("/api/daily-logs/{date}", async (string date, IMediator mediator) =>
            Results.Ok(await mediator.Send(new GetByDateQuery(date))))
           .RequireAuthorization();
}
