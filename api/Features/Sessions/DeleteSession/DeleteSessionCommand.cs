using MediatR;

namespace Worklogr.Api.Features.Sessions.DeleteSession;

public record DeleteSessionCommand(Guid SessionId) : IRequest;
