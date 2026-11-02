/** Normalise Laravel validation / API errors into a readable string. */
export function getErrorMessage(error) {
  if (!error) return 'Something went wrong. Please try again.';

  const response = error.response?.data;

  if (response?.errors) {
    const first = Object.values(response.errors)[0];
    if (Array.isArray(first)) return first[0];
    if (typeof first === 'string') return first;
  }

  if (response?.message) return response.message;

  if (error.code === 'ERR_NETWORK') {
    return 'Cannot reach the API. Is the backend server running?';
  }

  return error.message || 'Something went wrong. Please try again.';
}

/** Map of field => message for inline form errors. */
export function getFieldErrors(error) {
  const errors = error?.response?.data?.errors;
  if (!errors) return {};
  return Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [
      field,
      Array.isArray(messages) ? messages[0] : messages,
    ])
  );
}
