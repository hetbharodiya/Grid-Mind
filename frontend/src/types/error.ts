/**
 * Standardized API Error Types.
 * Exactly maps to backend/app/schemas/api.py: ErrorDetail, ErrorResponse,
 * and FastAPI 422 HTTPValidationError array envelope.
 */

export interface ErrorDetail {
  error_code: string;
  message: string;
}

export interface ErrorResponse {
  detail: ErrorDetail;
}

export interface ValidationErrorItem {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail: ValidationErrorItem[];
}

export interface NormalizedApiError {
  errorCode: string;
  message: string;
  statusCode?: number;
  validationErrors?: ValidationErrorItem[];
  raw?: unknown;
}
