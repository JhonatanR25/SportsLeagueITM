import { HttpErrorResponse } from '@angular/common/http';

export function parseApiErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Ocurrio un error inesperado. Intenta nuevamente.';
  }

  const payload = error.error as
    | { message?: string; detail?: string; errors?: Record<string, string[]> }
    | string
    | null;

  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === 'object' && 'message' in payload && payload.message) {
    return String(payload.message);
  }

  if (payload && typeof payload === 'object' && 'detail' in payload && payload.detail) {
    return String(payload.detail);
  }

  const validationErrors =
    payload && typeof payload === 'object' && 'errors' in payload && payload.errors
      ? Object.values(payload.errors as Record<string, unknown[]>)
          .flat()
          .filter((item): item is string => typeof item === 'string' && item.length > 0)
      : [];

  if (validationErrors.length > 0) {
    return validationErrors[0];
  }

  if (error.status === 0) {
    return 'No se pudo conectar con el backend. Verifica que la API este ejecutandose.';
  }

  return 'La operacion no pudo completarse. Revisa los datos e intenta nuevamente.';
}
