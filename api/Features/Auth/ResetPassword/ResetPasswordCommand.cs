using MediatR;

namespace Worklogr.Api.Features.Auth.ResetPassword;

public record ResetPasswordCommand(string Token, string NewPassword, string ConfirmPassword) : IRequest;
