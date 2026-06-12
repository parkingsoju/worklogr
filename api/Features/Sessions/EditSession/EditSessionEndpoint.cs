using MediatR;

namespace Worklogr.Api.Features.Sessions.EditSession;

public static class EditSessionEndpoint
{
    public static void MapEditSession(this IEndpointRouteBuilder app) =>
        app.MapPut("/api/work-sessions/{id:guid}", async (Guid id, EditSessionBody body, IMediator mediator) =>
            Results.Ok(await mediator.Send(new EditSessionCommand(id, body.StartTime, body.EndTime, body.LocationType, body.Note))))
           .RequireAuthorization();
}

public record EditSessionBody(DateTime StartTime, DateTime EndTime, string LocationType, string? Note);
