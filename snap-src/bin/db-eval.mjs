#!/usr/bin/env node
// db-eval.mjs — small MongoDB/FerretDB admin helper built on the `mongodb` driver
// that WeKan already bundles, so the snap needs NO `mongosh` binary. Run it with
// the bundled Node and NODE_PATH pointing at the WeKan bundle's node_modules so
// `mongodb` resolves (same pattern as migrate-mongo3-to-ferretdb.mjs); the
// db-eval wrapper script does this for you.
//
// Works against FerretDB v1 (SQLite) and MongoDB 6/7 alike — both speak the
// MongoDB wire protocol. Pass ?directConnection=true in the URL so admin commands
// reach a specific node even before a replica set is initiated.
//
// Usage: node db-eval.mjs <command> <mongo-url> [host]
//   ping <url>                exit 0 if the server answers adminCommand({ping:1})
//   primary <url>             exit 0 if this node is a writable replica-set primary
//   rs-conf-host <url>        print "OK:<host>" of member[0], else "ERROR:<msg>"
//   rs-initiate <url> <host>  replSetInitiate rs0 with a single member <host>
//   rs-reconfig <url> <host>  force replSetReconfig rs0 to a single member <host>
//   shutdown <url>            best-effort admin shutdownServer
//   product-name <url>        print the Admin Panel product name (settings.productName), if set

// Resolve the mongodb driver via createRequire (CommonJS), NOT a bare ESM
// `import { MongoClient } from 'mongodb'`. Node's ESM loader IGNORES NODE_PATH, but the
// db-eval wrapper sets NODE_PATH=$SNAP/programs/server/node_modules to point at the bundle's
// driver — so the ESM import resolved nothing and db-eval exited BEFORE connecting. Every
// ping/primary/rs-* check therefore "failed", which made mongod-7 migration readiness fall
// back to MongoDB 3.2, made WeKan loop "MongoDB not ready" / "FerretDB not ready" forever, and
// made replica-set setup fail. createRequire's require() DOES honor NODE_PATH and the bundle
// layout; anchor inside the modern bundle (npm-mongo's v6 driver) first, then NODE_PATH/local.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const _roots = [];
const _push = (u) => { if (u) { try { _roots.push(new URL(u)); } catch {} } };
if (process.env.SNAP)      _push(pathToFileURL(process.env.SNAP + '/'));
if (process.env.NODE_PATH) _push(pathToFileURL(process.env.NODE_PATH.split(':')[0].replace(/\/programs\/server\/node_modules\/?$/, '') + '/'));
_push(new URL('../', import.meta.url)); // $SNAP, if this is $SNAP/bin/db-eval.mjs
const _subPaths = [
  'programs/server/npm/node_modules/meteor/npm-mongo/node_modules/_.cjs',
  'programs/server/npm/node_modules/_.cjs',
  'programs/server/node_modules/_.cjs',
  '_.cjs',
];
const _reqs = [];
for (const r of _roots) for (const sp of _subPaths) { try { _reqs.push(createRequire(new URL(sp, r))); } catch {} }
// createRequire(import.meta.url) uses CommonJS resolution, which honors NODE_PATH and walks up
// node_modules from this file — the reliable fallback.
_reqs.push(createRequire(import.meta.url));
let MongoClient;
for (const req of _reqs) {
  try { const m = req('mongodb'); if (m && typeof m.MongoClient === 'function') { MongoClient = m.MongoClient; break; } } catch {}
}
if (typeof MongoClient !== 'function') {
  console.error('db-eval: FATAL — could not resolve the mongodb driver from the WeKan bundle.');
  process.exit(1);
}

const [cmd, url, host] = process.argv.slice(2);
if (!cmd || !url) {
  console.error('usage: db-eval <ping|primary|rs-conf-host|rs-initiate|rs-reconfig|shutdown> <url> [host]');
  process.exit(2);
}

const rsConfig = (h) => ({ _id: 'rs0', members: [{ _id: 0, host: h }] });

const client = new MongoClient(url, {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
});

let code = 1;
try {
  await client.connect();
  const admin = client.db('admin').admin();

  switch (cmd) {
    case 'ping': {
      const r = await admin.command({ ping: 1 });
      code = r.ok === 1 ? 0 : 1;
      break;
    }
    case 'primary': {
      // Equivalent of the old `rs.status().ok === 1 && rs.isMaster().ismaster`.
      const s = await admin.command({ replSetGetStatus: 1 });
      const h = await admin.command({ hello: 1 });
      code = s.ok === 1 && h.isWritablePrimary ? 0 : 1;
      break;
    }
    case 'rs-conf-host': {
      const c = await admin.command({ replSetGetConfig: 1 });
      console.log('OK:' + c.config.members[0].host);
      code = 0;
      break;
    }
    case 'rs-initiate': {
      if (!host) { console.error('rs-initiate needs a host argument'); code = 2; break; }
      await admin.command({ replSetInitiate: rsConfig(host) });
      console.log('Replica set initialized.');
      code = 0;
      break;
    }
    case 'rs-reconfig': {
      if (!host) { console.error('rs-reconfig needs a host argument'); code = 2; break; }
      let version = 1;
      try {
        const c = await admin.command({ replSetGetConfig: 1 });
        version = (c.config.version || 1) + 1;
      } catch { /* not yet configured */ }
      await admin.command({ replSetReconfig: { ...rsConfig(host), version }, force: true });
      console.log('Replica set reconfigured.');
      code = 0;
      break;
    }
    case 'shutdown': {
      // The server drops the connection while shutting down, which surfaces as an
      // error here — that is the expected, successful path.
      try { await admin.command({ shutdown: 1 }); } catch { /* expected */ }
      code = 0;
      break;
    }
    case 'product-name': {
      // Print the Admin Panel product name if set, so callers can cache it for the
      // maintenance page (which runs when the database is stopped). Nothing printed if unset.
      try {
        const doc = await client.db('wekan').collection('settings')
          .findOne({ productName: { $type: 'string' } });
        if (doc && typeof doc.productName === 'string' && doc.productName.trim()) {
          console.log(doc.productName.trim());
        }
      } catch { /* ignore — leave output empty */ }
      code = 0;
      break;
    }
    default:
      console.error('unknown command: ' + cmd);
      code = 2;
  }
} catch (e) {
  // rs-conf-host mirrors the old mongosh helper: emit ERROR:<msg> and exit 0 so
  // the caller branches on the printed value, not the exit code.
  if (cmd === 'rs-conf-host') {
    console.log('ERROR:' + (e && e.message ? e.message : String(e)));
    code = 0;
  } else {
    code = 1;
  }
} finally {
  try { await client.close(true); } catch { /* ignore */ }
}

process.exit(code);
