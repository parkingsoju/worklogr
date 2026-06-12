namespace Worklogr.Api.Shared.Auth;

public interface ICurrentUser
{
    Guid Id { get; }
    string Email { get; }
}
