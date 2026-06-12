using MediatR;

namespace Worklogr.Api.Features.Logs.UpdateNote;

public record UpdateDailyNoteCommand(Guid LogId, string? Note) : IRequest;
