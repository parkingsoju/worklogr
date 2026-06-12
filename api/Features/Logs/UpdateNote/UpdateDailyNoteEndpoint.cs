using MediatR;

namespace Worklogr.Api.Features.Logs.UpdateNote;

public static class UpdateDailyNoteEndpoint
{
    public static void MapUpdateDailyNote(this IEndpointRouteBuilder app) =>
        app.MapPatch("/api/daily-logs/{id:guid}", async (Guid id, UpdateNoteBody body, IMediator mediator) =>
        {
            await mediator.Send(new UpdateDailyNoteCommand(id, body.Note));
            return Results.NoContent();
        })
        .RequireAuthorization();
}

public record UpdateNoteBody(string? Note);
