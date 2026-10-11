import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { assertComplete, verifyFiles } from './verify.mjs';

const require = createRequire('/build/programs/server/npm/node_modules/meteor/npm-mongo/node_modules/_.cjs');
const { MongoClient } = require('mongodb');
const url = process.env.TARGET_MONGO_URL;
// UCS keeps every migration output beneath the app's writable directory.
const writablePath = path.resolve(process.env.WRITABLE_PATH || '/data');
process.env.FILES_DIR = path.join(writablePath, 'files');
process.env.STATUS_FILE = path.join(writablePath, 'ucs-migration-status.json');
const marker = path.join(writablePath, '.ucs-migration-complete');
if (fs.existsSync(marker)) throw new Error('Refusing to remigrate an active target');
// The source app is stopped by preinst. Validate source before creating any target data.
const probe = spawnSync('/opt/ucs-migration/tools/mongo', ['--quiet', 'wekan', '--eval',
  'if (!db.getCollectionNames().length) quit(2); if (!db.runCommand({ping:1}).ok) quit(3);'], { stdio: 'inherit' });
if (probe.status !== 0) throw new Error('Source MongoDB unavailable or empty');
let client;
for (let n = 0; n < 60; n++) {
  try {
    client = await MongoClient.connect(url, { serverSelectionTimeoutMS: 1000 });
    await client.db().command({ ping: 1 });
    break;
  } catch (error) {
    await client?.close(); client = undefined;
    if (n === 59) throw error;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
try {
  if ((await client.db().listCollections().toArray()).length) throw new Error('Target must be empty');
  const result = spawnSync(process.execPath, ['/opt/ucs-migration/importer.mjs'], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error('Importer failed; original MongoDB is retained');
  const status = JSON.parse(fs.readFileSync(process.env.STATUS_FILE, 'utf8'));
  assertComplete(status);
  // Do not trust the importer's best-effort count verification on query failures.
  for (const name of Object.keys(status.collections)) {
    const count = spawnSync('/opt/ucs-migration/tools/mongo', ['--quiet', 'wekan', '--eval',
      `print(db.getCollection(${JSON.stringify(name)}).count())`], { encoding: 'utf8' });
    if (count.status !== 0 || !/^\d+\s*$/.test(count.stdout)) throw new Error(`Source count failed: ${name}`);
    if (await client.db().collection(name).countDocuments() < Number(count.stdout)) throw new Error(`Target shortfall: ${name}`);
  }
  await verifyFiles(client.db(), writablePath);
  fs.writeFileSync(marker, JSON.stringify({ version: 1, source: '6.09', completedAt: new Date().toISOString() }) + '\n', { flag: 'wx' });
} finally {
  await client.close();
}
