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

export const EVENT_STREAMS = ['security', 'speed', 'tests', 'cpu'];

if (Meteor.isServer) {
  // The Security/Speed/Tests report pages filter by `stream` and sort by `at`
  // descending (streamSelector + eventLogPage). This compound index makes that a
  // bounded index scan instead of a full-collection scan + in-memory sort as the
  // event log grows, keeping the paginated tables fast.
  const { ensureIndex } = require('/server/lib/mongoStartup');
  Meteor.startup(async () => {
    await ensureIndex(EventLog, { stream: 1, at: -1 });
    await ensureIndex(EventLogAcks, { stream: 1 });
  });

  async function requireAdmin(context) {
    const uid = context.userId;
    const user = uid && (await Meteor.users.findOneAsync(uid));
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin only');
    }
    return user;
  }

  // Build a read-only find selector for one stream, with an optional
  // case-insensitive search across the text columns.
  function streamSelector(stream, search) {
    const selector = { stream };
    if (search) {
      const rx = { $regex: String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
      selector.$or = [{ category: rx }, { bleed: rx }, { source: rx }, { detail: rx }];
    }
    return selector;
  }

  Meteor.methods({
    // Admin-only: for each stream, the count of events NEWER than its
    // acknowledgment. Returns only streams with count > 0, so the Admin Panel
    // "Problems" button (red) and the Summary page show exactly what needs
    // attention.
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

    // Admin-only, READ-ONLY: total count of events in a stream (optional search),
    // for the Security/Speed/Tests detail pages' pagination.
    async eventLogCount(stream, search) {
      // check() every argument BEFORE any await/throw: Meteor's
      // audit-argument-checks otherwise reports "Did not check() all arguments"
      // (masking the real error) when requireAdmin throws for a non-admin call.
      check(stream, String);
      check(search, Match.Optional(String));
      await requireAdmin(this);
      return EventLog.find(streamSelector(stream, search)).countAsync();
    },

    // Admin-only, READ-ONLY: one page of a stream's events, newest first.
    async eventLogPage(stream, limit, skip, search) {
      // check() every argument BEFORE requireAdmin (see eventLogCount).
      check(stream, String);
      check(limit, Number);
      check(skip, Number);
      check(search, Match.Optional(String));
      await requireAdmin(this);
      return EventLog.find(streamSelector(stream, search), {
        sort: { at: -1 },
        limit: Math.max(1, Math.min(200, limit)),
        skip: Math.max(0, skip),
      }).fetchAsync();
    },
  });
}

export default EventLog;
