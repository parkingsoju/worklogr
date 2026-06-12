using MediatR;

namespace Worklogr.Api.Features.Auth.ResetPassword;

public static class ResetPasswordEndpoint
{
    public static void MapResetPassword(this IEndpointRouteBuilder app) =>
        app.MapPost("/api/auth/reset-password", async (ResetPasswordCommand cmd, IMediator mediator) =>
        {
            await mediator.Send(cmd);
            return Results.Ok(new { message = "Password reset successfully." });
        })
        .AllowAnonymous();
}
