import { Mongo } from 'meteor/mongo';
const { SimpleSchema } = require('/imports/simpleSchema');

// ============================================================================
// ShortPasswordLogins — Admin Panel / Problems / Password length.
//
// One document per account that has signed in with a password shorter than
// PASSWORD_MIN_LENGTH: when it first and last did, how many times, from which
// IPv4 and IPv6 address, and when it was fixed. Why it is one row per account
// and what "fixed" can and cannot mean are in models/lib/shortPasswordLogins.js.
// ============================================================================

const ShortPasswordLogins = new Mongo.Collection('shortPasswordLogins');

ShortPasswordLogins.attachSchema(
  new SimpleSchema({
    userId: { type: String },
    username: { type: String, optional: true },
    // The first and the latest sign-in with a short password, and how many.
    firstAt: { type: Date, optional: true },
    at: { type: Date, optional: true },
    count: { type: Number, optional: true },
    // The latest address of each family, and where a CDN in front of WeKan
    // said it is (models/lib/geoHeaders.js) - display only, never a decision.
    ipv4: { type: String, optional: true },
    ipv4Location: { type: Object, optional: true, blackbox: true },
    ipv6: { type: String, optional: true },
    ipv6Location: { type: Object, optional: true, blackbox: true },
    // When the password was changed, and not seen short since.
    fixedAt: { type: Date, optional: true },
  }),
);

export default ShortPasswordLogins;
