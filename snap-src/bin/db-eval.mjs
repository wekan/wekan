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

import { MongoClient } from 'mongodb';

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
