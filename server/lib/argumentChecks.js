import { check, Match } from 'meteor/check';

// For a wrapper of Meteor's method and publication handlers that has to AWAIT
// before it calls the handler (server/requireTwoFactor.js, server/adminAudit.js).
//
// audit-argument-checks (.meteor/packages) asks, synchronously, the moment a
// handler returns, whether check() has seen every argument. An async wrapper
// returns its promise at its first await, before the handler it wraps has run,
// so the handler's own check() came too late: every call failed "Did not
// check() all arguments" - while the handler went on running, so sign-up
// created the account and still answered "Internal server error".
//
// So such a wrapper hands the audit over: deferArgumentAudit() before its
// first await counts the arguments as seen by the outer audit, and
// applyAudited() runs the handler under an audit of its own, which the handler
// has to satisfy exactly as it would unwrapped. A wrapper that does not await
// first needs neither: it calls the handler at once and the audit sees it.

export function deferArgumentAudit(args) {
  for (const arg of args) check(arg, Match.Any);
}

export function applyAudited(handler, context, args, description) {
  if (typeof Package !== 'undefined' && Package['audit-argument-checks']) {
    return Match._failIfArgumentsAreNotAllChecked(handler, context, args, description);
  }
  return handler.apply(context, args);
}
