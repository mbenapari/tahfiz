/**
 * Standardized API response structure
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Creates a successful API response
 * @param data The data to return
 */
export const success = <T>(data: T): ApiResponse<T> => {
  return {
    success: true,
    data,
  };
};

/**
 * Creates a failed API response
 * @param code Error code (e.g., 'AUTH_FAILED')
 * @param message Human-readable error message
 * @param details Optional additional error details
 */
export const fail = (code: string, message: string, details?: any): ApiResponse<null> => {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
};
