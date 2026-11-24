import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { WebApp } from 'meteor/webapp';
import { check, Match } from 'meteor/check';
import { ensureIndex } from '/server/lib/mongoStartup';

// The data-access log (WP-11, models/lib/dataAccessLog.js): every export
// route that answers 200 adds one to the row of that person, day, kind and
// target. Watched here, in front of every route, rather than in each of the
// eleven routes, so a new export cannot be added without being counted - its
// path only has to be in ROUTES.
//
// The person is the one the request's login token belongs to; a public
// board's export needs none, and is counted with its address only.
const { classifyExport, foldUpdate } = require('/models/lib/dataAccessLog');
const { writeStdout } = require('/models/lib/auditStdout');
const { resolveClientKey } = require('/server/lib/loginAttemptThrottle');

export const DataAccessLog = new Mongo.Collection('dataAccessLog');

const PER_PAGE = 50;
const DAY_MS = 24 * 60 * 60 * 1000;

// Who the request's login token belongs to, through the same guard every
// route uses (server/lib/activeUser.js).
async function userOfToken(token, req) {
  if (typeof token !== 'string' || !token || token.length > 10000) return null;
  return require('/server/lib/activeUser').activeUserByToken(token, 'export', req);
}

// The path and the query of a request, without inventing an origin for it.
function splitUrl(url) {
  const raw = String(url || '');
  const q = raw.indexOf('?');
  return {
    pathname: q < 0 ? raw : raw.slice(0, q),
    query: Object.fromEntries(new URLSearchParams(q < 0 ? '' : raw.slice(q + 1))),
  };
}

export async function recordDataAccess(req, kind, target) {
  try {
    const query = req.query || splitUrl(req.url).query;
    const user = await userOfToken(query.authToken, req);
    const ip = resolveClientKey({ headers: req.headers, socketAddress: req.socket && req.socket.remoteAddress,
      forwardedCount: process.env.HTTP_FORWARDED_COUNT }) || '';
    const at = new Date();
    const { selector, modifier } = foldUpdate({
      userId: user && user._id, username: user && user.username, ip, kind, target, at,
    });
    await DataAccessLog.rawCollection().updateOne(selector, modifier, { upsert: true });
    writeStdout('data-access', { at, userId: user && user._id, username: user && user.username, ip, kind, target });
  } catch (e) {
    // The log must never change what the export did or answered.
    console.error('[data-access] could not record', kind, e && e.message);
  }
}

// In front of every route: an export is counted once its answer has gone out
// with 200. A refused one is already in Problems / Security or the Audit log.
WebApp.rawHandlers.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  let parsed;
  try { parsed = splitUrl(req.url); } catch (e) { return next(); }
  const hit = classifyExport(parsed.pathname, parsed.query);
  if (hit) {
    res.once('finish', () => {
      if (res.statusCode === 200) void recordDataAccess(req, hit.kind, hit.target);
    });
  }
  return next();
});

Meteor.methods({
  // Admin Panel / People / Audit log / Data access: one page, newest first; a
  // search matches the person, the kind or the target. Site administrators.
  async adminDataAccessPage(options = {}) {
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
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      selector.$or = [{ username: re }, { kind: re }, { target: re }, { ip: re }];
    }
    const total = await DataAccessLog.find(selector).countAsync();
    const rows = await DataAccessLog.find(selector, {
      sort: { at: -1 }, skip: (page - 1) * PER_PAGE, limit: PER_PAGE,
    }).fetchAsync();
    return { rows, total, page, perPage: PER_PAGE };
  },
});

// Kept as long as the audit log (ADMIN_AUDIT_RETENTION_DAYS).
async function prune() {
  try {
    const { retentionDays, cutoffDate } = require('/models/lib/retentionSettings');
    const cutoff = cutoffDate(retentionDays('ADMIN_AUDIT_RETENTION_DAYS', { ADMIN_AUDIT_RETENTION_DAYS: process.env.ADMIN_AUDIT_RETENTION_DAYS }));
    if (!cutoff) return;
    await DataAccessLog.removeAsync({ at: { $lt: cutoff } });
  } catch (e) {
    console.error('[data-access] pruning failed:', e && e.message);
  }
}

Meteor.startup(async () => {
  await ensureIndex(DataAccessLog, { at: -1 });
  Meteor.setInterval(prune, DAY_MS);
  Meteor.defer(prune);
});
