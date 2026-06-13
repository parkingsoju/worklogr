using MediatR;
using Worklogr.Api.Features.Auth.Me;

namespace Worklogr.Api.Features.Users.UpdateUser;

public record UpdateUserCommand(
    string? Name,
    string? Timezone,
    string? DefaultLocationType,
    int? WeekStartsOn,
    string? Theme,
    string? AccentColor
) : IRequest<MeResult>;
