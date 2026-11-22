// Admin Panel / Settings / Privacy and security / Allowed addresses
// (models/lib/adminPanelAddresses.js,
// docs/Features/Admin-Panel/Admin-Panel-Allowed-Addresses.md).
//
// WHERE IT IS ENFORCED. Not in the admin methods, publications and REST
// endpoints one by one - there are hundreds of them, and the next one would
// be the one that forgot. Every one of them decides "is this a site
// administrator" from the caller's user document, read through
// Meteor.users.findOneAsync (Meteor.userAsync, ReactiveCache.getUser and the
// allow rules all end there). So that read is where the list is applied: for
// a caller at an address the Admin Panel is not allowed at, their own user
// document reads isAdmin: false, and a query that asks for isAdmin answers as
// it would for a non-administrator. Their boards work; nothing that needs a
// site administrator does. tests/adminPanelAddresses.test.cjs pins that no
// admin check reads the flag past this point (a cursor, the raw collection).
//
// WHO THE CALLER IS: the DDP method or publication running, with the
// connection's address; else the plain HTTP request running
// (server/lib/requestReportContext.js), with its login once it is known. No
// caller - startup, timers, server-side jobs - is not restricted.
//
// THE ADDRESS is resolved the way every other guard of WeKan resolves it:
// X-Forwarded-For only as far as HTTP_FORWARDED_COUNT trusts it
// (server/lib/loginAttemptThrottle.js resolveClientKey).

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { DDP } from 'meteor/ddp';
import { currentReportRequest } from '/server/lib/requestReportContext';

const P = require('/models/lib/adminPanelAddresses');
const { resolveClientKey } = require('/server/lib/loginAttemptThrottle');
const { AUDITED_METHODS, auditedMutationMethods } = require('/models/lib/adminAudit');

const AUDITED = new Set([...AUDITED_METHODS, ...auditedMutationMethods()]);

// ------------------------------------------------------------ the list in force

function envNow() {
  return { ADMIN_PANEL_ALLOWED_IP_ADDRESSES: process.env.ADMIN_PANEL_ALLOWED_IP_ADDRESSES };
}

// Read on every admin check, so kept for a few seconds; a save here clears it
// at once, another server of the same database sees it within CACHE_MS.
const CACHE_MS = 5000;
let cache = { at: 0, stored: [] };
let refreshing = null;

async function storedList() {
  if (Date.now() - cache.at < CACHE_MS) return cache.stored;
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const Settings = require('/models/settings').default;
        const doc = await Settings.findOneAsync({}, { fields: { adminPanelAllowedAddresses: 1 } });
        cache = { at: Date.now(), stored: (doc && Array.isArray(doc.adminPanelAllowedAddresses)) ? doc.adminPanelAllowedAddresses : [] };
      } catch (e) {
        // Keep the last list: a database hiccup must not lift the restriction.
        cache = { ...cache, at: Date.now() };
      } finally {
        refreshing = null;
      }
    })();
  }
  await refreshing;
  return cache.stored;
}

async function listNow() {
  return P.effectiveList(await storedList(), envNow());
}

// ------------------------------------------------------------ who is asking

export function addressOfConnection(connection) {
  return resolveClientKey({
    headers: (connection && connection.httpHeaders) || {},
    socketAddress: connection && connection.clientAddress,
    forwardedCount: process.env.HTTP_FORWARDED_COUNT,
  });
}

export function addressOfRequest(req) {
  return resolveClientKey({
    headers: (req && req.headers) || {},
    socketAddress: (req && req.socket && req.socket.remoteAddress) || (req && req.connection && req.connection.remoteAddress),
    forwardedCount: process.env.HTTP_FORWARDED_COUNT,
  });
}

// The caller of the work running now: { mark, userId, address, name } or null.
function currentCaller() {
  const method = DDP._CurrentMethodInvocation && DDP._CurrentMethodInvocation.get();
  if (method && method.connection) {
    // Signing in is not an admin action, and an OIDC or LDAP login writes the
    // admin flag it reads back: it must read the stored one.
    if (method.name === 'login') return null;
    return { mark: method, userId: method.userId || null, address: addressOfConnection(method.connection), name: method.name || '' };
  }
  const publication = DDP._CurrentPublicationInvocation && DDP._CurrentPublicationInvocation.get();
  if (publication && publication.connection) {
    return { mark: publication, userId: publication.userId || null, address: addressOfConnection(publication.connection), name: `publish:${publication._name || ''}` };
  }
  const req = currentReportRequest();
  if (req) {
    return { mark: req, userId: req.userId || req.requestUserId || null, address: addressOfRequest(req),
      name: `rest:${req.method || ''} ${String(req.originalUrl || req.url || '').split('?')[0].slice(0, 100)}`, http: true };
  }
  return null;
}

// Is this user, as stored, a site administrator? Read past the restriction,
// kept briefly: it is asked on every user read of a restricted caller.
const original = {};
const adminCache = new Map();
async function storedIsAdmin(userId) {
  const hit = adminCache.get(userId);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.admin;
  const doc = await original.findOneAsync.call(Meteor.users, { _id: userId }, { fields: { _id: 1, isAdmin: 1 } });
  const admin = !!(doc && doc.isAdmin === true);
  if (adminCache.size > 5000) adminCache.clear();
  adminCache.set(userId, { admin, at: Date.now() });
  return admin;
}

/**
 * The restriction for the work running now, or null when there is none:
 * no caller, no list, an allowed address, or (with a known login) a caller
 * who is not a site administrator anyway. { callerId, address, caller }.
 */
async function restrictionNow() {
  const caller = currentCaller();
  if (!caller) return null;
  const { list } = await listNow();
  if (!list.length || P.addressAllowed(caller.address, list)) return null;
  if (caller.userId) {
    if (!(await storedIsAdmin(caller.userId))) return null;
    return { callerId: caller.userId, address: caller.address, caller };
  }
  // A DDP caller with no login has no user document of its own to restrict.
  if (!caller.http) return null;
  return { callerId: null, address: caller.address, caller };
}

/** For the Admin Panel's own page: is the caller a site administrator kept out by the list? */
export async function adminRefusedHere() {
  const r = await restrictionNow();
  return !!(r && r.callerId);
}

// ------------------------------------------------------------ Problems

// Once per method call, publication or request: one refused page load is one
// attempt, however many checks it made.
const recorded = new WeakSet();
function recordRefusal(restriction, why) {
  const { caller } = restriction;
  if (!caller || recorded.has(caller.mark)) return;
  recorded.add(caller.mark);
  try {
    require('/server/lib/securityLog').record({
      key: 'authz.admin-panel-address', action: 'blocked', source: caller.name || 'admin',
      detail: `A site administrator action from ${restriction.address}, which is not an Admin Panel allowed address (${why})`,
      userId: restriction.callerId || undefined, ip: restriction.address,
    });
  } catch (e) { /* logging must never break the guard */ }
}

// ------------------------------------------------------------ the read

function install() {
  if (original.findOneAsync) return;
  original.findOneAsync = Meteor.users.findOneAsync;
  Meteor.users.findOneAsync = async function adminPanelAddressFindOne(selector, ...rest) {
    const restriction = await restrictionNow();
    if (!restriction) return original.findOneAsync.call(this, selector, ...rest);
    const { callerId } = restriction;
    const asked = P.mentionsIsAdmin(selector);
    const doc = await original.findOneAsync.call(this, P.restrictSelector(selector, callerId), ...rest);
    if (asked && callerId) {
      // A check that asked for the caller as an administrator, and got no.
      const asStored = await original.findOneAsync.call(this, selector, { fields: { _id: 1 } });
      if (asStored && asStored._id === callerId && (!doc || doc._id !== callerId)) recordRefusal(restriction, 'admin check');
    }
    const out = P.restrictDocument(doc, callerId);
    if (out !== doc && restriction.caller && AUDITED.has(restriction.caller.name)) recordRefusal(restriction, 'admin method');
    return out;
  };
}
install();

// ------------------------------------------------------------ the Admin Panel

async function requireSiteAdmin(self) {
  // Through the restricted read: from an address that is not allowed, no.
  const user = self.userId && await Meteor.users.findOneAsync(self.userId, { fields: { isAdmin: 1 } });
  if (!user || user.isAdmin !== true) throw new Meteor.Error('not-authorized');
}

Meteor.methods({
  // The pane: the list, where it comes from, and the caller's own address.
  async getAdminPanelAllowedAddresses() {
    await requireSiteAdmin(this);
    const stored = await storedList();
    const { list, source } = P.effectiveList(stored, envNow());
    const override = P.envOverride(envNow());
    return { addresses: stored, inForce: list, source, invalidEnv: (override && override.invalid) || [],
      yourAddress: addressOfConnection(this.connection) };
  },
  // Refused when the caller's own address is not in the new list: saving it
  // would lock them out at once (the Cloud Panel's rule). Client writes of the
  // field are denied below, so this is the only way to set it.
  async saveAdminPanelAllowedAddresses(value) {
    check(value, Match.OneOf(String, [String]));
    await requireSiteAdmin(this);
    const yours = addressOfConnection(this.connection);
    const decision = P.saveDecision(value, yours);
    if (!decision.ok) throw new Meteor.Error(decision.reason === 'lockout' ? 'admin-panel-address-lockout' : 'invalid', decision.message, { address: yours });
    const Settings = require('/models/settings').default;
    const setting = await Settings.findOneAsync({});
    if (!setting) throw new Meteor.Error('settings-not-found');
    await Settings.updateAsync(setting._id, { $set: { adminPanelAllowedAddresses: decision.list } });
    cache = { at: 0, stored: [] };
    return { addresses: decision.list };
  },
  // For the Admin Panel's tabs: is this signed-in site administrator kept out
  // here? Says nothing to anybody else, and never the list.
  async adminPanelAddressStatus() {
    if (!this.userId) return { refused: false };
    const refused = await adminRefusedHere();
    return refused ? { refused: true, yourAddress: addressOfConnection(this.connection) } : { refused: false };
  },
});

Meteor.startup(() => {
  const Settings = require('/models/settings').default;
  // Settings' allow rule lets a site administrator write any field from the
  // browser; this one only through the method above, which checks the lockout.
  Settings.deny({
    update(userId, doc, fieldNames) {
      return Array.isArray(fieldNames) && fieldNames.includes('adminPanelAllowedAddresses');
    },
    insert(userId, doc) {
      return !!(doc && doc.adminPanelAllowedAddresses !== undefined);
    },
  });
  const override = P.envOverride(envNow());
  if (override && override.invalid && override.invalid.length) {
    console.warn(`${P.ENV_NAME}: not an address or a range, so matching nothing: ${override.invalid.join(', ')}`);
  }
});
