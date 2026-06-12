using MediatR;

namespace Worklogr.Api.Features.Auth.ForgotPassword;

public record ForgotPasswordCommand(string Email) : IRequest;
