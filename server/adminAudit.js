import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { ensureIndex } from '/server/lib/mongoStartup';
import { deferArgumentAudit, applyAudited } from '/server/lib/argumentChecks';

// Admin Panel / People / Audit log: every call of an administrative method by
// a site administrator, one document each. Which methods, and what of their
// arguments is kept (never a password or a secret), is in
// models/lib/adminAudit.js.
const { AUDITED_METHODS, AUDIT_KEEP_DAYS, auditArgs } = require('/models/lib/adminAudit');
const { resolveClientKey } = require('/server/lib/loginAttemptThrottle');

export const AdminAuditLog = new Mongo.Collection('adminAuditLog');

const PER_PAGE = 50;
const DAY_MS = 24 * 60 * 60 * 1000;
const WRAPPED = Symbol('adminAudit');

function clientAddress(connection) {
  if (!connection) return '';
  try {
    return resolveClientKey({
      headers: connection.httpHeaders,
      socketAddress: connection.clientAddress,
      forwardedCount: process.env.HTTP_FORWARDED_COUNT,
    }) || '';
  } catch (e) {
    return connection.clientAddress || '';
  }
}

async function record(invocation, actor, method, args, error) {
  try {
    await AdminAuditLog.insertAsync({
      at: new Date(),
      actorId: actor._id,
      actorUsername: actor.username || '',
      method,
      args: auditArgs(method, args),
      ok: !error,
      error: error ? String(error.error || error.message || error).slice(0, 200) : undefined,
      ip: clientAddress(invocation.connection),
    });
  } catch (e) {
    // The audit trail must never change what the method did or answered.
    console.error('[admin-audit] could not record', method, e && e.message);
  }
}

// Idempotent, like server/requireTwoFactor.js: runs at startup and again
// after every startup hook, for methods a later file defines in one.
export function wrapAuditedMethods() {
  const methods = Meteor.server.method_handlers;
  for (const name of AUDITED_METHODS) {
    const original = methods[name];
    if (!original || original[WRAPPED]) continue;
    methods[name] = function auditedMethod(...args) {
      if (!this.userId) return original.apply(this, args);
      // Awaits the actor first, so it hands audit-argument-checks over
      // (server/lib/argumentChecks.js).
      deferArgumentAudit(args);
      const call = () => applyAudited(original, this, args, `call to '${name}'`);
      return (async () => {
        // Asked BEFORE the call: removing one's own admin rights is audited too.
        const actor = await Meteor.users.findOneAsync(
          this.userId, { fields: { username: 1, isAdmin: 1 } });
        if (!actor || actor.isAdmin !== true) return call();
        try {
          const result = await call();
          await record(this, actor, name, args, null);
          return result;
        } catch (error) {
          await record(this, actor, name, args, error);
          throw error;
        }
      })();
    };
    // Keep the marks of any other wrapper (server/requireTwoFactor.js), so
    // neither wraps the other again on its second pass.
    for (const mark of Object.getOwnPropertySymbols(original)) methods[name][mark] = original[mark];
    methods[name][WRAPPED] = true;
  }
}

Meteor.methods({
  // One page of the trail, newest first; a search matches the administrator
  // or the action. Site administrators only - a per-tenant admin's actions
  // are in it, but the trail is the whole site's.
  async adminAuditLogPage(options = {}) {
    check(options, Match.ObjectIncluding({
      page: Match.Optional(Match.Integer),
      search: Match.Optional(String),
    }));
    const user = this.userId && await Meteor.users.findOneAsync(this.userId, { fields: { isAdmin: 1, loginDisabled: 1 } });
    if (!user || user.isAdmin !== true || user.loginDisabled === true) throw new Meteor.Error('error-notAuthorized');
    const page = Math.max(1, options.page || 1);
    const search = String(options.search || '').trim().slice(0, 100);
    const selector = {};
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(escaped, 'i');
      selector.$or = [{ actorUsername: re }, { method: re }, { args: re }];
    }
    const total = await AdminAuditLog.find(selector).countAsync();
    const rows = await AdminAuditLog.find(selector, {
      sort: { at: -1 }, skip: (page - 1) * PER_PAGE, limit: PER_PAGE,
    }).fetchAsync();
    return { rows, total, page, perPage: PER_PAGE };
  },
});

async function prune() {
  try {
    await AdminAuditLog.removeAsync({ at: { $lt: new Date(Date.now() - AUDIT_KEEP_DAYS * DAY_MS) } });
  } catch (e) {
    console.error('[admin-audit] pruning failed:', e && e.message);
  }
}

Meteor.startup(async () => {
  wrapAuditedMethods();
  Meteor.defer(wrapAuditedMethods);
  await ensureIndex(AdminAuditLog, { at: -1 });
  Meteor.setInterval(prune, DAY_MS);
  Meteor.defer(prune);
});
