using Microsoft.AspNetCore.Diagnostics;
using Worklogr.Api.Shared.Errors;

namespace Worklogr.Api.Shared.Middleware;

public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext ctx, Exception ex, CancellationToken ct)
    {
        var (status, message) = ex switch
        {
            ValidationException => (400, ex.Message),
            UnauthorizedException => (401, ex.Message),
            NotFoundException => (404, ex.Message),
            ConflictException => (409, ex.Message),
            _ => (500, "An unexpected error occurred.")
        };

        if (status == 500)
            logger.LogError(ex, "Unhandled exception");

        ctx.Response.StatusCode = status;
        await ctx.Response.WriteAsJsonAsync(new
        {
            status,
            message,
            traceId = ctx.TraceIdentifier
        }, ct);

        return true;
    }
}
