namespace Worklogr.Api.Features.Auth.Logout;

public static class LogoutEndpoint
{
    private const string CookieName = "auth";

    public static void MapLogout(this IEndpointRouteBuilder app) =>
        app.MapPost("/api/auth/logout", (HttpContext ctx, IWebHostEnvironment env) =>
        {
            // Must match the SameSite/Secure flags used when setting the cookie,
            // otherwise browsers reject the Set-Cookie on cross-origin responses.
            ctx.Response.Cookies.Delete(CookieName, new CookieOptions
            {
                HttpOnly = true,
                Secure = !env.IsDevelopment(),
                SameSite = env.IsDevelopment() ? SameSiteMode.Lax : SameSiteMode.None,
            });
            return Results.Ok();
        })
        .AllowAnonymous(); // Allow even if cookie is already expired/invalid
}
