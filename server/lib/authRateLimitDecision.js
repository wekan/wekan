'use strict';

function recordAuthRateLimitDenial(result, input, record) {
  if (!result || result.allowed !== false) return false;
  try {
    record({
      key: 'brute.account-recovery',
      action: 'blocked',
      source: input && input.name || 'account-recovery',
      ip: input && input.clientAddress,
      detail: 'account recovery DDP rate limit exceeded',
    });
  } catch (e) { /* logging must never break the guard */ }
  return true;
}

module.exports = { recordAuthRateLimitDenial };
