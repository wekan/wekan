#!/usr/bin/env node
// db-ready.mjs — does the database answer yet? Exit 0 when it does, 1 when it
// does not. Nothing is written and nothing is created; it is one `ping`.
//
// #6595: WeKan does not open its web port until the database answers, and in a
// container nothing else was listening while it waited - so a reverse proxy in
// front returned "Gateway timeout" and the admin had two indistinguishable
// faults to choose between: WeKan is broken, or the database simply has not
// come up yet. The snap answers that by serving a page while it waits
// (snap-src/bin/wekan-control); the entrypoint needs the same, and to serve a
// page it first has to be able to ask this question.
//
// The driver comes from the bundle, so this runs with no extra dependency:
//   NODE_PATH=/build/programs/server/node_modules node /build/db-ready.mjs "$MONGO_URL"
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const url = process.argv[2] || process.env.MONGO_URL || '';
if (!url) process.exit(1);

// WHERE THE DRIVER ACTUALLY IS IN A BUNDLE.
//
// `mongodb` is a devDependency, not a dependency, so a production bundle has
// NOTHING at programs/server/node_modules/mongodb - the driver Meteor uses lives
// under npm-mongo. This asked for it at the top level only, so `require` threw
// MODULE_NOT_FOUND on every ask, in every container, whatever the database was
// doing: the probe could never answer "ready", and WeKan sat behind the
// "waiting for database" page for the whole ten-minute window before starting.
// The snap's db-eval.mjs already carries this scar - "made WeKan loop 'MongoDB
// not ready' forever" - and the same candidate list is used here.
const roots = [];
const push = u => { if (u) { try { roots.push(new URL(u)); } catch { /* not a URL */ } } };
if (process.env.NODE_PATH) {
  push(pathToFileURL(process.env.NODE_PATH.split(':')[0]
    .replace(/\/programs\/server\/node_modules\/?$/, '') + '/'));
}
push(new URL('../', import.meta.url));      // /build/, if this is /build/db-ready.mjs
const subPaths = [
  'programs/server/npm/node_modules/meteor/npm-mongo/node_modules/_.cjs',
  'programs/server/npm/node_modules/_.cjs',
  'programs/server/node_modules/_.cjs',
  '_.cjs',
];
const requires = [];
for (const r of roots) {
  for (const sp of subPaths) {
    try { requires.push(createRequire(new URL(sp, r))); } catch { /* unreachable root */ }
  }
}
// CommonJS resolution from this file honours NODE_PATH and walks up node_modules.
requires.push(createRequire(import.meta.url));

let MongoClient;
for (const req of requires) {
  try {
    const m = req('mongodb');
    if (m && typeof m.MongoClient === 'function') { MongoClient = m.MongoClient; break; }
  } catch { /* try the next candidate */ }
}
if (typeof MongoClient !== 'function') {
  // NO DRIVER IS NOT A SLOW DATABASE. Exit 2, distinct from 1, so the caller can
  // tell "the database said no" from "I could not ask" - and start WeKan instead
  // of holding a page in front of a database that may be perfectly healthy.
  console.error('db-ready: could not resolve the mongodb driver from the bundle; not asking.');
  process.exit(2);
}

// The connection options come from the URL and nowhere else.
//
// This used to force `directConnection: true`, which is right for one host and
// a MongoParseError for a replica set: "directConnection option requires
// exactly one host". A replica-set MONGO_URL is normally a seed list, so the
// driver threw while the CLIENT WAS BEING CONSTRUCTED - outside the try below -
// and the probe died with an unhandled error every time. Its exit code said
// "not ready", the entrypoint discarded the reason, and WeKan served "waiting
// for database" forever at a database that was answering everyone else.
//
// The probe must ask the question WeKan itself will ask, so whatever the URL
// says - a replica set, a direct connection, a standalone - is what it uses.
let client;
try {
  client = new MongoClient(url, {
    serverSelectionTimeoutMS: 3000,
    connectTimeoutMS: 3000,
    // A probe must not sit in a connection pool the server will later want.
    maxPoolSize: 1,
  });
} catch (err) {
  // A URL the driver refuses is not a database that is still coming up: waiting
  // will never fix it. Say so, with the driver's own words.
  console.error(`db-ready: MONGO_URL rejected by the driver: ${err.message}`);
  process.exit(1);
}

try {
  await client.connect();
  await client.db('admin').command({ ping: 1 });
  process.exitCode = 0;
} catch (err) {
  // Why, in one line. The caller decides whether to print it; a probe that
  // fails silently is why this took a bug report to find.
  console.error(`db-ready: ${err.name}: ${err.message.split('\n')[0]}`);
  process.exitCode = 1;
} finally {
  try { await client.close(true); } catch { /* closing a failed connect is fine */ }
}
