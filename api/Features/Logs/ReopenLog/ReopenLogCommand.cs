using MediatR;
using Worklogr.Api.Features.Logs.MarkComplete;

namespace Worklogr.Api.Features.Logs.ReopenLog;

public record ReopenLogCommand(Guid LogId) : IRequest<LogStatusResult>;
