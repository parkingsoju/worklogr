namespace Worklogr.Api.Shared.Email;

public class ResendClient(IConfiguration config, ILogger<ResendClient> logger, HttpClient http)
{
    public async Task SendAsync(string to, string subject, string htmlBody)
    {
        var apiKey = config["Resend:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
        {
            // Log the email content in dev when Resend is not configured
            logger.LogInformation("[Email stub] To: {To} | Subject: {Subject} | Body: {Body}", to, subject, htmlBody);
            return;
        }

        http.DefaultRequestHeaders.Authorization = new("Bearer", apiKey);
        var response = await http.PostAsJsonAsync("https://api.resend.com/emails", new
        {
            from = config["Resend:From"] ?? "Worklogr <onboarding@resend.dev>",
            to = new[] { to },
            subject,
            html = htmlBody
        });
        response.EnsureSuccessStatusCode();
    }
}
