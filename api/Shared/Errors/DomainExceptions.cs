namespace Worklogr.Api.Shared.Errors;

public class NotFoundException(string message) : Exception(message);
public class UnauthorizedException(string message = "Unauthorized") : Exception(message);
public class ConflictException(string message) : Exception(message);
public class ValidationException(string message) : Exception(message);
