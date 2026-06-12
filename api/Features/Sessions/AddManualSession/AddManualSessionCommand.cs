using MediatR;
using Worklogr.Api.Shared.Sessions;

namespace Worklogr.Api.Features.Sessions.AddManualSession;

public record AddManualSessionCommand(
    DateTime StartTime,
    DateTime EndTime,
    string LocationType,
    string? Note) : IRequest<SessionDto>;
