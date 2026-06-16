using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using Serilog.Events;
using System.Threading.RateLimiting;
using FluentValidation;
using MediatR;
using Scalar.AspNetCore;
using Worklogr.Api.Features.Auth.ForgotPassword;
using Worklogr.Api.Features.Logs.GetToday;
using Worklogr.Api.Features.Logs.MarkComplete;
using Worklogr.Api.Features.Logs.ReopenLog;
using Worklogr.Api.Features.Logs.GetByDate;
using Worklogr.Api.Features.Logs.GetLogs;
using Worklogr.Api.Features.Logs.UpdateNote;
using Worklogr.Api.Features.Logs.DeleteDailyLog;
using Worklogr.Api.Features.Sessions.UpdateSessionNote;
using Worklogr.Api.Features.Reports.GetSessionsExport;
using Worklogr.Api.Features.Users.UpdateUser;
using Worklogr.Api.Features.Sessions.StartSession;
using Worklogr.Api.Features.Sessions.EndSession;
using Worklogr.Api.Features.Sessions.AddManualSession;
using Worklogr.Api.Features.Sessions.EditSession;
using Worklogr.Api.Features.Sessions.DeleteSession;
using Worklogr.Api.Features.Auth.Login;
using Worklogr.Api.Features.Auth.Logout;
using Worklogr.Api.Features.Auth.Me;
using Worklogr.Api.Features.Auth.Register;
using Worklogr.Api.Features.Auth.ResetPassword;
using Worklogr.Api.Features.Health;
using Worklogr.Api.Shared.Auth;
using Worklogr.Api.Shared.Db;
using Worklogr.Api.Shared.Email;
using Worklogr.Api.Shared.Middleware;
using Worklogr.Api.Shared.Seeding;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .WriteTo.Console(new Serilog.Formatting.Json.JsonFormatter())
    .CreateLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);
    builder.Host.UseSerilog();

    // Trust X-Forwarded-For from Azure App Service reverse proxy
    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        options.KnownNetworks.Clear();
        options.KnownProxies.Clear();
    });

    // Database — retry on transient failures (handles Neon cold starts)
    builder.Services.AddDbContext<AppDbContext>(opt =>
        opt.UseNpgsql(builder.Configuration.GetConnectionString("Default"), npgsql =>
            npgsql.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(10), errorCodesToAdd: null)));

    // Auth
    builder.Services.AddHttpContextAccessor();
    builder.Services.AddScoped<ICurrentUser, CurrentUser>();
    builder.Services.AddScoped<JwtHelper>();
    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(opt =>
        {
            var secret = builder.Configuration["Jwt:Secret"]!;
            opt.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = builder.Configuration["Jwt:Issuer"],
                ValidateAudience = true,
                ValidAudience = builder.Configuration["Jwt:Audience"],
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
            };
            // JWT arrives as a standard Authorization: Bearer header (read by default).
        });
    builder.Services.AddAuthorization();

    // Email
    builder.Services.AddHttpClient<ResendClient>();

    // MediatR + FluentValidation pipeline
    builder.Services.AddValidatorsFromAssemblyContaining<Program>();
    builder.Services.AddMediatR(cfg =>
    {
        cfg.RegisterServicesFromAssemblyContaining<Program>();
        cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
    });

    // Health checks
    builder.Services.AddHealthChecks().AddDbContextCheck<AppDbContext>();

    // Exception handler
    builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
    builder.Services.AddProblemDetails();

    // Rate limiting (real client IP via X-Forwarded-For, resolved after UseForwardedHeaders)
    builder.Services.AddRateLimiter(opt =>
    {
        opt.OnRejected = async (ctx, ct) =>
        {
            ctx.HttpContext.Response.StatusCode = 429;
            await ctx.HttpContext.Response.WriteAsJsonAsync(
                new { status = 429, message = "Too many requests. Please try again later." }, ct);
        };
        opt.AddPolicy("login", ctx => RateLimitPartition.GetFixedWindowLimiter(
            ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1) }));
        opt.AddPolicy("register", ctx => RateLimitPartition.GetFixedWindowLimiter(
            ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 5, Window = TimeSpan.FromHours(1) }));
        opt.AddPolicy("forgot-password", ctx => RateLimitPartition.GetFixedWindowLimiter(
            ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 3, Window = TimeSpan.FromHours(1) }));
    });

    // OpenAPI
    builder.Services.AddOpenApi();

    // CORS
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
    builder.Services.AddCors(opt => opt.AddDefaultPolicy(p =>
        p.WithOrigins(allowedOrigins).AllowCredentials().AllowAnyHeader().AllowAnyMethod()));

    var app = builder.Build();

    // Apply pending EF migrations on startup so every deploy keeps code and schema
    // in sync (no manual `ef database update` step to forget). Then dev-seed.
    // Best-effort + logged: a suspended Neon DB must not block the app from
    // starting — the next restart re-attempts. Runs in all environments.
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
        if (app.Environment.IsDevelopment())
            await DevSeeder.SeedAsync(db);
    }
    catch (Exception ex)
    {
        Log.Warning(ex, "Startup DB migrate/seed skipped — database unreachable");
    }

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
        app.MapScalarApiReference();
    }

    app.UseForwardedHeaders();
    app.UseExceptionHandler();
    app.UseCors();
    app.UseRateLimiter();
    app.UseAuthentication();
    app.UseAuthorization();
    app.UseSerilogRequestLogging();

    // Endpoints
    app.MapHealthEndpoint();
    app.MapRegister();
    app.MapLogin();
    app.MapLogout();
    app.MapMe();
    app.MapForgotPassword();
    app.MapResetPassword();
    app.MapGetToday();
    app.MapGetLogs();
    app.MapGetByDate();
    app.MapMarkComplete();
    app.MapReopenLog();
    app.MapDeleteDailyLog();
    app.MapStartSession();
    app.MapEndSession();
    app.MapAddManualSession();
    app.MapEditSession();
    app.MapDeleteSession();
    app.MapUpdateSessionNote();
    app.MapUpdateDailyNote();
    app.MapGetSessionsExport();
    app.MapUpdateUser();

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application failed to start");
}
finally
{
    Log.CloseAndFlush();
}
