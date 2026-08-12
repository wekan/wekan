#!/usr/bin/env node
// database-merge-missing.mjs — copy the documents that exist in one database and
// NOT in the other, without changing anything that is already there.
//
// This is the second half of bin/database-choose.mjs. When a snap ends up with two
// copies of its data that have both been written to - a migration that was resumed
// late, a `snap revert` that ran for a month, a switch back and forth between
// MongoDB and FerretDB - one of them is chosen to be served, and the work done on
// the other one would otherwise sit in a database nobody opens.
//
// THE ONLY OPERATION IS INSERT, and only where the _id is absent from the target:
//
//   * a document that exists in the chosen database is never overwritten, so the
//     copy being served keeps its own version of every card, list and board - it
//     is the newer one, which is why it was chosen;
//   * nothing is ever deleted, on either side;
//   * the source database is opened read-only in the sense that matters: this
//     writes to the target only, and the source's files are untouched;
//   * a document that only ever existed on the other side is added, so it stops
//     being invisible.
//
// WHY THAT IS ENOUGH, and it is WeKan's own design that makes it enough: the
// history is APPEND-ONLY (docs/Features/Reports/History/History.md). Activities,
// comments and the change-history rows are never rewritten in place, so merging
// them can only ADD to what a card's Activity feed shows. The work done on the
// copy that is not being served becomes readable in the history of the copy that
// is - which is the difference between "your data is in a database you cannot
// reach" and "your data is in the history".
//
// WHAT IT DOES NOT DO. It does not reconcile two edits of the same field: if a
// card was edited on both sides, the version in the served copy stands and the
// other side's edit remains where it is - in the source database, still on disk,
// and in the merged history rows that describe it. Merging field by field is a
// decision about somebody's work and is not a script's to make.
//
// Usage:
//   database-merge-missing.mjs <source-url> <target-url> [--limit N] [--dry-run]
// Prints a JSON summary: { inserted: {collection: n}, skipped, errors, dryRun }

import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { MERGE_COLLECTIONS } from './database-choose.mjs';

// Same driver resolution as db-eval.mjs: Node's ESM loader ignores NODE_PATH, and
// the snap points NODE_PATH at the WeKan bundle's node_modules.
const _roots = [];
const _push = (u) => { if (u) { try { _roots.push(new URL(u)); } catch { /* ignore */ } } };
if (process.env.SNAP) _push(pathToFileURL(process.env.SNAP + '/'));
if (process.env.NODE_PATH) {
  _push(pathToFileURL(process.env.NODE_PATH.split(':')[0]
    .replace(/\/programs\/server\/node_modules\/?$/, '') + '/'));
}
_push(new URL('../', import.meta.url));
const _subPaths = [
  'programs/server/npm/node_modules/meteor/npm-mongo/node_modules/_.cjs',
  'programs/server/npm/node_modules/_.cjs',
  'programs/server/node_modules/_.cjs',
  '_.cjs',
];
const _requires = [];
for (const root of _roots) {
  for (const sub of _subPaths) {
    try { _requires.push(createRequire(new URL(sub, root))); } catch { /* ignore */ }
  }
}
function requireAny(spec) {
  for (const req of _requires) { try { return req(spec); } catch { /* next */ } }
  return null;
}

const BATCH = 200;

// How many ids to ask the target about at once. A card board can hold tens of
// thousands of activities, and `$in` with all of them is a query no database
// enjoys.
const ID_PROBE = 500;

async function mergeMissing(sourceDb, targetDb, options = {}) {
  const collections = options.collections || MERGE_COLLECTIONS;
  const limit = Number.isFinite(options.limit) ? options.limit : Infinity;
  const dryRun = !!options.dryRun;
  const log = options.log || (() => {});
  const summary = { inserted: {}, skipped: 0, errors: [], dryRun };
  let budget = limit;

  for (const name of collections) {
    if (budget <= 0) break;
    let cursor;
    try {
      cursor = sourceDb.collection(name).find({});
    } catch (e) {
      summary.errors.push(`${name}: ${e.message}`);
      continue;
    }
    const target = targetDb.collection(name);
    let pending = [];
    let insertedHere = 0;

    const flush = async () => {
      if (pending.length === 0) return;
      const batch = pending;
      pending = [];
      // Ask the target which of these it already has, and insert only the rest.
      // The insert is `ordered: false` as well, so a duplicate that appears
      // between the probe and the write cannot stop the ones behind it.
      let known = new Set();
      try {
        const ids = batch.map(doc => doc._id);
        const found = await target.find({ _id: { $in: ids } }, { projection: { _id: 1 } }).toArray();
        known = new Set(found.map(doc => String(doc._id)));
      } catch (e) {
        summary.errors.push(`${name}: ${e.message}`);
        return;
      }
      const missing = batch.filter(doc => !known.has(String(doc._id)));
      summary.skipped += batch.length - missing.length;
      if (missing.length === 0) return;
      if (dryRun) {
        insertedHere += missing.length;
        budget -= missing.length;
        return;
      }
      try {
        await target.insertMany(missing, { ordered: false });
        insertedHere += missing.length;
        budget -= missing.length;
      } catch (e) {
        // A duplicate key here is the good failure: the document arrived by
        // another route. Anything the driver did insert is counted by result.
        const inserted = (e && e.result && e.result.insertedCount) || 0;
        insertedHere += inserted;
        budget -= inserted;
        if (!/duplicate key/i.test(e.message || '')) summary.errors.push(`${name}: ${e.message}`);
      }
    };

    try {
      for await (const doc of cursor) {
        pending.push(doc);
        if (pending.length >= Math.min(BATCH, ID_PROBE)) {
          await flush();
          if (budget <= 0) break;
        }
      }
      await flush();
    } catch (e) {
      summary.errors.push(`${name}: ${e.message}`);
    } finally {
      try { await cursor.close(); } catch { /* ignore */ }
    }

    if (insertedHere > 0) {
      summary.inserted[name] = insertedHere;
      log(`${name}: ${insertedHere} document(s) that existed only in the other database`);
    }
  }
  return summary;
}

export { mergeMissing, BATCH, ID_PROBE };

// CLI. Wrapped in a function rather than run with top-level `await`: a module
// with top-level await is an "async graph", and Node refuses to require() one -
// which would stop tests/snapDatabaseAutopick.test.cjs (a .cjs suite) from
// exercising mergeMissing at all.
async function main() {
  const [sourceUrl, targetUrl, ...rest] = process.argv.slice(2);
  if (!sourceUrl || !targetUrl) {
    console.error('usage: database-merge-missing.mjs <source-url> <target-url> [--limit N] [--dry-run]');
    return 2;
  }
  const limitAt = rest.indexOf('--limit');
  const options = {
    dryRun: rest.includes('--dry-run'),
    limit: limitAt === -1 ? Infinity : Number(rest[limitAt + 1]),
    log: (message) => console.error('[merge] ' + message),
  };
  const mongodb = requireAny('mongodb');
  if (!mongodb || typeof mongodb.MongoClient !== 'function') {
    console.error('[merge] could not resolve the mongodb driver from the WeKan bundle');
    return 2;
  }
  const { MongoClient } = mongodb;
  const source = new MongoClient(sourceUrl, { serverSelectionTimeoutMS: 10000 });
  const target = new MongoClient(targetUrl, { serverSelectionTimeoutMS: 10000 });
  let code = 0;
  try {
    await source.connect();
    await target.connect();
    const summary = await mergeMissing(source.db('wekan'), target.db('wekan'), options);
    console.log(JSON.stringify(summary));
    if (summary.errors.length) code = 1;
  } catch (e) {
    console.error('[merge] ' + (e && e.message ? e.message : String(e)));
    code = 1;
  } finally {
    try { await source.close(true); } catch { /* ignore */ }
    try { await target.close(true); } catch { /* ignore */ }
  }
  return code;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  main().then(code => process.exit(code)).catch(() => process.exit(1));
}
