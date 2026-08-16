import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import LoginAddresses from '/models/loginAddresses';

const { officeSummary, isSharedAddress } = require('/models/lib/loginTally');

// Each account at an office is shown as its INITIALS, or its avatar where it has
// one, and clicking it opens the same edit-user popup the People table opens. So
// the summary carries what that needs: the _id to open the popup with, the
// initials to draw, and the avatar URL when there is one. Resolved here rather
// than in the browser because the office row holds a username, and a client has
// no business publishing every account to look them up.
async function withIdentities(summary) {
  if (!summary || !summary.users.length) return summary;
  const names = summary.users.map(u => u.value);
  const docs = await Meteor.users.find(
    { username: { $in: names } },
    { fields: { username: 1, 'profile.initials': 1, 'profile.fullname': 1,
      'profile.avatarUrl': 1, loginDisabled: 1 } },
  ).fetchAsync();
  const byName = new Map(docs.map(d => [d.username, d]));
  summary.users = summary.users.map(entry => {
    const doc = byName.get(entry.value);
    if (!doc) return entry;                       // a deleted account still counts
    const profile = doc.profile || {};
    // The same rule models/users.js getInitials() uses, so an account looks the
    // same here as everywhere else: an explicit initials field, else the initials
    // of the full name, else the first letter of the username.
    const initials = profile.initials
      || (profile.fullname || '').split(/\s+/).filter(Boolean).map(w => w[0]).join('').toUpperCase()
      || (doc.username || '').slice(0, 1).toUpperCase();
    return {
      ...entry,
      userId: doc._id,
      fullname: profile.fullname || '',
      initials,
      avatarUrl: profile.avatarUrl || '',
      loginDisabled: !!doc.loginDisabled,
    };
  });
  return summary;
}

// Admin Panel → People: the addresses people log in from, grouped.
//
// An address several accounts use is an office, a VPN, a university or a
// carrier's NAT. This is what lets an admin see the shape of their own users -
// which offices exist, who is at each, how many times each of them has logged
// in and over what period - before drawing any conclusion from an address.
//
// It is also the evidence behind WeKan not blocking addresses: a security event
// blocks the ACCOUNT that caused it, because the alternative would take everyone
// behind a shared address off WeKan at once.

async function requireAdmin(context) {
  const user = context.userId && await Meteor.users.findOneAsync(context.userId);
  if (!user || !user.isAdmin) {
    throw new Meteor.Error('not-authorized', 'Admin only');
  }
}

if (Meteor.isServer) {
  Meteor.methods({
    // Every address, busiest first. `sharedOnly` narrows it to the ones with
    // several accounts behind them - the offices - which is the view worth
    // looking at when deciding anything about an address.
    async loginOffices(options) {
      check(options, Match.Optional({
        sharedOnly: Match.Optional(Boolean),
        limit: Match.Optional(Number),
        since: Match.Optional(Date),
      }));
      await requireAdmin(this);
      const opts = options || {};
      const selector = {};
      // The time range the caller asked about: rows last used since then.
      if (opts.since) selector.at = { $gte: opts.since };
      const rows = await LoginAddresses.find(selector, {
        sort: { count: -1 },
        limit: Math.min(Math.max(opts.limit || 200, 1), 1000),
      }).fetchAsync();
      const offices = rows
        .filter(row => (opts.sharedOnly ? isSharedAddress(row) : true))
        .map(officeSummary);
      return Promise.all(offices.map(withIdentities));
    },

    // One address, in full: who logs in from it and how often.
    async loginOffice(address) {
      check(address, String);
      await requireAdmin(this);
      const row = await LoginAddresses.findOneAsync({ address });
      return row ? withIdentities(officeSummary(row)) : null;
    },
  });
}
