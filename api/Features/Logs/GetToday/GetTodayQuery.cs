using MediatR;
using Worklogr.Api.Shared.Sessions;

namespace Worklogr.Api.Features.Logs.GetToday;

public record GetTodayQuery : IRequest<TodayResult>;

public record TodayResult(
    DateOnly Date,
    Guid? DailyLogId,
    string Status,
    string? Note,
    SessionDto? ActiveSession,
    IList<SessionDto> Sessions,
    StaleSessionDto? StaleSession);

public record StaleSessionDto(Guid Id, DateOnly Date, DateTime StartTime, string LocationType);
