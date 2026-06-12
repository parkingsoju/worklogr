namespace Worklogr.Api.Features.Auth.Logout;

public static class LogoutEndpoint
{
    private const string CookieName = "auth";

    public static void MapLogout(this IEndpointRouteBuilder app) =>
        app.MapPost("/api/auth/logout", (HttpContext ctx) =>
        {
            ctx.Response.Cookies.Delete(CookieName);
            return Results.Ok();
        })
        .RequireAuthorization();
}
