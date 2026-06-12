using MediatR;

namespace Worklogr.Api.Features.Auth.ForgotPassword;

public static class ForgotPasswordEndpoint
{
    public static void MapForgotPassword(this IEndpointRouteBuilder app) =>
        app.MapPost("/api/auth/forgot-password", async (ForgotPasswordCommand cmd, IMediator mediator) =>
        {
            await mediator.Send(cmd);
            return Results.Ok(new { message = "If an account exists for this email, a reset link has been sent." });
        })
        .AllowAnonymous()
        .RequireRateLimiting("forgot-password");
}
