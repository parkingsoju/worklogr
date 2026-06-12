using MediatR;
using Worklogr.Api.Shared.Sessions;

namespace Worklogr.Api.Features.Sessions.EndSession;

public record EndSessionCommand(Guid SessionId) : IRequest<SessionDto>;
