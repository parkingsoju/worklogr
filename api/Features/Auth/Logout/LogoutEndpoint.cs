namespace Worklogr.Api.Features.Auth.Logout;

public static class LogoutEndpoint
{
    private const string CookieName = "auth";

    public static void MapLogout(this IEndpointRouteBuilder app) =>
        app.MapPost("/api/auth/logout", (HttpContext ctx, IWebHostEnvironment env) =>
        {
            // Flags must match the ones used when setting the cookie, or the
            // browser won't match and clear it. See LoginEndpoint for rationale.
            ctx.Response.Cookies.Delete(CookieName, new CookieOptions
            {
                HttpOnly = true,
                Secure = !env.IsDevelopment(),
                SameSite = SameSiteMode.Lax,
            });
            return Results.Ok();
        })
        .AllowAnonymous(); // Allow even if cookie is already expired/invalid
}
