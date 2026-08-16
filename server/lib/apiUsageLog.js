// Counting REST API calls into the `api` stream of Admin Panel → Problems.
//
// The decisions are in models/lib/apiUsage.js - what an endpoint is called, and
// why calls are accumulated rather than written one by one. This is the part
// that touches Express and Mongo.
//
// WHERE IT SITS. One middleware, in front of every /api route, that counts on
// the response's `finish` event rather than on the way in. Two reasons, and both
// matter: by then Express has filled `req.route.path`, so the name is the route
// PATTERN (`/api/boards/:boardId`) rather than the concrete path - which is what
// keeps one row per endpoint instead of one per board - and by then
// authentication has run, so the call has a username. A route cannot be added
// without being counted, because nothing is registered per route.
//
// It must never affect the request. Everything here is wrapped, the counting is
// in memory, and the write happens on a timer in another tick.

import { Meteor } from 'meteor/meteor';
import { foldEvent } from '/server/lib/eventLogFold';

const { apiName, isApiRequest, UsageAccumulator } = require('/models/lib/apiUsage');

// How often counts are written. Long enough that a burst is one write, short
// enough that the report is not visibly stale while somebody is watching it.
const FLUSH_MS = Number(process.env.WEKAN_API_USAGE_FLUSH_MS) || 10000;

// A flush is also forced at this many distinct rows, so a sudden spread does not
// wait out the timer holding everything in memory.
const FLUSH_AT_ROWS = 200;

const accumulator = new UsageAccumulator();
let timer = null;

// The address the call came from, resolved the same spoofing-safe way as the
// login throttle and the lockout: X-Forwarded-For only as far as
// HTTP_FORWARDED_COUNT says to trust it, and the socket address otherwise. A
// column an attacker can write by sending a header is worse than no column.
function clientAddress(req) {
  const hops = parseInt(process.env.HTTP_FORWARDED_COUNT, 10);
  const forwarded = req.headers && req.headers['x-forwarded-for'];
  if (hops > 0 && forwarded) {
    const parts = String(forwarded).split(',').map(s => s.trim()).filter(Boolean);
    const idx = parts.length - hops;
    if (idx >= 0 && parts[idx]) return parts[idx];
  }
  return (req.connection && req.connection.remoteAddress)
    || (req.socket && req.socket.remoteAddress) || '';
}

// userId -> username, for one flush. The account is what a row is FOR, so its
// name has to be on the row; looking it up per flush costs one query per
// distinct caller in that batch, which is a handful.
async function usernamesFor(userIds) {
  const names = new Map();
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return names;
  const users = await Meteor.users.find(
    { _id: { $in: ids } }, { fields: { username: 1 } },
  ).fetchAsync();
  for (const user of users) names.set(user._id, user.username || '');
  return names;
}

async function flush() {
  const rows = accumulator.drain();
  if (!rows.length) return;
  const names = await usernamesFor(rows.map(r => r.userId));
  for (const row of rows) {
    // Through the SAME fold as every other stream, so an API row is a summary
    // with a count, a window and a per-actor tally like all the rest - and a
    // change to how summaries work reaches this one too.
    //
    // `count` is what the fold multiplies by: the accumulator has already
    // counted this endpoint's calls, so this is one write for all of them.
    await foldEvent({
      stream: 'api',
      api: row.name,
      // The account is part of the row's IDENTITY here, which is the deliberate
      // exception (models/lib/apiUsage.js). It is the ACCOUNT ID, not the name:
      // a rename would otherwise split one account's history into two rows, and
      // an unauthenticated call has no name at all. The name is carried beside
      // it as a display field, the way every other stream carries one.
      apiUserId: row.userId || '',
      username: names.get(row.userId) || '',
      userId: row.userId || '',
      // ip only: the fold splits it into ipv4/ipv6 for every stream.
      ip: row.ip || '',
      count: row.count,
      at: row.at,
    });
  }
}

function scheduleFlush() {
  if (timer) return;
  timer = Meteor.setTimeout(() => {
    timer = null;
    // Fire and forget: a usage count must never be able to break a request or
    // stop the server, and there is nothing to do about a failed write except
    // count the next one.
    Promise.resolve()
      .then(flush)
      .catch(e => {
        if (process.env.DEBUG === 'true') console.warn('api usage flush failed:', e && e.message);
      });
  }, FLUSH_MS);
}

// The middleware. Installed by server/apiMiddleware.js, in front of the routes.
export function apiUsageMiddleware(req, res, next) {
  try {
    if (isApiRequest(req.url)) {
      res.on('finish', () => {
        try {
          accumulator.add({
            // req.route is set by Express once a handler has matched, which by
            // `finish` it has - or has not, and then the call is counted under
            // the one "(no route)" name rather than under a path an attacker
            // chose.
            name: apiName(req.method, req.route && req.route.path),
            userId: req.userId || '',
            ip: clientAddress(req),
            at: new Date(),
          });
          if (accumulator.size >= FLUSH_AT_ROWS) {
            Promise.resolve().then(flush).catch(() => {});
          } else {
            scheduleFlush();
          }
        } catch (e) {
          // Counting a call must never break the call it counted.
        }
      });
    }
  } catch (e) {
    // ditto
  }
  next();
}

// Exported for the tests and for a clean shutdown; nothing else calls it.
export { flush as flushApiUsage, accumulator as apiUsageAccumulator };
