'use strict';

// `as` names the problem when it is not account recovery: the sign-up
// throttle records InviteBleed's key (server/models/users.js).
function recordAuthRateLimitDenial(result, input, record, as = {}) {
  if (!result || result.allowed !== false) return false;
  try {
    record({
      key: as.key || 'brute.account-recovery',
      action: 'blocked',
      source: input && input.name || 'account-recovery',
      ip: input && input.clientAddress,
      detail: as.detail || 'account recovery DDP rate limit exceeded',
    });
  } catch (e) { /* logging must never break the guard */ }
  return true;
}

module.exports = { recordAuthRateLimitDenial };
