using MediatR;

namespace Worklogr.Api.Features.Reports.GetSessionsExport;

public static class GetSessionsExportEndpoint
{
    public static void MapGetSessionsExport(this IEndpointRouteBuilder app) =>
        app.MapGet("/api/reports/sessions", async (string? from, string? to, IMediator mediator) =>
            Results.Ok(await mediator.Send(new GetSessionsExportQuery(from, to))))
           .RequireAuthorization();
}
