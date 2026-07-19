import { Mongo } from 'meteor/mongo';
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

export default EventLog;
