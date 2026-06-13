using MediatR;

namespace Worklogr.Api.Features.Auth.Login;

public static class LoginEndpoint
{
    private const string CookieName = "auth";

    public static void MapLogin(this IEndpointRouteBuilder app) =>
        app.MapPost("/api/auth/login", async (LoginCommand cmd, IMediator mediator, HttpContext ctx, IWebHostEnvironment env, IConfiguration config) =>
        {
            var result = await mediator.Send(cmd);
            // Cookie lifetime must track the JWT lifetime — otherwise the cookie can outlive
            // the token and the browser keeps sending a dead JWT, yielding silent 401s.
            ctx.Response.Cookies.Append(CookieName, result.Token, new CookieOptions
            {
                HttpOnly = true,
                Secure = !env.IsDevelopment(),
                // Lax in dev (same-origin via Vite proxy); None in prod (cross-origin SWA→App Service)
                SameSite = env.IsDevelopment() ? SameSiteMode.Lax : SameSiteMode.None,
                Expires = DateTimeOffset.UtcNow.AddDays(double.Parse(config["Jwt:ExpiryDays"]!))
            });
            return Results.Ok(new { result.Id, result.Name, result.Email, result.Timezone });
        })
        .AllowAnonymous()
        .RequireRateLimiting("login");
}
