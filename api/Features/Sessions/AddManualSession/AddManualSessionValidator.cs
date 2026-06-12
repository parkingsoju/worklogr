using FluentValidation;

namespace Worklogr.Api.Features.Sessions.AddManualSession;

public class AddManualSessionValidator : AbstractValidator<AddManualSessionCommand>
{
    private static readonly string[] ValidLocations = ["Office", "Remote", "Other"];

    public AddManualSessionValidator()
    {
        RuleFor(x => x.StartTime).NotEmpty();
        RuleFor(x => x.EndTime)
            .NotEmpty()
            .GreaterThan(x => x.StartTime).WithMessage("End time must be after start time.");
        RuleFor(x => x.LocationType)
            .NotEmpty()
            .Must(v => ValidLocations.Contains(v, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Location must be Office, Remote, or Other.");
    }
}
