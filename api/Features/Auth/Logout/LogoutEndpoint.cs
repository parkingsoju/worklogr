namespace Worklogr.Api.Features.Auth.Logout;

public static class LogoutEndpoint
{
    public static void MapLogout(this IEndpointRouteBuilder app) =>
        // JWTs are stateless and cleared client-side (localStorage); this endpoint
        // just gives the client a logout call to make. No-op server-side.
        app.MapPost("/api/auth/logout", () => Results.Ok())
           .AllowAnonymous();
}
