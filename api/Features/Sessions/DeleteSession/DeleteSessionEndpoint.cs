using MediatR;

namespace Worklogr.Api.Features.Sessions.DeleteSession;

public static class DeleteSessionEndpoint
{
    public static void MapDeleteSession(this IEndpointRouteBuilder app) =>
        app.MapDelete("/api/work-sessions/{id:guid}", async (Guid id, IMediator mediator) =>
        {
            await mediator.Send(new DeleteSessionCommand(id));
            return Results.NoContent();
        })
        .RequireAuthorization();
}
