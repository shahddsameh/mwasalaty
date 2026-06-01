export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  OTP_SERVICE_UNAVAILABLE: 'OTP_SERVICE_UNAVAILABLE',
  OTP_EMPTY_PLAN: 'OTP_EMPTY_PLAN',
  OTP_GRAPHQL_ERROR: 'OTP_GRAPHQL_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
};

export function makeError(code, message, details = {}) {
  return { error: { code, message, details } };
}
