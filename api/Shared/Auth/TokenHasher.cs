using System.Security.Cryptography;
using System.Text;

namespace Worklogr.Api.Shared.Auth;

public static class TokenHasher
{
    public static string GenerateRawToken() =>
        Convert.ToHexString(RandomNumberGenerator.GetBytes(32));

    public static string Hash(string rawToken) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken))).ToLower();
}
