'use strict';

// Synchronously-invoked MongoDB operation runner, used by helpers/db.js as a
// drop-in replacement for the `mongosh` CLI (which dragged in a large, vendored
// and CVE-prone dependency tree — AWS SDK, basic-ftp, fast-xml-parser, …).
//
// helpers/db.js spawns this script with `execFileSync(process.execPath, [...])`,
// passing a JSON payload `{ url, ops }` on stdin. Each op is a structured
// MongoDB operation (no shell-script eval), executed in order on a single
// connection using the official `mongodb` driver. The result of the LAST op is
// written to stdout as JSON, so the parent can stay fully synchronous.

const { MongoClient } = require('mongodb');
const { EJSON } = require('bson');

async function main() {
  let payload = '';
  for await (const chunk of process.stdin) payload += chunk;
  // EJSON so Date / BSON types in the ops survive the JSON boundary and are
  // written as real BSON Dates (plain JSON would store them as strings).
  const { url, ops } = EJSON.parse(payload || '{}');

  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db();
    let result = null;

    for (const op of (ops || [])) {
      const col = op.collection ? db.collection(op.collection) : null;
      switch (op.method) {
        case 'insertOne':
          // Return the driver result so callers can read `insertedId`.
          result = await col.insertOne(op.doc);
          break;
        case 'insertMany':
          result = (op.docs && op.docs.length)
            ? await col.insertMany(op.docs)
            : { acknowledged: true, insertedCount: 0, insertedIds: {} };
          break;
        case 'deleteOne':
          await col.deleteOne(op.filter || {});
          break;
        case 'deleteMany':
          await col.deleteMany(op.filter || {});
          break;
        case 'updateOne':
          await col.updateOne(op.filter || {}, op.update || {});
          break;
        case 'updateMany':
          await col.updateMany(op.filter || {}, op.update || {});
          break;
        case 'findOne':
          result = await col.findOne(op.filter || {}, { projection: op.projection });
          break;
        case 'find':
          result = await col.find(op.filter || {}, { projection: op.projection }).toArray();
          break;
        case 'countDocuments':
          result = await col.countDocuments(op.filter || {});
          break;
        case 'collectionNames':
          result = (await db.listCollections().toArray()).map(c => c.name);
          break;
        default:
          throw new Error(`mongo-runner: unknown op method "${op.method}"`);
      }
    }

    // JSON.stringify drops `undefined` and serialises Date to ISO strings, which
    // matches the prior `mongosh --eval JSON.stringify(...)` round-trip semantics.
    process.stdout.write(result === undefined ? 'null' : JSON.stringify(result));
  } finally {
    await client.close();
  }
}

main().catch(err => {
  process.stderr.write(String((err && err.stack) || err));
  process.exit(1);
});
