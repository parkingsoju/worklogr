using MediatR;
using Worklogr.Api.Shared.Sessions;

namespace Worklogr.Api.Features.Sessions.StartSession;

public record StartSessionCommand(string LocationType, string? Note) : IRequest<SessionDto>;
