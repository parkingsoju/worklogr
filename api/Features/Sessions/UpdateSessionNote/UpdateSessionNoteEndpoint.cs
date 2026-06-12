using MediatR;

namespace Worklogr.Api.Features.Sessions.UpdateSessionNote;

public static class UpdateSessionNoteEndpoint
{
    public static void MapUpdateSessionNote(this IEndpointRouteBuilder app) =>
        app.MapPatch("/api/work-sessions/{id:guid}", async (Guid id, UpdateSessionNoteBody body, IMediator mediator) =>
        {
            await mediator.Send(new UpdateSessionNoteCommand(id, body.Note));
            return Results.NoContent();
        })
        .RequireAuthorization();
}

public record UpdateSessionNoteBody(string? Note);
