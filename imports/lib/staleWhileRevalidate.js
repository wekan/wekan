'use strict';

// Pure decision for the DataCache "stale-while-revalidate" behaviour — the fix
// for the board-not-found flicker (#5808-adjacent; seen failing 14-voting and
// 24-feature Playwright specs on Firefox/WebKit).
//
// The client board cache re-fetches its value inside a reactive computation. When
// the board doc is briefly missing from minimongo — e.g. a subscription stops and
// restarts and Meteor momentarily removes the doc — the re-fetch returns
// null/undefined and the board view flips to the "Board not found" shell (and, in
// WebKit, Blaze throws "Can't select in removed DomRange" tearing down the removed
// card view). It self-recovers when the subscription re-delivers the doc.
//
// With SWR enabled, such a transient miss is DEFERRED: keep the last cached value
// and re-check after a short delay, surfacing the miss only if the doc is still
// gone then (a genuine deletion / access loss). A first-ever load (no cached
// value) is NOT deferred, so real "not found" still renders promptly.
function shouldDeferCacheMiss(options, newData, cachedValue) {
  return !!(
    options &&
    options.staleWhileRevalidate &&
    (newData === null || newData === undefined) &&
    cachedValue !== null &&
    cachedValue !== undefined
  );
}

module.exports = { shouldDeferCacheMiss };
