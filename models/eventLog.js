import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
const { SimpleSchema } = require('/imports/simpleSchema');
const { newProblemsSelector } = require('/models/lib/eventLogProblems');

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
    // WHO and FROM WHERE. A security event that says only "something was
    // blocked" cannot be acted on: the admin needs the account and the address
    // to decide whether to lock it, and to recognise the same actor across
    // several events. Denormalised at write time on purpose - the username is
    // what the account was CALLED when it tried, which a later rename must not
    // rewrite, and a deleted account must not erase.
    username: { type: String, optional: true },
    ip:       { type: String, optional: true },
    // ONE ROW PER PROBLEM. `count` is how many times this problem has happened,
    // `firstAt` when it was first seen and `at` when it was last seen - so a row
    // answers "what, how much, and between when and when" on its own. See
    // models/lib/eventLogSummary.js for what makes two events the same problem
    // (the kind of thing that happened) and what does not (who did it - those
    // fields describe the most recent occurrence).
    //
    // A row per EVENT is what this replaced: a guard on a path an attacker
    // controls fires as fast as they can send, so the collection grew with the
    // attack and the Problems page became a scroll of identical lines.
    count:    { type: Number, optional: true },
    firstAt:  { type: Date, optional: true },
    // WHO, and how many times each - read out as `username1 25,
    // 100.100.100.100 30`. A username and an address are counted separately:
    // they answer different questions, and an unauthenticated attempt has an
    // address and no name. Capped (models/lib/eventLogSummary.js MAX_ACTORS) so
    // an attacker rotating addresses cannot grow the row with the attack, with
    // the remainder counted in actorsOverflow - which is itself the signal that
    // the source is spread rather than single.
    actors:   { type: Object, optional: true, blackbox: true },
    actorsOverflow: { type: Number, optional: true },
    detail:   { type: String, optional: true },
    // The 'database' stream's own four fields (server/lib/databaseProblems.js).
    // They MUST be declared here: collection2 cleans every insert against this
    // schema with `filter: true`, so a field the schema does not know is dropped
    // silently — which is why a database problem used to arrive in Admin Panel /
    // Problems / Database problems with an empty Category, Name and Action and
    // with the message it told the admin to read missing altogether.
    type:     { type: String, optional: true },  // the classifier's rule id
    db:       { type: String, optional: true },  // mongodb|sqlite|postgresql|mysql|mariadb|hana
    kind:     { type: String, optional: true },  // disk|auth|syntax|timeout|…
    message:  { type: String, optional: true },  // what the database itself said
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

// 'database' is what the database itself said, classified: which database type
// (MongoDB, or FerretDB over SQLite/PostgreSQL/MySQL/MariaDB/SAP HANA), what the
// message means, and what an admin should do about it. See
// models/lib/databaseErrors.js and server/lib/databaseProblems.js.
// 'integrity' is what the FILESYSTEM said: a stored file that is not the file
// WeKan stored (server/lib/fileIntegrityScan.js), and whether this server
// stopped cleanly last time (server/lib/uptimeWatch.js).
export const EVENT_STREAMS = ['security', 'speed', 'tests', 'cpu', 'database', 'integrity'];

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
      // Every text column the table shows, including the four the 'database'
      // stream puts in those columns instead - searching for "postgresql" or for
      // a phrase out of the database's own message has to find the row that
      // displays it.
      selector.$or = [
        { category: rx }, { bleed: rx }, { source: rx }, { detail: rx },
        { db: rx }, { kind: rx }, { type: rx }, { message: rx },
        // WHO and FROM WHERE are the two things an admin looking at a security
        // event actually wants to pivot on: every other event from this address,
        // every other event from this account. Searching the table for either
        // has to find the rows that DISPLAY it, so both columns are searched.
        { username: rx }, { ip: rx },
        // The `api` stream's own column: an admin looking at API use searches
        // for the endpoint - "boards", "export", "POST" - and has to find the
        // rows that display it.
        { api: rx },
      ];
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
        // #6520: count actual problems, not the severity:'info' rows that record a
        // problem being mitigated or clearing (the CPU stream writes several of
        // those per short spike), so an idle server does not report dozens of
        // "new problems".
        const count = await EventLog.find(
          newProblemsSelector(stream, ack && ack.at),
        ).countAsync();
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
        // Newest first for the problem streams, because a problem is news. The
        // `api` stream is not news - it is a usage report, and its question is
        // "what is used MOST", so it sorts by count and keeps `at` as the
        // tie-break.
        sort: stream === 'api' ? { count: -1, at: -1 } : { at: -1 },
        limit: Math.max(1, Math.min(200, limit)),
        skip: Math.max(0, skip),
      }).fetchAsync();
    },
  });
}

export default EventLog;
