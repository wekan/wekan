// Record a SUCCESSFUL login: which address the account used, and which account
// the address was used by.
//
// Failures are not recorded here - those are the lockout's business
// (packages/wekan-accounts-lockout) and are already counted per address there.
// This is the record of ordinary use, and ordinary use is what tells an office
// apart from an attacker.
//
// Best-effort and never throws into the login: a login that succeeded must not
// fail because WeKan could not write down where it came from.

import { Meteor } from 'meteor/meteor';
import LoginAddresses from '/models/loginAddresses';

const {
  addressOf, tallyKey, MAX_ADDRESSES_PER_USER, MAX_USERS_PER_ADDRESS,
} = require('/models/lib/loginTally');
// The SAME address resolver the REST login throttle uses - X-Forwarded-For under
// HTTP_FORWARDED_COUNT, reading only the position `hops` from the right so a
// forged header cannot choose its own bucket. A third implementation of "who is
// this" would be a third answer, and the lockout, the throttle and this record
// must agree or an admin comparing them cannot.
const { resolveClientKey } = require('/server/lib/loginAttemptThrottle');
// Where the request came from, when a CDN in front of WeKan already resolved it
// (models/lib/geoHeaders.js). Display only, never a decision - see that file.
const { locationFromHeaders, locationLabel } = require('/models/lib/geoHeaders');

export async function recordLogin(user, connection) {
  const raw = resolveClientKey({
    headers: connection && connection.httpHeaders,
    socketAddress: connection && connection.clientAddress,
    forwardedCount: process.env.HTTP_FORWARDED_COUNT,
  });
  const { value, family } = addressOf(raw);
  if (!value || !user || !user._id) return;
  const now = new Date();
  const key = tallyKey(value);
  // "London" reads better than 100.100.100.100 for a place several accounts
  // share, and an admin recognises their own offices at a glance.
  const location = locationFromHeaders(connection && connection.httpHeaders);

  // On the USER: which addresses this account uses. Capped by counting into an
  // overflow rather than adding keys for ever - a laptop on a mobile network
  // changes address constantly.
  const existing = user.loginAddresses || {};
  const known = Object.keys(existing.entries || {});
  const userUpdate = known.includes(key) || known.length < MAX_ADDRESSES_PER_USER
    ? {
      $inc: { [`loginAddresses.entries.${key}.count`]: 1 },
      $set: {
        [`loginAddresses.entries.${key}.value`]: value,
        [`loginAddresses.entries.${key}.at`]: now,
        ...(family ? { [`loginAddresses.entries.${key}.family`]: family } : {}),
      },
      $setOnInsert: {},
    }
    : { $inc: { 'loginAddresses.overflow': 1 }, $set: {}, $setOnInsert: {} };
  if (!known.includes(key)) {
    userUpdate.$set[`loginAddresses.entries.${key}.firstAt`] = now;
  }
  if (location) {
    userUpdate.$set[`loginAddresses.entries.${key}.location`] = location;
  }
  delete userUpdate.$setOnInsert;
  await Meteor.users.updateAsync({ _id: user._id }, userUpdate);

  // On the ADDRESS: who uses it. The same shape the other way round.
  const row = await LoginAddresses.findOneAsync({ address: value }, { fields: { users: 1 } });
  const userKey = tallyKey(user.username || user._id);
  const namedUsers = Object.keys((row && row.users && row.users.entries) || {});
  const room = namedUsers.includes(userKey) || namedUsers.length < MAX_USERS_PER_ADDRESS;
  const set = { address: value, at: now };
  if (family === 'ipv4') set.ipv4 = value;
  if (family === 'ipv6') set.ipv6 = value;
  // The newest answer wins: a CDN's view of an address can change, and an office
  // that moves should stop being labelled with where it used to be.
  if (location) {
    set.location = location;
    set.locationLabel = locationLabel(location);
  }
  const inc = { count: 1 };
  if (room) {
    set[`users.entries.${userKey}.value`] = user.username || user._id;
    set[`users.entries.${userKey}.at`] = now;
    if (!namedUsers.includes(userKey)) set[`users.entries.${userKey}.firstAt`] = now;
    inc[`users.entries.${userKey}.count`] = 1;
  } else {
    inc['users.overflow'] = 1;
  }
  await LoginAddresses.upsertAsync({ address: value }, {
    $set: set, $inc: inc, $setOnInsert: { firstAt: now },
  });
}

// Never throws, never awaited by the login path.
export function recordLoginFireAndForget(user, connection) {
  try {
    const p = recordLogin(user, connection);
    if (p && typeof p.catch === 'function') {
      p.catch(e => {
        if (process.env.DEBUG === 'true') console.warn('loginTally failed:', e && e.message);
      });
    }
  } catch (e) {
    if (process.env.DEBUG === 'true') console.warn('loginTally failed:', e && e.message);
  }
}
