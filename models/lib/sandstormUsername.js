'use strict';

// Pure helpers for deriving a unique WeKan username from a Sandstorm
// preferredHandle (used by the Users.after.insert hook in sandstorm.js), split
// out so they can be unit-tested in plain Node (tests/*.test.cjs) without a
// Meteor context.
//
// Fixes #574 "Sandstorm - generation of unique usernames":
//  - The uniqueness probe must be CASE-INSENSITIVE. Meteor usernames are
//    case-preserving but case-insensitively unique, while the old exact-match
//    query was case-sensitive: an existing 'Max' did not stop a new 'max',
//    producing two accounts that Meteor's account machinery considers the
//    same username.
//  - The handle must be regex-escaped before interpolation into the probe so
//    a handle containing regex metacharacters is matched literally (Sandstorm
//    promises lower-case ASCII letters/digits/underscores, but we must not
//    rely on that for query correctness).
//  - The probe -> update window is racy: a concurrent insert can claim the
//    probed name between our find and our update. accounts-base keeps a
//    unique index on `username`, so the losing update throws a MongoDB
//    E11000 duplicate-key error; instead of letting that abort the insert
//    hook we catch it and retry with the next appended number.

// 'max' + 0 -> 'max', 'max' + 1 -> 'max1', ... (historical numbering: the
// first fallback is 'max1', there is no 'max0').
function generateUniqueUsername(username, appendNumber) {
  return username + String(appendNumber === 0 ? '' : appendNumber);
}

// Escape regex metacharacters so the text is matched literally.
function escapeForRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Anchored, case-insensitive matcher for a username candidate, safe to put in
// a Mongo `username:` selector.
function usernameCaseInsensitiveRegex(username) {
  return new RegExp(`^${escapeForRegex(username)}$`, 'i');
}

// True for MongoDB's duplicate-key error (unique index violation) in the
// shapes the Node driver / Meteor surface it: numeric code 11000/11001, or an
// E11000 marker in the message/errmsg.
function isDuplicateKeyError(error) {
  if (!error) return false;
  if (error.code === 11000 || error.code === 11001) return true;
  const text = `${error.message || ''} ${error.errmsg || ''}`;
  return text.includes('E11000') || text.includes('E11001');
}

// Walk appendNumber upward until `isTakenAsync(candidate)` reports the name
// free, then hand the candidate to `claimAsync(candidate)` (the DB update).
// If claiming throws a duplicate-key error — another session raced us to the
// same name — move on to the next number instead of crashing. Any other error
// propagates unchanged. Resolves to the username that was actually claimed.
async function claimUniqueUsername(base, isTakenAsync, claimAsync) {
  for (let appendNumber = 0; ; appendNumber += 1) {
    const candidate = generateUniqueUsername(base, appendNumber);
    if (await isTakenAsync(candidate)) {
      continue;
    }
    try {
      await claimAsync(candidate);
      return candidate;
    } catch (error) {
      if (!isDuplicateKeyError(error)) {
        throw error;
      }
      // Lost the race for this candidate; try the next number.
    }
  }
}

module.exports = {
  generateUniqueUsername,
  escapeForRegex,
  usernameCaseInsensitiveRegex,
  isDuplicateKeyError,
  claimUniqueUsername,
};
