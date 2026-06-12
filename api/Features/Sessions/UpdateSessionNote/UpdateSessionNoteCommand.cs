using MediatR;

namespace Worklogr.Api.Features.Sessions.UpdateSessionNote;

public record UpdateSessionNoteCommand(Guid SessionId, string? Note) : IRequest;
