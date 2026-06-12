using MediatR;

namespace Worklogr.Api.Features.Reports.GetSessionsExport;

public record GetSessionsExportQuery(string? From, string? To) : IRequest<IList<SessionExportDto>>;

public record SessionExportDto(
    DateOnly Date,
    DateTime StartTime,
    DateTime EndTime,
    int DurationSeconds,
    string LocationType,
    string? SessionNote,
    string DailyStatus,
    string? DailyNote);
