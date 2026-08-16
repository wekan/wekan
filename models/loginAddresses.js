import { Mongo } from 'meteor/mongo';
const { SimpleSchema } = require('/imports/simpleSchema');

// ============================================================================
// LoginAddresses — one document per address people log in FROM.
//
// The other direction of the per-account tally on the user document: this says
// who uses an address, that says which addresses an account uses. Both are
// written from the same successful login (server/lib/loginTally.js).
//
// WHAT IT IS FOR. An address several accounts log in from is an office, a VPN,
// a university or a carrier's NAT - one address in front of a lot of people.
// Admin Panel groups them so an admin can see the shape of their own users:
// which offices exist, who is at each, and how often each of them logs in.
//
// It is also why WeKan does not block addresses. A security event blocks the
// ACCOUNT that caused it; blocking the address would take everyone behind it
// off WeKan at once, and this collection is what makes that visible rather than
// theoretical - "one address blocked" reads very differently next to "and
// eighty people use it".
// ============================================================================

const LoginAddresses = new Mongo.Collection('loginAddresses');

LoginAddresses.attachSchema(
  new SimpleSchema({
    // The address as recorded: an IPv4-mapped IPv6 is stored as the IPv4 it is,
    // so one client is one row however it reached the server.
    address: { type: String },
    // Split into families so a report can put each in its own column. One row
    // has one or the other, never both.
    ipv4: { type: String, optional: true },
    ipv6: { type: String, optional: true },
    // Total successful logins from here, and the window they fall in.
    count: { type: Number, optional: true },
    firstAt: { type: Date, optional: true },
    at: { type: Date, optional: true },
    // Who logs in from here: { entries: { <key>: { value, count, firstAt, at } },
    // overflow: n }. Capped (models/lib/loginTally.js MAX_USERS_PER_ADDRESS) so
    // a large office cannot grow one document without bound; `overflow` counts
    // the logins that were not attributed to a listed account.
    users: { type: Object, optional: true, blackbox: true },
    // Where a CDN in front of WeKan says this address is, when one does
    // (models/lib/geoHeaders.js): { city, region, country, latitude, longitude,
    // via }. DISPLAY ONLY - it is a label for an office, and anything a client
    // can send it can forge, so nothing decides anything on the strength of it.
    location: { type: Object, optional: true, blackbox: true },
    // The one line a table cell shows: "London, GB".
    locationLabel: { type: String, optional: true },
  }),
);

export default LoginAddresses;
