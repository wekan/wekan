'use strict';

// Preserve malformed payloads for Meteor's own full-payload validator. Only
// valid object-shaped requests gain the server-enforced creation flag.
function guardPasswordlessPayload(payload, registrationClosed) {
  if (!registrationClosed || !payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }
  const options = payload.options;
  if (options !== undefined && options !== null &&
    (typeof options !== 'object' || Array.isArray(options))) return payload;
  return { ...payload, options: { ...(options || {}), userCreationDisabled: true } };
}

function recordPasswordlessLimitDenial(result, input, record) {
  if (result?.allowed !== false) return false;
  try {
    record({
      key: 'brute.passwordless-request',
      action: 'blocked',
      source: 'requestLoginTokenForUser',
      ip: input?.clientAddress,
      detail: 'passwordless code request rate limit exceeded',
    });
  } catch (e) { /* Reporting must never weaken the rate limit. */ }
  return true;
}

module.exports = { guardPasswordlessPayload, recordPasswordlessLimitDenial };
