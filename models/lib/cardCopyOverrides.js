'use strict';

// The copy dialog edits text, never the identity/placement used to load children
// or the transformed document's methods. Retain its prototype without mutating
// the source object returned by ReactiveCache.
function cardWithCopyOverrides(card, values) {
  if (!values || Object.getPrototypeOf(values) !== Object.prototype ||
      Object.keys(values).some(key => !['title', 'description'].includes(key) || typeof values[key] !== 'string')) {
    const error = new Error('Invalid card copy overrides');
    // Malformed title/description text can come from a mistaken bulk-copy form.
    // Only attempts to supply fields outside that contract are security events.
    error.securityAttempt = !!values && typeof values === 'object' &&
      Object.keys(values).some(key => !['title', 'description'].includes(key));
    throw error;
  }
  return Object.assign(Object.create(Object.getPrototypeOf(card)), card, values);
}
module.exports = { cardWithCopyOverrides };
