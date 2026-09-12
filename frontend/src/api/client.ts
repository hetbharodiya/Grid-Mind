import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { NormalizedApiError, ValidationErrorItem } from '../types/error';

const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Response interceptor to normalize backend domain and validation errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<unknown>) => {
    const status = error.response?.status;
    const responseData = error.response?.data;

    const normalizedError: NormalizedApiError = {
      errorCode: 'API_ERROR',
      message: error.message || 'An unexpected network error occurred.',
      statusCode: status,
      raw: responseData,
    };

    if (responseData && typeof responseData === 'object') {
      const dataObj = responseData as Record<string, unknown>;

      // A. Structured backend error envelope: { "detail": { "error_code": "...", "message": "..." } }
      if (
        dataObj.detail &&
        typeof dataObj.detail === 'object' &&
        !Array.isArray(dataObj.detail)
      ) {
        const errorDetail = dataObj.detail as { error_code?: string; message?: string };
        normalizedError.errorCode = errorDetail.error_code || 'DOMAIN_ERROR';
        normalizedError.message = errorDetail.message || 'A domain error occurred.';
      }

      // B. FastAPI 422 Validation Error: { "detail": [ { "loc": [...], "msg": "...", "type": "..." } ] }
      else if (Array.isArray(dataObj.detail)) {
        const validationItems = dataObj.detail as ValidationErrorItem[];
        normalizedError.errorCode = 'VALIDATION_ERROR';
        normalizedError.validationErrors = validationItems;

        const formattedValidationMsgs = validationItems.map((item) => {
          const field = item.loc ? item.loc.filter((part) => part !== 'body').join('.') : 'field';
          return `${field ? field + ': ' : ''}${item.msg}`;
        });

        normalizedError.message =
          formattedValidationMsgs.length > 0
            ? `Validation error: ${formattedValidationMsgs.join('; ')}`
            : 'Validation error occurred on request payload.';
      }

      // C. Fallback string detail
      else if (typeof dataObj.detail === 'string') {
        normalizedError.message = dataObj.detail;
      }
    } else if (error.code === 'ECONNABORTED') {
      normalizedError.errorCode = 'TIMEOUT_ERROR';
      normalizedError.message = 'The request to GridMind backend timed out (15s limit).';
    } else if (!error.response) {
      normalizedError.errorCode = 'NETWORK_ERROR';
      normalizedError.message = `Unable to connect to GridMind API server at ${API_BASE_URL}. Ensure backend is running.`;
    }

    return Promise.reject(normalizedError);
  }
);

export default apiClient;
