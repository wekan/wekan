'use strict';

// Where each account logs in from, and who logs in from each address.
//
// TWO QUESTIONS, ONE RECORD. Admin Panel → People wants "which addresses does
// this account use" — `100.100.100.100 25, 122.122.122.122 50`. The office view
// wants the other direction: "which accounts use this address, and how often".
// Both come from the same successful-login event, written to both sides at once,
// because a login is a rare event compared with the attack traffic the Problems
// summaries are built for — a few writes each is affordable where one per
// attempt was not.
//
// WHY THE OTHER DIRECTION MATTERS. An address that many accounts log in from is
// an office, a VPN, a university, a mobile carrier's NAT — one address in front
// of a lot of people. Anything that reacts to an address by blocking it would
// take all of them off WeKan at once, and the admin would see "one address
// blocked" rather than "eighty people locked out". So WeKan does not block
// addresses: a security event blocks the ACCOUNT that caused it. This record is
// what lets an admin see the shape of their own users before deciding anything,
// and what would make an address-level action visibly reckless if one were ever
// proposed.
//
// CAPPED, both ways, with an overflow count — the same discipline as
// models/lib/eventLogSummary.js. A laptop on a mobile network changes address
// constantly, and a big office has more staff than anybody wants listed in one
// document.

const crypto = require('crypto');
const { classifyAddress } = require('./ipAddress');
const { countryFlag } = require('./geoHeaders');

// How many addresses one account will name, and how many accounts one address
// will name, before the rest are counted rather than listed.
const MAX_ADDRESSES_PER_USER = 50;
const MAX_USERS_PER_ADDRESS = 200;

// An address is SHARED once this many distinct accounts have logged in from it.
// Three is deliberately low: a household, a two-person office and a NAT all
// matter, and the cost of calling something shared when it is not is only that
// an admin is shown a grouping they can ignore.
const SHARED_ADDRESS_MIN_USERS = 3;

// A Mongo-safe key. An IPv4 address is all dots and a username can be anything,
// neither of which may be a field name; the readable value lives in the entry.
function tallyKey(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 16);
}

// The address as it should be recorded: `::ffff:203.0.113.9` is the IPv4 it is,
// or one client would be two addresses depending which listener it reached.
function addressOf(raw) {
  const { ipv4, ipv6 } = classifyAddress(raw);
  return { value: ipv4 || ipv6 || '', family: ipv4 ? 'ipv4' : (ipv6 ? 'ipv6' : '') };
}

// Fold one successful login into a tally, respecting the cap.
//   entries: { <key>: { value, family?, count, firstAt, at } }
// Returns true when it was recorded, false when the cap sent it to the overflow.
function addToTally(tally, { value, family }, at, max) {
  if (!value) return false;
  const key = tallyKey(value);
  const entry = tally.entries[key];
  if (entry) {
    entry.count += 1;
    if (at > entry.at) entry.at = at;
    return true;
  }
  if (Object.keys(tally.entries).length >= max) {
    tally.overflow += 1;
    return false;
  }
  tally.entries[key] = { value, count: 1, firstAt: at, at };
  if (family) tally.entries[key].family = family;
  return true;
}

const emptyTally = () => ({ entries: {}, overflow: 0 });

// The tally as an admin reads it: busiest first, never longer than the cap.
//   [{ value: '122.122.122.122', count: 50 }, { value: '100.100.100.100', count: 25 }]
function tallyList(tally = {}, limit = MAX_ADDRESSES_PER_USER) {
  const entries = (tally && tally.entries) || tally || {};
  return Object.keys(entries)
    .map(key => Object.assign({ key }, entries[key]))
    .filter(e => e.value)
    .sort((a, b) => (b.count || 0) - (a.count || 0)
      || String(a.value).localeCompare(String(b.value)))
    .slice(0, limit);
}

// Is this address in front of several people?
function isSharedAddress(addressDoc, min = SHARED_ADDRESS_MIN_USERS) {
  if (!addressDoc) return false;
  const named = Object.keys((addressDoc.users && addressDoc.users.entries) || {}).length;
  // The overflow counts LOGINS, not accounts, so it cannot be added to `named`.
  // It can only mean there are more accounts than are listed, which is already
  // past any sensible threshold.
  return (named + (addressDoc.users && addressDoc.users.overflow ? 1 : 0)) >= min;
}

// The office view: one address, who uses it, and how much. `window` is the
// [firstAt, at] the row covers, so "how many times each user at that office has
// logged in" has a stated period rather than an implied one.
function officeSummary(addressDoc) {
  if (!addressDoc) return null;
  const users = tallyList(addressDoc.users, MAX_USERS_PER_ADDRESS);
  return {
    address: addressDoc.address,
    ipv4: addressDoc.ipv4 || '',
    ipv6: addressDoc.ipv6 || '',
    // The office's name, when something in front of WeKan knows it: an admin
    // reads "London" far faster than 100.100.100.100.
    location: addressDoc.location || null,
    locationLabel: addressDoc.locationLabel || '',
    shared: isSharedAddress(addressDoc),
    users,
    userCount: users.length,
    moreUsers: (addressDoc.users && addressDoc.users.overflow) || 0,
    logins: addressDoc.count || 0,
    firstAt: addressDoc.firstAt,
    at: addressDoc.at,
  };
}

// Flatten the person-grouped response for the shared table renderer. Keeping a
// person's address rows adjacent is the grouping; repeating the identity makes
// every row understandable to screen readers and after table sorting/copying.
function officeRowsByPerson(people = []) {
  return people.flatMap(person => (person.addresses || []).map(address => ({
    ...address,
    userId: person.userId,
    username: person.username,
    fullname: person.fullname,
    initials: person.initials,
    avatarUrl: person.avatarUrl,
    moreAddresses: person.moreAddresses,
  })));
}

// One person's successful logins grouped by the country currently recorded for
// each address. Older per-user tallies predate location storage, so the address
// collection supplies the location; counts and time windows always remain the
// person's own, never the address-wide totals.
function loginLocationsByCountry(user, addressDocs = []) {
  const byAddress = new Map(addressDocs.map(doc => [doc.address, doc]));
  const countries = new Map();
  for (const entry of tallyList(user && user.loginAddresses)) {
    const doc = byAddress.get(entry.value) || {};
    const location = entry.location || doc.location || null;
    const country = String(location && location.country || '').toUpperCase();
    if (!/^[A-Z]{2}$/.test(country) || country === 'XX' || country === 'T1') continue;
    if (!countries.has(country)) {
      countries.set(country, {
        country,
        flag: countryFlag(country),
        count: 0,
        rows: [],
      });
    }
    const group = countries.get(country);
    group.count += entry.count || 0;
    group.rows.push({
      city: location.city || location.region || country,
      ipv4: doc.ipv4 || (entry.family === 'ipv4' ? entry.value : ''),
      ipv6: doc.ipv6 || (entry.family === 'ipv6' ? entry.value : ''),
      firstAt: entry.firstAt,
      at: entry.at,
      count: entry.count || 0,
    });
  }
  return [...countries.values()]
    .map(group => ({
      ...group,
      rows: group.rows.sort((a, b) => (b.count || 0) - (a.count || 0)
        || String(a.city).localeCompare(String(b.city))
        || String(a.ipv4 || a.ipv6).localeCompare(String(b.ipv4 || b.ipv6))),
    }))
    .sort((a, b) => (b.count || 0) - (a.count || 0)
      || a.country.localeCompare(b.country));
}

module.exports = {
  MAX_ADDRESSES_PER_USER,
  MAX_USERS_PER_ADDRESS,
  SHARED_ADDRESS_MIN_USERS,
  tallyKey,
  addressOf,
  addToTally,
  emptyTally,
  tallyList,
  isSharedAddress,
  officeSummary,
  officeRowsByPerson,
  loginLocationsByCountry,
};
