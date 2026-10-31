import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import ShortPasswordLogins from '/models/shortPasswordLogins';
import { ensureIndex } from '/server/lib/mongoStartup';

// Admin Panel / Problems / Password length (models/lib/shortPasswordLogins.js
// says what a row is and what "fixed" means).
const { cleanFilter, filterSelector, shortLoginUpdate } = require('/models/lib/shortPasswordLogins');
const { addressOf } = require('/models/lib/loginTally');
// The same address resolver and location headers as every other login record
// (server/lib/loginTally.js): two answers to "where from" would not compare.
const { resolveClientKey } = require('/server/lib/loginAttemptThrottle');
const { locationFromHeaders } = require('/models/lib/geoHeaders');

const MAX_PAGE = 100;

export async function recordShortPasswordLogin(user, connection) {
  if (!user || !user._id) return;
  const raw = resolveClientKey({
    headers: connection && connection.httpHeaders,
    socketAddress: connection && connection.clientAddress,
    forwardedCount: process.env.HTTP_FORWARDED_COUNT,
  });
  const { value, family } = addressOf(raw);
  await ShortPasswordLogins.upsertAsync({ userId: user._id }, shortLoginUpdate({
    username: user.username, now: new Date(), address: value, family,
    location: locationFromHeaders(connection && connection.httpHeaders),
  }));
}

// The account's password changed: an open row is fixed. A row already fixed
// keeps the date it was first fixed.
export async function markShortPasswordFixed(userId) {
  if (!userId) return;
  await ShortPasswordLogins.updateAsync({ userId, fixedAt: null }, { $set: { fixedAt: new Date() } });
}

async function requireSiteAdmin(userId) {
  const user = userId && await Meteor.users.findOneAsync(userId, { fields: { isAdmin: 1, loginDisabled: 1 } });
  if (!user || user.isAdmin !== true || user.loginDisabled === true) throw new Meteor.Error('not-authorized');
}

Meteor.methods({
  // One page of the table, newest sign-in first. Site administrators only.
  async shortPasswordLoginsPage(options = {}) {
    check(options, Match.ObjectIncluding({
      filter: Match.Optional(String),
      search: Match.Optional(String),
      limit: Match.Optional(Match.Integer),
      skip: Match.Optional(Match.Integer),
    }));
    await requireSiteAdmin(this.userId);
    const selector = filterSelector(cleanFilter(options.filter));
    const search = String(options.search || '').trim().slice(0, 100);
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      selector.$or = [{ username: re }, { ipv4: re }, { ipv6: re }];
    }
    const limit = Math.min(Math.max(options.limit || 25, 1), MAX_PAGE);
    const skip = Math.max(options.skip || 0, 0);
    const total = await ShortPasswordLogins.find(selector).countAsync();
    const rows = await ShortPasswordLogins.find(selector, { sort: { at: -1 }, skip, limit }).fetchAsync();
    return { rows, total };
  },
});

Meteor.startup(async () => {
  await ensureIndex(ShortPasswordLogins, { userId: 1 }, { unique: true });
  await ensureIndex(ShortPasswordLogins, { fixedAt: 1, at: -1 });
});
