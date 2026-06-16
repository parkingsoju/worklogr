using MediatR;

namespace Worklogr.Api.Features.Auth.Login;

public static class LoginEndpoint
{
    public static void MapLogin(this IEndpointRouteBuilder app) =>
        app.MapPost("/api/auth/login", async (LoginCommand cmd, IMediator mediator) =>
        {
            var result = await mediator.Send(cmd);
            // Return the JWT in the body; the SPA stores it and sends it back as a
            // Bearer header. Avoids cross-site cookies (blocked by incognito/Safari).
            return Results.Ok(new
            {
                result.Id, result.Name, result.Email, result.Timezone,
                result.DefaultLocationType, result.WeekStartsOn, result.Theme, result.AccentColor, result.Token,
            });
        })
        .AllowAnonymous()
        .RequireRateLimiting("login");
}
