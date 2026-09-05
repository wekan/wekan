'use strict';

// Admin Panel → Problems records a SUMMARY per problem, not a row per event.
//
// WHY. A guard that fires on a path an attacker controls fires as fast as they
// can send: a lockout under attack, a canary in a loop, an SSRF probe walking a
// range. One document per event means the database grows with the attack, the
// Problems page turns into a scroll of near-identical lines, and the one event
// that mattered is somewhere in the middle of ten thousand that did not. The
// admin's question is never "list every attempt" - it is "what is happening, how
// much, and since when".
//
// So each problem is ONE row that accumulates: what it is, how many times it has
// happened, and the window it happened in.
//
//   { stream, bleed, category, action, source, severity, cwe,
//     count: 1043, firstAt: <first seen>, at: <last seen>, … }
//
// WHAT IS PART OF THE PROBLEM'S IDENTITY, and what is not, is the whole design.
// Identity is the KIND of thing that happened - the stream, the *Bleed name, the
// category, what the guard did about it, which guard, how bad, the CWE. The
// actor is NOT: including the username, the address or the detail text would put
// the cardinality straight back and give one row per attacker per attempt, which
// is the thing being fixed.
//
// The actor is still recorded, two ways. `username`, `userId`, `ip` and `detail`
// describe the LATEST occurrence, and `actors` holds a per-actor tally inside the
// same row:
//
//   actors: { <key>: { kind: 'user'|'ip', value: 'username1', count: 25, at: … } }
//
// read out as `username1 25, 100.100.100.100 30, …`, so one line answers "who,
// and how many times each" without a row per attempt. That is what an admin
// acts on: one address with 412 tries is a block, and 412 addresses with one try
// each is a botnet, and those look identical without it.
//
// A USERNAME AND AN ADDRESS ARE COUNTED SEPARATELY, not as a pair. They answer
// different questions - "which account is being attacked" and "where from" - and
// an attempt often has only one of them, since an unauthenticated attacker has
// an address and no name. Pairing them would split one attacker across a line
// per address they used and answer neither question well.
//
// THE TALLY IS CAPPED. An attacker rotating addresses would otherwise grow the
// map with the attack and reintroduce exactly the cost this removes - the same
// bug one level down. Past MAX_ACTORS distinct actors the row stops adding keys
// and counts the rest in `actorsOverflow`, so the row's size is bounded whatever
// arrives, and "…and 9,412 others" is itself the useful signal that the source
// is spread rather than single.

// The fields that make two events the same problem.
// Relative, not '/models/…': this module is loaded by plain-node tests as well
// as by Meteor, and only the relative form resolves in both.
const { classifyAddress } = require('./ipAddress');

const IDENTITY_FIELDS = [
  'stream',    // security | speed | tests | cpu | database
  'bleed',     // the hall-of-fame name, so Problems groups the way the site does
  'category',
  'action',    // blocked | remediated | sanitized | rate-limited | detected | failed
  'source',    // which guard
  'severity',
  'cwe',
  // The database stream classifies its own problems, and two different database
  // faults are two problems even when everything above matches.
  'type',
  'db',
  'kind',
  // The `api` stream: which endpoint, and whose call. This is the ONE place the
  // actor is part of a problem's identity, and it is deliberate - see
  // models/lib/apiUsage.js. "Who called what, how often" IS that report, and its
  // cardinality is bounded by real accounts times real endpoints rather than by
  // whoever is sending. The ACCOUNT ID, not the name: a rename must not split
  // one account's history into two rows.
  'api',
  'apiUserId',
];

// The fields that describe the LATEST occurrence rather than the problem.
// `ipv4`/`ipv6` are the address split into its family, so every report can show
// the two in their own columns - see models/lib/ipAddress.js for why a
// dual-stack `::ffff:` address has to be unwrapped first.
const LATEST_FIELDS = [
  'userId', 'username', 'ip', 'ipv4', 'ipv6', 'location', 'detail', 'message',
];

// How many distinct actors one row will name before it starts counting the rest
// in `actorsOverflow`. Enough to see a pattern, few enough that a row stays a
// row: 50 entries is a few kilobytes, and the 51st attacker tells you nothing
// the first 50 have not.
const MAX_ACTORS = 50;

// The actors one attempt is attributed to: the account it was aimed at or made
// by, and the address it came from - each on its own.
//
// The address is NORMALISED first: a dual-stack socket reports an IPv4 client as
// `::ffff:203.0.113.9`, and counting that separately from `203.0.113.9` would
// make one client look like two actors depending on which listener it reached.
// The family is carried on the entry so a report can put it in the right column.
function actorsOf(evt = {}) {
  const out = [];
  if (evt.username) out.push({ kind: 'user', value: String(evt.username) });
  if (evt.ip) {
    const { ipv4, ipv6 } = classifyAddress(evt.ip);
    const value = ipv4 || ipv6;
    if (value) out.push({ kind: 'ip', value, family: ipv4 ? 'ipv4' : 'ipv6' });
  }
  return out;
}

// Which tally an actor belongs to. Hashed because a username and an IPv4 address
// both contain characters Mongo will not take in a field name - and the readable
// value is stored inside the entry, so nothing is lost by the key being opaque.
function actorKeyFor(actor) {
  if (!actor || !actor.value) return null;
  const crypto = require('crypto');
  return crypto.createHash('sha256')
    .update(`${actor.kind}:${actor.value}`)
    .digest('hex')
    .slice(0, 16);
}

// The per-actor part of the update, given the actor keys the row already has. A
// new actor is added only while there is room under the cap, and counted in the
// overflow when there is not.
function actorUpdate(evt = {}, now = new Date(), times = 1, known = new Set()) {
  const $set = {};
  const $inc = {};
  let room = MAX_ACTORS - known.size;
  for (const actor of actorsOf(evt)) {
    const key = actorKeyFor(actor);
    if (!key) continue;
    if (known.has(key)) {
      $set[`actors.${key}.at`] = now;
      $inc[`actors.${key}.count`] = times;
      continue;
    }
    if (room <= 0) {
      $inc.actorsOverflow = (($inc.actorsOverflow || 0) + times);
      continue;
    }
    room -= 1;
    $set[`actors.${key}.at`] = now;
    $set[`actors.${key}.kind`] = actor.kind;
    $set[`actors.${key}.value`] = actor.value;
    if (actor.family) $set[`actors.${key}.family`] = actor.family;
    $inc[`actors.${key}.count`] = times;
  }
  return { $set, $inc };
}

// The tally as an admin reads it: busiest first, never longer than the cap.
//   [{ kind: 'user', value: 'username1', count: 25 },
//    { kind: 'ip',   value: '100.100.100.100', count: 30 }]
function actorList(summary = {}) {
  const actors = summary.actors || {};
  return Object.keys(actors)
    .map(key => Object.assign({ key }, actors[key]))
    .filter(a => a.value)
    .sort((a, b) => (b.count || 0) - (a.count || 0)
      || String(a.value).localeCompare(String(b.value)))
    .slice(0, MAX_ACTORS);
}

// The selector that finds this problem's row, if it has one. Missing fields are
// matched as missing rather than as undefined: `{ cwe: undefined }` is not a
// query Mongo answers usefully, and two rows would appear for one problem.
function summaryIdentity(evt = {}) {
  const identity = {};
  for (const field of IDENTITY_FIELDS) {
    identity[field] = evt[field] === undefined || evt[field] === null || evt[field] === ''
      ? { $exists: false }
      : evt[field];
  }
  return identity;
}

// The update that folds one occurrence into that row.
//
// `count` is incremented rather than set, `firstAt` is written only when the row
// is created, and `at` always moves to now - so the row answers "how many, and
// between when and when" without a second query. `at` stays the LAST occurrence
// because everything that already reads this collection sorts and filters on it.
function summaryUpdate(evt = {}, now = new Date(), times = 1) {
  const set = { at: now };
  const setOnInsert = { firstAt: now };
  for (const field of IDENTITY_FIELDS) {
    const value = evt[field];
    if (value !== undefined && value !== null && value !== '') setOnInsert[field] = value;
  }
  for (const field of LATEST_FIELDS) {
    const value = evt[field];
    if (value !== undefined && value !== null && value !== '') set[field] = value;
  }
  // The latest address, in its own column. Written even when the caller passed
  // only `ip`, so every report gains the two columns without every caller
  // having to know about them.
  if (evt.ip) {
    const { ipv4, ipv6 } = classifyAddress(evt.ip);
    if (ipv4) { set.ipv4 = ipv4; set.ip = ipv4; delete set.ipv6; }
    if (ipv6) { set.ipv6 = ipv6; set.ip = ipv6; delete set.ipv4; }
  }
  return { $set: set, $setOnInsert: setOnInsert, $inc: { count: times } };
}

// Fold a list of per-event documents into summaries: the shape the migration
// writes, and the shape a test can check without a database.
// Fold one document's actors into a summary being built, respecting the cap.
function addActor(summary, doc, at, times) {
  // A legacy row may already carry a tally of its own.
  if (doc.actors && typeof doc.actors === 'object') {
    for (const [key, entry] of Object.entries(doc.actors)) {
      if (summary.actors[key]) {
        summary.actors[key].count += (entry.count || 0);
        if (entry.at && (!summary.actors[key].at || entry.at > summary.actors[key].at)) {
          summary.actors[key].at = entry.at;
        }
      } else if (Object.keys(summary.actors).length < MAX_ACTORS) {
        summary.actors[key] = Object.assign({}, entry);
      } else {
        summary.actorsOverflow += (entry.count || 0);
      }
    }
    summary.actorsOverflow += (doc.actorsOverflow || 0);
    return;
  }
  for (const actor of actorsOf(doc)) {
    const key = actorKeyFor(actor);
    if (!key) continue;
    if (summary.actors[key]) {
      summary.actors[key].count += times;
      if (at > summary.actors[key].at) summary.actors[key].at = at;
    } else if (Object.keys(summary.actors).length < MAX_ACTORS) {
      summary.actors[key] = { kind: actor.kind, value: actor.value, count: times, at };
      if (actor.family) summary.actors[key].family = actor.family;
    } else {
      summary.actorsOverflow += times;
    }
  }
}

function foldEvents(docs = []) {
  const byKey = new Map();
  for (const doc of docs) {
    const key = IDENTITY_FIELDS.map(f => String(doc[f] === undefined ? '' : doc[f])).join(' ');
    const at = doc.at instanceof Date ? doc.at : new Date(doc.at || 0);
    // A legacy row may already stand for several attempts: the canary flush
    // wrote `count`. Keep that, or one occurrence when it is absent.
    const times = typeof doc.count === 'number' && doc.count > 0 ? doc.count : 1;
    const existing = byKey.get(key);
    if (!existing) {
      const summary = {
        count: times, firstAt: at, at, actors: {}, actorsOverflow: 0,
      };
      for (const f of IDENTITY_FIELDS) if (doc[f] !== undefined) summary[f] = doc[f];
      for (const f of LATEST_FIELDS) if (doc[f] !== undefined) summary[f] = doc[f];
      addActor(summary, doc, at, times);
      byKey.set(key, summary);
      continue;
    }
    addActor(existing, doc, at, times);
    existing.count += times;
    if (at < existing.firstAt) existing.firstAt = at;
    // The newest occurrence is the one whose actor and detail the summary keeps.
    if (at >= existing.at) {
      existing.at = at;
      for (const f of LATEST_FIELDS) if (doc[f] !== undefined) existing[f] = doc[f];
    }
  }
  return [...byKey.values()];
}

module.exports = {
  IDENTITY_FIELDS,
  LATEST_FIELDS,
  MAX_ACTORS,
  summaryIdentity,
  summaryUpdate,
  actorsOf,
  classifyAddress,
  actorKeyFor,
  actorUpdate,
  actorList,
  foldEvents,
};
