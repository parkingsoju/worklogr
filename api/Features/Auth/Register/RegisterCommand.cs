using MediatR;

namespace Worklogr.Api.Features.Auth.Register;

public record RegisterCommand(string Name, string Email, string Password, string ConfirmPassword, string? Timezone = null) : IRequest<RegisterResult>;
public record RegisterResult(Guid Id, string Name, string Email);
