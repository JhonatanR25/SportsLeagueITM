using Microsoft.AspNetCore.Mvc;

namespace SportsLeague.API.Responses;

public static class ApiErrorFactory
{
    public static ApiErrorResponse Create(HttpContext context, int status, string message, string? detail = null)
    {
        return new ApiErrorResponse
        {
            Status = status,
            Message = message,
            Detail = detail,
            TraceId = context.TraceIdentifier
        };
    }

    public static NotFoundObjectResult NotFound(ControllerBase controller, string message)
    {
        return controller.NotFound(Create(controller.HttpContext, StatusCodes.Status404NotFound, message));
    }
}
