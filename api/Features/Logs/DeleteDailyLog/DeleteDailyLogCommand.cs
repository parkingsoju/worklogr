using MediatR;

namespace Worklogr.Api.Features.Logs.DeleteDailyLog;

public record DeleteDailyLogCommand(Guid LogId) : IRequest;
