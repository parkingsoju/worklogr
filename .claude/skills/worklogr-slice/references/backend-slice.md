# Backend vertical slice

worklogr's backend is **vertical slice + MediatR**. A feature is a folder under `api/Features/<Area>/<FeatureName>/` holding everything it needs together. No repository layer, no service layer — the handler talks to `AppDbContext` directly. Tests sit next to the handler. (Source: `docs/backend.md`.)

## Folder shape

```
api/Features/<Area>/<FeatureName>/
  <FeatureName>Command.cs   (or <FeatureName>Query.cs for reads)
  <FeatureName>Handler.cs
  <FeatureName>Validator.cs (omit only if the feature has zero input rules)
  <FeatureName>Endpoint.cs
  <FeatureName>Handler.Tests.cs
```

## Templates

Worked example: `StartSession` (Sessions area, a command). Substitute names; adapt fields and logic to the real feature — these are starting points, not paste-and-go.

### Command / Query

```csharp
namespace Worklogr.Api.Features.Sessions.StartSession;

// Command = writes/mutations. For reads, name it StartSessionQuery and return data.
public record StartSessionCommand(string LocationType, string? Note) : IRequest<StartSessionResult>;

public record StartSessionResult(Guid SessionId);
```

### Handler

```csharp
namespace Worklogr.Api.Features.Sessions.StartSession;

public class StartSessionHandler(AppDbContext db, ICurrentUser currentUser)
    : IRequestHandler<StartSessionCommand, StartSessionResult>
{
    public async Task<StartSessionResult> Handle(StartSessionCommand cmd, CancellationToken ct)
    {
        var userId = currentUser.Id;

        // Talk to AppDbContext directly — no repository layer.
        // Throw domain exceptions for rule violations; the global IExceptionHandler
        // maps them (ConflictException → 409, NotFoundException → 404, etc.).
        // Session-creating features (Start, AddManual) must upsert today's DailyLog
        // by user + local date before attaching the session — never make the user
        // create a log manually (docs/data-model.md Rule 0/1).

        // ... feature logic ...

        await db.SaveChangesAsync(ct);
        return new StartSessionResult(session.Id);
    }
}
```

### Validator

```csharp
namespace Worklogr.Api.Features.Sessions.StartSession;

// Runs automatically as a MediatR pipeline behavior — the request never reaches
// the handler if this fails. Pull the exact rules from docs/api.md (each feature's
// rule list maps one-to-one to this class).
public class StartSessionValidator : AbstractValidator<StartSessionCommand>
{
    public StartSessionValidator()
    {
        RuleFor(x => x.LocationType).NotEmpty();
        // Stateful/DB rules ("user must not already have an active session",
        // "no overlapping session on that date") go in MustAsync if they read
        // cleanly here, otherwise enforce in the handler and throw ConflictException.
    }
}
```

### Endpoint

```csharp
namespace Worklogr.Api.Features.Sessions.StartSession;

// Thin dispatcher — just mediate. Route + verb come from docs/api.md.
public static class StartSessionEndpoint
{
    public static void MapStartSession(this IEndpointRouteBuilder app) =>
        app.MapPost("/api/work-sessions/start", async (StartSessionCommand cmd, IMediator mediator) =>
            Results.Ok(await mediator.Send(cmd)))
           .RequireAuthorization();   // authed by default; only Auth endpoints opt out (+ rate limits)
}
```

Call `app.MapStartSession();` in `Program.cs` (or wherever the codebase registers slice endpoints).

### Handler test

```csharp
namespace Worklogr.Api.Features.Sessions.StartSession;

// xUnit + FluentAssertions, co-located with the handler. Cover the rules that carry
// real risk: overlap detection, only-one-active, status transitions, daily-log auto-create.
public class StartSessionHandlerTests
{
    [Fact]
    public async Task Rejects_when_user_already_has_active_session()
    {
        // arrange: in-memory/SQLite AppDbContext + fake ICurrentUser
        // act + assert: handler throws ConflictException
    }
}
```

## Conventions that bite

- **No repository / service layer.** Handler → `AppDbContext`. Extra abstraction is over-engineering for this scope.
- **Domain exceptions, not status codes in handlers.** Throw `NotFoundException` / `ConflictException` / `UnauthorizedException` / `ValidationException`; the global `IExceptionHandler` maps them and returns `{ status, message, traceId }`. Don't return `Results.NotFound()` from a handler.
- **Ownership checks.** Mutations verify the row belongs to `ICurrentUser.Id` — every session rule in `docs/api.md` starts with "must belong to the current user." Missing this is a data-leak bug.
- **Auth by default.** Endpoints `.RequireAuthorization()`. Only `Auth`-area endpoints are anonymous, and those carry rate limits (`docs/backend.md`).
- **Generic auth errors.** Login failures return "Invalid email or password." — never reveal whether the email exists. Forgot-password always responds the same regardless of account existence.
