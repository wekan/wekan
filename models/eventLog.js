import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
const { SimpleSchema } = require('/imports/simpleSchema');

// ============================================================================
// EventLog — the single collection backing the Admin Panel → Reports →
// Security / Speed / Tests screens (design: docs/Security/Remediation/WeKan.md).
//
// Stored in the EXISTING WeKan database (MongoDB or FerretDB) via normal Meteor
// JavaScript queries — no new files or databases. FerretDB does NOT write here
// itself; when it detects/remediates a problem it reports it to WeKan, and WeKan
// records it with the same JS query, so the feature works identically on FerretDB,
// MongoDB, etc.
//
// One document per event; the `stream` field ('security' | 'speed' | 'tests')
// discriminates the three Reports.
// ============================================================================

const EventLog = new Mongo.Collection('eventlog');

EventLog.attachSchema(
  new SimpleSchema({
    stream:   { type: String },                    // 'security' | 'speed' | 'tests'
    at:       { type: Date },                       // server time of the event
    severity: { type: String, optional: true },     // info|low|medium|high|critical
    category: { type: String, optional: true },     // general class
    bleed:    { type: String, optional: true },     // hall-of-fame *Bleed name (or generic)
    action:   { type: String, optional: true },     // blocked|remediated|sanitized|rate-limited|detected|failed
    source:   { type: String, optional: true },     // guard/module/test name (wekan… or sqlite…/ferretdb…)
    cwe:      { type: String, optional: true },
    userId:   { type: String, optional: true },
    detail:   { type: String, optional: true },
  }),
);

// Per-stream acknowledgment: when an admin clicks "Acknowledge" for a problem
// area, we upsert { stream, at:now } here. The new-problem count for a stream is
// the number of eventlog docs newer than its ack `at` — so acknowledging zeroes
// the count and removes the info from the top of the Admin Panel.
export const EventLogAcks = new Mongo.Collection('eventlogAcks');

EventLogAcks.attachSchema(
  new SimpleSchema({
    stream: { type: String },
    at: { type: Date },
  }),
);

export const EVENT_STREAMS = ['security', 'speed', 'tests'];

if (Meteor.isServer) {
  async function requireAdmin(context) {
    const uid = context.userId;
    const user = uid && (await Meteor.users.findOneAsync(uid));
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin only');
    }
    return user;
  }

  Meteor.methods({
    // Admin-only: for each stream, the count of events NEWER than its
    // acknowledgment. Returns only streams with count > 0, so the Admin Panel
    // banner shows exactly the problem areas that need attention.
    async eventLogProblemAreas() {
      await requireAdmin(this);
      const areas = [];
      for (const stream of EVENT_STREAMS) {
        const ack = await EventLogAcks.findOneAsync({ stream });
        const selector = { stream };
        if (ack && ack.at) selector.at = { $gt: ack.at };
        const count = await EventLog.find(selector).countAsync();
        if (count > 0) areas.push({ stream, count });
      }
      return areas;
    },

    // Admin-only: mark the newest problems in the given stream(s) as seen
    // (resets each one's count). Accepts a single stream or an array, so the
    // Admin Panel banner can acknowledge all checked areas with one button.
    async acknowledgeEventLog(streams) {
      check(streams, Match.OneOf(String, [String]));
      await requireAdmin(this);
      const list = Array.isArray(streams) ? streams : [streams];
      const now = new Date();
      for (const stream of list) {
        if (!EVENT_STREAMS.includes(stream)) {
          throw new Meteor.Error('invalid-stream', 'Unknown event stream');
        }
        await EventLogAcks.upsertAsync({ stream }, { $set: { stream, at: now } });
      }
      return true;
    },
  });
}

export default EventLog;
