function callbackParams(url: string): URLSearchParams {
  const parsedUrl = new URL(url);
  const params = new URLSearchParams(parsedUrl.search);
  const hash = parsedUrl.hash.slice(1);
  const hashParams = new URLSearchParams(hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : hash);
  hashParams.forEach((value, key) => {
    if (!params.has(key)) params.set(key, value);
  });
  return params;
}

export function isInvalidAuthLinkUrl(url: string): boolean {
  const params = callbackParams(url);
  const errorCode = params.get('error_code')?.toLowerCase() ?? '';
  const error = params.get('error')?.toLowerCase() ?? '';
  const description = params.get('error_description')?.toLowerCase() ?? '';
  const message = params.get('message')?.toLowerCase() ?? '';
  const details = `${errorCode} ${error} ${description} ${message}`;

  return /otp_expired|invalid_token|token_expired|flow_state_not_found|bad_code_verifier/.test(details)
    || ((error === 'access_denied' || error === 'invalid_request')
      && /(invalid|expired|token|otp|email link|confirmation link)/.test(details));
}

export function isInvalidAuthLinkError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const details = error as { code?: unknown; name?: unknown; message?: unknown };
  const description = [details.code, details.name, details.message]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase();
  return /otp_expired|invalid_token|token_expired|flow_state_not_found|bad_code_verifier|email link.*(invalid|expired)|token.*(invalid|expired)/.test(description);
}
