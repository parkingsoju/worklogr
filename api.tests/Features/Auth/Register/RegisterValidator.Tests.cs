using FluentAssertions;
using Worklogr.Api.Features.Auth.Register;

namespace Worklogr.Api.Tests.Features.Auth.Register;

public class RegisterValidatorTests
{
    private static RegisterValidator Validator() => new();

    [Fact]
    public async Task Valid_registration_passes()
    {
        var result = await Validator().ValidateAsync(
            new RegisterCommand("Jane", "jane@example.com", "password123", "password123"));
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task Short_password_fails()
    {
        var result = await Validator().ValidateAsync(
            new RegisterCommand("Jane", "jane@example.com", "short", "short"));
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Password");
    }

    [Fact]
    public async Task Mismatched_passwords_fail()
    {
        var result = await Validator().ValidateAsync(
            new RegisterCommand("Jane", "jane@example.com", "password123", "different!"));
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "Passwords do not match.");
    }
}
