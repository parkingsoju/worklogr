using MediatR;
using Worklogr.Api.Shared.Sessions;

namespace Worklogr.Api.Features.Sessions.EditSession;

public record EditSessionCommand(
    Guid SessionId,
    DateTime StartTime,
    DateTime EndTime,
    string LocationType,
    string? Note) : IRequest<SessionDto>;
