export enum MessageCode {
  // User registration and login
  USER_REGISTER = 'USER_REGISTER',
  LOGGED_IN = 'LOGGED_IN',
  LOGGED_OUT = 'LOGGED_OUT',

  // Email verification
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  EMAIL_VERIFIED_SUCCESS = 'EMAIL_VERIFIED_SUCCESS', // Added for successful verification
  EMAIL_VERIFIED_FAILED = 'EMAIL_VERIFIED_FAILED', // Added for failed verification
  EMAIL_VERIFIED = 'EMAIL_VERIFIED', // Already verified

  // User already exists
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  USERNAME_ALREADY_EXISTS = 'USERNAME_ALREADY_EXISTS',
  PHONE_ALREADY_EXISTS = 'PHONE_ALREADY_EXISTS',

  // Credentials validation
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  NO_TOKEN_FOUND = 'NO_TOKEN_FOUND',

  // Success and general messages
  SUCCESS = 'SUCCESS',
  USER_NOT_FOUND = 'USER_NOT_FOUND', // User not found during actions
  INVALID_TOKEN = 'INVALID_TOKEN', // Invalid token error
  NO_ROLE_ASSIGNED = 'NO_ROLE_ASSIGNED', // Role not assigned to user
  INVALID_OR_EXPIRED_TOKEN = 'INVALID_OR_EXPIRED_TOKEN', // Token expired or invalid
  USER_HAS_NO_ROLE = 'USER_HAS_NO_ROLE', // If the user has no role
}
