// Fold one event into its problem's row (models/lib/eventLogSummary.js).
//
// Shared by the security, speed and test loggers, so "one row per problem, not
// per event" is a property of Admin Panel -> Problems rather than of one logger.
// All three sit on paths that repeat: a guard under attack, a slow query in a
// loop, a failing test on every run.
//
// Fire-and-forget and never throws into the caller: recording that something
// happened must never be able to stop it happening.

import EventLog from '/models/eventLog';

const {
  summaryIdentity, summaryUpdate, actorUpdate,
} = require('/models/lib/eventLogSummary');
const { classifyAddress } = require('/models/lib/ipAddress');

// Which actor keys each problem row already names, so the per-actor cap can be
// applied without reading the row on every attempt. Under attack - exactly when
// this is hot - the same few actors repeat, so the answer is nearly always
// already known. Bounded, so a long-running server cannot accumulate one entry
// per problem for ever; dropping an entry costs one extra read.
const knownActors = new Map();
const MAX_CACHED_ROWS = 500;

export async function foldEvent(doc = {}) {
  const { at, ...evt } = doc;
  const when = at instanceof Date ? at : new Date();
  // THE ADDRESS, SPLIT BY FAMILY, here rather than in each logger.
  //
  // Every report shows IPv4 and IPv6 in columns of their own, because an
  // instance reached over IPv6 and one reached over IPv4 are different
  // situations and a single column that sometimes holds one and sometimes the
  // other cannot be scanned. Doing it in the fold means a logger cannot forget
  // to - and none of the four did it, so the fields existed and were always
  // empty. `::ffff:203.0.113.9` is unwrapped to the IPv4 it is
  // (models/lib/ipAddress.js), or one client would be two addresses depending
  // which listener it reached.
  if (evt.ip && !evt.ipv4 && !evt.ipv6) {
    const { ipv4, ipv6 } = classifyAddress(evt.ip);
    if (ipv4) evt.ipv4 = ipv4;
    if (ipv6) evt.ipv6 = ipv6;
  }
  const identity = summaryIdentity(evt);
  const cacheKey = JSON.stringify(identity);

  let known = knownActors.get(cacheKey);
  if (!known) {
    const row = await EventLog.findOneAsync(identity, { fields: { actors: 1 } });
    known = new Set(Object.keys((row && row.actors) || {}));
    if (knownActors.size >= MAX_CACHED_ROWS) knownActors.clear();
    knownActors.set(cacheKey, known);
  }

  const summary = summaryUpdate(evt, when);
  const actors = actorUpdate(evt, when, 1, known);
  await EventLog.upsertAsync(identity, {
    $set: { ...summary.$set, ...actors.$set },
    $setOnInsert: summary.$setOnInsert,
    $inc: { ...summary.$inc, ...actors.$inc },
  });

  // Remember what this attempt added, so the next one from the same actor
  // increments instead of paying for a read.
  for (const field of Object.keys(actors.$inc)) {
    const m = /^actors\.([0-9a-f]{16})\.count$/.exec(field);
    if (m) known.add(m[1]);
  }
}

// The call every logger makes: fold, and swallow anything that goes wrong.
export function foldEventFireAndForget(doc, name = 'eventlog') {
  try {
    const p = foldEvent(doc);
    if (p && typeof p.catch === 'function') {
      p.catch(e => {
        if (process.env.DEBUG === 'true') console.warn(`${name} fold failed:`, e && e.message);
      });
    }
  } catch (e) {
    if (process.env.DEBUG === 'true') console.warn(`${name} fold failed:`, e && e.message);
  }
}
