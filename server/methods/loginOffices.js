import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import LoginAddresses from '/models/loginAddresses';
import * as tenantAdmin from '/models/lib/tenantAdmin';

const {
  officeSummary, tallyList, loginLocationsByCountry,
} = require('/models/lib/loginTally');

// The legacy address-grouped endpoint still uses this for loginOffice().
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

function initialsFor(user) {
  const profile = user.profile || {};
  return profile.initials
    || (profile.fullname || '').split(/\s+/).filter(Boolean)
      .map(word => word[0]).join('').toUpperCase()
    || (user.username || '').slice(0, 1).toUpperCase();
}

// One person with one child row per address. The per-user tally is the source
// of that person's count; LoginAddresses supplies the location last reported
// for the same address by a CDN or trusted reverse proxy.
function personSummary(user, byAddress) {
  const addresses = tallyList(user.loginAddresses);
  return {
    userId: user._id,
    username: user.username || user._id,
    fullname: (user.profile && user.profile.fullname) || '',
    initials: initialsFor(user),
    avatarUrl: (user.profile && user.profile.avatarUrl) || '',
    loginDisabled: !!user.loginDisabled,
    addresses: addresses.map(entry => {
      const doc = byAddress.get(entry.value) || {};
      return {
        address: entry.value,
        ipv4: doc.ipv4 || (entry.family === 'ipv4' ? entry.value : ''),
        ipv6: doc.ipv6 || (entry.family === 'ipv6' ? entry.value : ''),
        location: doc.location || null,
        locationLabel: doc.locationLabel || '',
        logins: entry.count || 0,
        firstAt: entry.firstAt,
        at: entry.at,
      };
    }),
    moreAddresses: (user.loginAddresses && user.loginAddresses.overflow) || 0,
  };
}

async function peopleSummaries(users) {
  const values = [...new Set(users.flatMap(user =>
    tallyList(user.loginAddresses).map(entry => entry.value)))];
  const docs = values.length
    ? await LoginAddresses.find(
      { address: { $in: values } },
      { fields: { address: 1, ipv4: 1, ipv6: 1, location: 1, locationLabel: 1 } },
    ).fetchAsync()
    : [];
  const byAddress = new Map(docs.map(doc => [doc.address, doc]));
  return users.map(user => personSummary(user, byAddress));
}

// Admin Panel → Problems → Offices: people first, with each person's addresses
// kept together and the successful-login count shown for every address.
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

async function visiblePeople(context, userIds) {
  const caller = context.userId && await Meteor.users.findOneAsync(
    context.userId, { fields: { isAdmin: 1, orgs: 1 } });
  if (!tenantAdmin.canOpenAdminPanel(caller)) {
    throw new Meteor.Error('not-authorized', 'Admin access required');
  }
  return Meteor.users.find(
    tenantAdmin.peopleScopeSelector(caller, { _id: { $in: userIds } }),
    { fields: { username: 1, loginAddresses: 1 } },
  ).fetchAsync();
}

async function locationReports(users) {
  const addresses = [...new Set(users.flatMap(user =>
    tallyList(user.loginAddresses).map(entry => entry.value)))];
  const docs = addresses.length ? await LoginAddresses.find(
    { address: { $in: addresses } },
    { fields: { address: 1, ipv4: 1, ipv6: 1, location: 1 } },
  ).fetchAsync() : [];
  return users.map(user => ({
    userId: user._id,
    username: user.username || user._id,
    countries: loginLocationsByCountry(user, docs),
  }));
}

if (Meteor.isServer) {
  Meteor.methods({
    // Country counters for the current People page, and the rows behind each
    // counter. Returning one authorized batch avoids one method call per user.
    async peopleLoginLocations(userIds) {
      check(userIds, [String]);
      if (userIds.length > 200) {
        throw new Meteor.Error('too-many-users', 'At most 200 users per page');
      }
      const users = await visiblePeople(this, [...new Set(userIds)]);
      return locationReports(users);
    },

    // People first, with all of each person's addresses kept together.
    async loginOffices(options) {
      check(options, Match.Optional({
        limit: Match.Optional(Number),
        skip: Match.Optional(Number),
        search: Match.Optional(String),
      }));
      await requireAdmin(this);
      const opts = options || {};
      const selector = { 'loginAddresses.entries': { $exists: true } };
      if (opts.search) {
        const safe = String(opts.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const rx = new RegExp(safe, 'i');
        const matchingAddresses = await LoginAddresses.find(
          { $or: [{ address: rx }, { locationLabel: rx }] },
          { fields: { users: 1 } },
        ).fetchAsync();
        const names = new Set();
        matchingAddresses.forEach(row => {
          Object.values((row.users && row.users.entries) || {})
            .forEach(entry => names.add(entry.value));
        });
        selector.$or = [
          { username: rx },
          { 'profile.fullname': rx },
          ...(names.size ? [{ username: { $in: [...names] } }] : []),
        ];
      }
      const limit = Math.min(Math.max(opts.limit || 25, 1), 200);
      const skip = Math.max(opts.skip || 0, 0);

      const total = await Meteor.users.find(selector).countAsync();
      const users = await Meteor.users.find(selector, {
        fields: { username: 1, profile: 1, loginDisabled: 1, loginAddresses: 1 },
        sort: { username: 1 }, limit, skip,
      }).fetchAsync();
      return { total, people: await peopleSummaries(users) };
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
