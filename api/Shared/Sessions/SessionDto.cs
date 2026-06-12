namespace Worklogr.Api.Shared.Sessions;

public record SessionDto(Guid Id, DateTime StartTime, DateTime? EndTime, string LocationType, string? Note);
