using MediatR;

namespace Worklogr.Api.Features.Auth.Login;

public record LoginCommand(string Email, string Password) : IRequest<LoginResult>;
public record LoginResult(Guid Id, string Name, string Email, string Timezone, string Token);
