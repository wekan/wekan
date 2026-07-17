'use strict';

// Contract for the `createListAfter` Meteor method params (server/models/lists.js),
// mirrored as a pure function so the exact param shapes the clients send can be
// unit-tested without a Meteor runtime.
//
// Crucially this models Meteor `check`'s object-pattern rule: a MISSING key is only
// allowed when its sub-pattern is Match.Optional. title/boardId are required Strings;
// swimlaneId/afterListId/nextListId/type are optional (may be absent, undefined, or
// — for the id fields — null). The #6465 inline add-list composer omits nextListId,
// which is exactly what regressed with the previous non-Optional check.

const REQUIRED_STRING = ['title', 'boardId'];
const OPTIONAL_ID = ['swimlaneId', 'afterListId', 'nextListId']; // string | null | undefined | absent
const OPTIONAL_STRING = ['type']; // string | undefined | absent
const ALLOWED = new Set([...REQUIRED_STRING, ...OPTIONAL_ID, ...OPTIONAL_STRING]);

function validateCreateListParams(params) {
  if (!params || typeof params !== 'object' || Array.isArray(params)) return false;

  for (const k of REQUIRED_STRING) {
    if (typeof params[k] !== 'string') return false;
  }

  for (const k of OPTIONAL_ID) {
    if (k in params) {
      const v = params[k];
      if (!(v === null || v === undefined || typeof v === 'string')) return false;
    }
  }

  for (const k of OPTIONAL_STRING) {
    if (k in params) {
      const v = params[k];
      if (!(v === undefined || typeof v === 'string')) return false;
    }
  }

  for (const k of Object.keys(params)) {
    if (!ALLOWED.has(k)) return false; // no unexpected keys (check() rejects extras)
  }
  return true;
}

module.exports = { validateCreateListParams };
