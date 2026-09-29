'use strict';

// What a board-copy caller may change on the copy: its title, sort position,
// board type (a template may become a board) and whether cards are copied.
// Everything else - above all _id, which board.copy() uses to load the source
// lists, cards and children - belongs to the authorized source board. Mirrors
// models/lib/cardCopyOverrides.js (CopyIdentityBleed).
const CHECKS = {
  title: value => typeof value === 'string',
  sort: value => typeof value === 'number' && Number.isFinite(value),
  type: value => value === 'board' || value === 'template-board',
  withoutCards: value => typeof value === 'boolean',
  // Validated separately by normalizeBoardCopyOptions.
  copyOptions: () => true,
};

function boardCopyProperties(values) {
  if (!values || typeof values !== 'object' || Array.isArray(values) ||
      Object.getPrototypeOf(values) !== Object.prototype) {
    const error = new Error('Invalid board copy properties');
    error.securityAttempt = false;
    throw error;
  }
  const unknown = Object.keys(values).filter(key => !Object.prototype.hasOwnProperty.call(CHECKS, key));
  const malformed = Object.keys(values).filter(key => CHECKS[key] && values[key] !== undefined && !CHECKS[key](values[key]));
  if (unknown.length || malformed.length) {
    const error = new Error('Invalid board copy properties');
    // Only fields outside the contract are an attempt; a wrong type on a
    // supported field is an ordinary input error.
    error.securityAttempt = unknown.length > 0;
    throw error;
  }
  const clean = {};
  for (const key of Object.keys(values)) if (values[key] !== undefined) clean[key] = values[key];
  return clean;
}

// The board to copy, with the caller's supported changes applied to a
// separate object: the cached source board, and its _id, stay untouched.
function boardWithCopyProperties(board, values) {
  const { withoutCards, copyOptions, ...fields } = values;
  return Object.assign(Object.create(Object.getPrototypeOf(board)), board, fields);
}

module.exports = { boardCopyProperties, boardWithCopyProperties };
