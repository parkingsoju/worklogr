using MediatR;

namespace Worklogr.Api.Features.Auth.Login;

public record LoginCommand(string Email, string Password) : IRequest<LoginResult>;
// Mirrors MeResult's profile fields (+ Token) so the SPA can seed the `me` cache from
// the login response — an incomplete shape left theme/accent unset until a refresh.
public record LoginResult(
    Guid Id, string Name, string Email, string Timezone,
    string? DefaultLocationType, int WeekStartsOn, string Theme, string AccentColor, string Token);
