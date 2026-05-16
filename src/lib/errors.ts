export function getAuthErrorMessage(code: string): string {
  const map: Record<string, string> = {
    'invalid_credentials': 'Invalid email or password.',
    'email_not_confirmed': 'Please confirm your email before signing in.',
    'user_already_exists': 'An account with this email already exists.',
    'weak_password': 'Password is too weak. Use at least 8 characters with uppercase, number, and symbol.',
    'over_email_send_rate_limit': 'Too many requests. Please wait a few minutes before trying again.',
  }
  return map[code] ?? 'Something went wrong. Please try again.'
}
