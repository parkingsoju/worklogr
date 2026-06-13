using MediatR;

namespace Worklogr.Api.Features.Auth.Me;

public record MeQuery : IRequest<MeResult>;
public record MeResult(Guid Id, string Name, string Email, string Timezone, string? DefaultLocationType, int WeekStartsOn, string Theme, string AccentColor);
