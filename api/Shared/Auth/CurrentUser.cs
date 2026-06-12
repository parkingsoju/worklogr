using System.Security.Claims;

namespace Worklogr.Api.Shared.Auth;

public class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    public Guid Id => Guid.Parse(accessor.HttpContext!.User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    public string Email => accessor.HttpContext!.User.FindFirstValue(ClaimTypes.Email)!;
}
