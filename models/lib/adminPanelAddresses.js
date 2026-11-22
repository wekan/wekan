'use strict';

// Admin Panel / Settings / Privacy and security / Allowed addresses
// (docs/Features/Admin-Panel/Admin-Panel-Allowed-Addresses.md): the IPv4 and
// IPv6 addresses, and CIDR ranges of them, from which the Admin Panel and the
// admin REST API can be used. An empty list is any address.
//
// From any other address a site administrator is a member like any other:
// their boards work, and every check of "is this user a site administrator"
// answers no. That is enforced where every one of those checks reads it - the
// user document (server/adminPanelAddresses.js) - so no admin method,
// publication or REST endpoint has to remember to ask.
//
// The address and range rules are the Cloud Panel's (models/lib/cloudAddresses.js),
// not a second copy of them. This module adds what is particular to the Admin
// Panel: the environment override, the lockout check, and how a user query is
// rewritten so the caller reads as a non-administrator.
//
// Pure - no Meteor - so the browser (the lockout warning before saving), the
// server and tests/adminPanelAddresses.test.cjs share it.

const A = require('./cloudAddresses');

const ENV_NAME = 'ADMIN_PANEL_ALLOWED_IP_ADDRESSES';

/**
 * The server's own word, which wins over the Admin Panel list:
 *   unset or empty  -> null: the Admin Panel list decides;
 *   "any"           -> { any: true }: no restriction, whatever the list says -
 *                      the way back in for an operator who saved a list that
 *                      no longer has their address;
 *   a list          -> { list }: these entries, whatever the Admin Panel says.
 *                      An entry that is not an address or a range matches
 *                      nothing, so a mistyped list refuses rather than allows.
 */
function envOverride(env) {
  const raw = env && typeof env[ENV_NAME] === 'string' ? env[ENV_NAME].trim() : '';
  if (!raw) return null;
  if (raw.toLowerCase() === 'any') return { any: true, list: [] };
  const list = raw.split(/[\s,;]+/).map(v => v.trim()).filter(Boolean);
  const invalid = list.filter(entry => { try { A.parseEntry(entry); return false; } catch (e) { return true; } });
  return { any: false, list, invalid };
}

/** The list in force: { list, source: 'env-any' | 'env' | 'settings' }. */
function effectiveList(stored, env) {
  const override = envOverride(env);
  if (override && override.any) return { list: [], source: 'env-any' };
  if (override) return { list: override.list, source: 'env' };
  return { list: Array.isArray(stored) ? stored.filter(e => typeof e === 'string' && e.trim()) : [], source: 'settings' };
}

/** May the Admin Panel be used from this address? Always, with no list. */
function addressAllowed(address, list) {
  return A.addressAllowed(address, list);
}

/**
 * Saving: the list as typed, canonical, or an error. Refused when it does not
 * have the address of whoever saves it - saving it would lock them out at
 * once - with the same words as the Cloud Panel.
 * Returns { ok: true, list } or { ok: false, reason: 'invalid' | 'lockout', message }.
 */
function saveDecision(value, yourAddress) {
  let list;
  try {
    list = A.normalizeAllowedAddresses(value);
  } catch (e) {
    return { ok: false, reason: 'invalid', message: e.message };
  }
  if (list.length && !A.addressAllowed(yourAddress, list)) {
    return { ok: false, reason: 'lockout', message: `Your address ${yourAddress} is not in the list: saving it would lock you out` };
  }
  return { ok: true, list };
}

// ------------------------------------------------------------ the user query

const LOGICAL = ['$and', '$or', '$nor'];

/** Does this user selector say anything about isAdmin, at any depth? */
function mentionsIsAdmin(selector, depth = 0) {
  if (!selector || typeof selector !== 'object' || depth > 20) return false;
  if (Array.isArray(selector)) return selector.some(s => mentionsIsAdmin(s, depth + 1));
  return Object.keys(selector).some(key => key === 'isAdmin' || key.startsWith('isAdmin.')
    || (LOGICAL.includes(key) && mentionsIsAdmin(selector[key], depth + 1)));
}

// Would a document whose isAdmin is false match this one condition on isAdmin?
// The operators a user query uses; anything else answers no, so an unknown
// condition never makes a caller an administrator.
function matchesFalse(cond) {
  if (cond === false) return true;
  if (cond === null || typeof cond !== 'object' || Array.isArray(cond) || cond instanceof RegExp) return false;
  const ops = Object.keys(cond);
  if (!ops.length || !ops.every(op => op.startsWith('$'))) return false;
  return ops.every(op => {
    const v = cond[op];
    switch (op) {
      case '$eq': return v === false;
      case '$ne': return v !== false;
      case '$in': return Array.isArray(v) && v.includes(false);
      case '$nin': return Array.isArray(v) && !v.includes(false);
      case '$exists': return !!v;
      case '$not': return !matchesFalse(v);
      case '$type': return v === 'bool' || v === 8 || (Array.isArray(v) && (v.includes('bool') || v.includes(8)));
      default: return false;
    }
  });
}

// A selector that matches every document, and one that matches none.
const ALWAYS = { _id: { $exists: true } };
const NEVER = { _id: { $exists: false } };

/**
 * The selector as it reads for a user whose isAdmin is false: every
 * condition on isAdmin replaced by a constant, everything else kept.
 */
function asNonAdmin(selector, depth = 0) {
  if (!selector || typeof selector !== 'object' || Array.isArray(selector) || depth > 20) return selector;
  const parts = [];
  for (const [key, value] of Object.entries(selector)) {
    if (key === 'isAdmin') parts.push(matchesFalse(value) ? ALWAYS : NEVER);
    else if (key.startsWith('isAdmin.')) parts.push(NEVER);
    else if (LOGICAL.includes(key) && Array.isArray(value)) parts.push({ [key]: value.map(s => asNonAdmin(s, depth + 1)) });
    else parts.push({ [key]: value });
  }
  if (!parts.length) return {};
  return parts.length === 1 ? parts[0] : { $and: parts };
}

/**
 * A user query, for a caller who uses WeKan from an address the Admin Panel
 * is not allowed at: the caller's own document answers as if its isAdmin
 * were false, every other user's as it is. With no callerId (a plain HTTP
 * request whose login is not known yet) every user answers as a non-admin.
 * A selector that does not mention isAdmin is returned as it is.
 */
function restrictSelector(selector, callerId) {
  if (!mentionsIsAdmin(selector)) return selector;
  if (!callerId) return asNonAdmin(selector);
  return { $or: [
    { $and: [{ _id: { $ne: callerId } }, selector] },
    { $and: [{ _id: callerId }, asNonAdmin(selector)] },
  ] };
}

/**
 * A user document as the caller reads it: their own (or, with no callerId,
 * everybody's) isAdmin true reads false. Returns a copy when it changes it,
 * the same document when not.
 */
function restrictDocument(doc, callerId) {
  if (!doc || typeof doc !== 'object' || doc.isAdmin !== true) return doc;
  if (callerId && doc._id !== callerId) return doc;
  return { ...doc, isAdmin: false };
}

module.exports = {
  ENV_NAME, envOverride, effectiveList, addressAllowed, saveDecision,
  mentionsIsAdmin, matchesFalse, asNonAdmin, restrictSelector, restrictDocument,
  normalizeAllowedAddresses: A.normalizeAllowedAddresses,
};
