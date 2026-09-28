'use strict';
// One elapsed-time budget across DNS, connection, redirects and body reading.
// Cancels registered request/response streams, rather than only racing their
// result. DNS lookup itself may finish late; callers must check before dialing.
function createOutboundDeadline(timeoutMs) {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 300000) {
    throw new Error('outbound total timeout must be between 1 and 300000ms');
  }
  const started = process.hrtime.bigint(), resources = new Set();
  let error, timer, rejectExpired;
  const expired = new Promise((resolve, reject) => { rejectExpired = reject; });
  // The deadline may fire between awaited phases; always handle its rejection.
  expired.catch(() => {});
  function expire() {
    if (!error) {
      error = new Error(`outbound request exceeded total deadline of ${timeoutMs}ms`);
      error.code = 'OUTBOUND_DEADLINE_EXCEEDED';
      rejectExpired(error);
      for (const resource of resources) {
        try { resource.destroy(error); } catch { /* preserve timeout outcome */ }
      }
    }
    return error;
  }
  function assertActive() {
    if (error || Number(process.hrtime.bigint() - started) / 1e6 >= timeoutMs) throw expire();
  }
  timer = setTimeout(expire, timeoutMs);
  return {
    assertActive,
    async wait(promise) {
      // Attach first, even if already expired, so a late underlying rejection
      // cannot escape as an unhandled promise rejection.
      const result = Promise.race([promise, expired]);
      try { assertActive(); } catch (failure) { result.catch(() => {}); throw failure; }
      const value = await result;
      assertActive();
      return value;
    },
    watch(resource) {
      resources.add(resource);
      try { assertActive(); } catch (failure) {
        try { resource.destroy(failure); } catch { /* preserve timeout outcome */ }
        throw failure;
      }
    },
    cancel(reason) {
      if (!error) error = reason;
      rejectExpired(error);
      for (const resource of resources) {
        try { resource.destroy(reason); } catch { /* preserve original failure */ }
      }
    },
    dispose() { clearTimeout(timer); resources.clear(); },
  };
}
module.exports = { createOutboundDeadline };
