using Microsoft.AspNetCore.Mvc;

namespace SportsLeague.API.Responses;

public static class ApiErrorFactory
{
    public static ApiErrorResponse Create(
        HttpContext context,
        int status,
        string message,
        string? detail = null,
        Dictionary<string, string[]>? errors = null)
    {
        return new ApiErrorResponse
        {
            Status = status,
            Message = message,
            Detail = detail,
            TraceId = context.TraceIdentifier,
            Errors = errors
        };
    }

    public static NotFoundObjectResult NotFound(ControllerBase controller, string message)
    {
        return controller.NotFound(Create(controller.HttpContext, StatusCodes.Status404NotFound, message));
    }

    public static BadRequestObjectResult Validation(ControllerBase controller)
    {
        var errors = controller.ModelState
            .Where(entry => entry.Value?.Errors.Count > 0)
            .ToDictionary(
                entry => entry.Key,
                entry => entry.Value!.Errors
                    .Select(error => string.IsNullOrWhiteSpace(error.ErrorMessage)
                        ? "Valor invalido."
                        : error.ErrorMessage)
                    .ToArray());

        return controller.BadRequest(Create(
            controller.HttpContext,
            StatusCodes.Status400BadRequest,
            "La solicitud contiene errores de validacion.",
            errors: errors));
    }
}
