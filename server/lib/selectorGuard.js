// selectorGuard — refuse a client-supplied MongoDB selector that carries an
// EXECUTION operator, and record who sent it.
//
// GHSA-phm4-4v26-j2vq (WhereBleed). A publication or method that takes a query
// selector from the client and validates only its TYPE —
//
//     check(query, Match.OneOf(Object, null));
//
// — has not validated it at all. A MongoDB selector is executable data: `$where`
// makes the database run the caller's JavaScript once per document scanned, so
// `{ $where: 'while(true){}' }` pins a database worker for as long as it likes,
// repeatably, and `{ $where: 'sleep(2000) || true' }` is a document-inclusion
// oracle whose truth value the caller controls. Reported against the Admin
// Panel's people, org, team and translation publications and their companion
// count/page methods — eight handlers, all taking the same shape of selector.
//
// The defence is NOT new here. classifySelector (models/lib/injectionDetect.js)
// and hasWhere (models/lib/mongoSelectorSafety.js) were written for exactly this
// and are wired into the card-window publication; the eight handlers simply never
// called them. This module is that publication's own helper, lifted out
// unchanged so there is ONE copy for every caller — the bug was eight places not
// doing what one place did, and a second copy of the check would be the same
// mistake waiting to happen again.
//
// Callers use the refusal cardsWindow.js already uses in production:
//
//     const safe = selectorIsInjection(query, 'people') ? MATCH_NOTHING : query;
//
// MATCH_NOTHING is `{ _id: { $in: [] } }`: a selector that is valid, cheap and
// matches no document, so a refused request returns an empty result instead of
// throwing. Nothing an ordinary Admin Panel search, filter or page sends is
// affected — none of it contains an execution operator.
//
// See docs/Security/Remediation/WeKan.md §12.6 for the canary, and
// tests/selectorGuard.test.cjs for what counts as an injection.

import { tripCanary } from '/server/lib/canary';

const { hasWhere } = require('/models/lib/mongoSelectorSafety');
const { classifySelector, injectionDetail } = require('/models/lib/injectionDetect');

// The refusal: a well-formed selector that cannot match anything. Frozen so a
// caller cannot mutate the shared object into one that matches something.
export const MATCH_NOTHING = Object.freeze({ _id: Object.freeze({ $in: Object.freeze([]) }) });

// True when `selector` is an attempt to make the database run something rather
// than a query. `where` names the call site and only reaches the canary record,
// so an operator can see WHICH surface was probed.
export function selectorIsInjection(selector, where) {
  const verdict = classifySelector(selector);
  if (!verdict.injection && !hasWhere(selector)) return false;
  tripCanary('injection.nosql-selector', {
    detail: injectionDetail(
      verdict.injection ? verdict : { kind: 'execution', operators: ['$where'] },
      where,
    ),
  });
  return true;
}

// The whole pattern in one call, since every one of the nine call sites wants
// exactly this: hand back the selector, or a selector that matches nothing.
export function safeSelector(selector, where) {
  return selectorIsInjection(selector, where) ? MATCH_NOTHING : selector;
}

export default { MATCH_NOTHING, selectorIsInjection, safeSelector };
