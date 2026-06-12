using MediatR;

namespace Worklogr.Api.Features.Logs.MarkComplete;

public record MarkCompleteCommand(Guid LogId) : IRequest<LogStatusResult>;
public record LogStatusResult(Guid Id, string Status, DateTime? CompletedAt);
