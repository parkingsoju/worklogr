using FluentValidation;

namespace Worklogr.Api.Features.Sessions.StartSession;

public class StartSessionValidator : AbstractValidator<StartSessionCommand>
{
    private static readonly string[] ValidLocations = ["Office", "Remote", "Other"];

    public StartSessionValidator()
    {
        RuleFor(x => x.LocationType)
            .NotEmpty()
            .Must(v => ValidLocations.Contains(v, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Location must be Office, Remote, or Other.");
    }
}
