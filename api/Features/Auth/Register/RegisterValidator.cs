using FluentValidation;

namespace Worklogr.Api.Features.Auth.Register;

// DB check (email uniqueness) is in RegisterHandler — keeps validator free of DB calls
// so the EF Core retry strategy applies cleanly on the first real DB hit
public class RegisterValidator : AbstractValidator<RegisterCommand>
{
    public RegisterValidator()
    {
        RuleFor(x => x.Name).NotEmpty();
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8).WithMessage("Password must be at least 8 characters.");
        RuleFor(x => x.ConfirmPassword)
            .Equal(x => x.Password).WithMessage("Passwords do not match.");
    }
}
