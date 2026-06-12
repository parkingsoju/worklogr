using MediatR;

namespace Worklogr.Api.Features.Logs.GetLogs;

public record GetLogsQuery(string? From, string? To, string? Status) : IRequest<IList<LogSummaryDto>>;
public record LogSummaryDto(Guid Id, DateOnly Date, string Status, int TotalSeconds);
