// Keep server diagnostics in the console; show existing localized UI messages.
// The last-admin case must precede the general authorization failure.
export function accountOperationErrorKey(error) {
  if (error?.error === 'not-authorized' && error.reason === 'Cannot delete the last administrator') return 'last-admin-desc';
  if (error?.error === 'not-authorized') return 'error-notAllowed';
  if (error?.error === 'user-not-found') return 'error-user-doesNotExist';
  return 'server-error';
}
