using MediatR;

namespace Worklogr.Api.Features.Auth.Register;

public static class RegisterEndpoint
{
    public static void MapRegister(this IEndpointRouteBuilder app) =>
        app.MapPost("/api/auth/register", async (RegisterCommand cmd, IMediator mediator) =>
            Results.Ok(await mediator.Send(cmd)))
           .AllowAnonymous()
           .RequireRateLimiting("register");
}
