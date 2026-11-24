// Explicit UCS-only command. The image's normal WeKan CMD never invokes this.
//
//   /usr/local/bin/node /opt/ucs-migration/start.mjs           the migration
//   /usr/local/bin/node /opt/ucs-migration/start.mjs --check   the tools, and
//                                                               nothing written
//
// Node.js, not bash: the WeKan image is distroless and has no shell.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

function check() {
  for (const script of ['run.mjs', 'importer.mjs', 'verify.mjs', 'docker-exec.mjs']) {
    const r = spawnSync(process.execPath, ['--check', path.join(root, script)], { stdio: 'inherit' });
    if (r.status !== 0) return 1;
  }
  for (const tool of ['mongo', 'mongoexport']) {
    try { fs.accessSync(path.join(root, 'tools', tool), fs.constants.X_OK); } catch {
      console.error(`${path.join(root, 'tools', tool)} is not executable`);
      return 1;
    }
  }
  try {
    const r = createRequire('/build/programs/server/npm/node_modules/meteor/npm-mongo/node_modules/_.cjs');
    const mongodb = r('mongodb');
    if (typeof mongodb.MongoClient !== 'function' || typeof mongodb.BSON.EJSON.parse !== 'function') return 1;
  } catch (e) {
    console.error(`The bundle's MongoDB driver cannot be loaded: ${e.message}`);
    return 1;
  }
  return 0;
}

if (process.argv[2] === '--check') process.exit(check());

const env = {
  ...process.env,
  BUNDLE_ROOT: '/build',
  MONGO_BIN_DIR: path.join(root, 'tools'),
  SRC_PORT: '27017',
  SRC_DB: 'wekan',
  TARGET_MONGO_URL: 'mongodb://127.0.0.1:27017/wekan',
  WRITABLE_PATH: process.env.WRITABLE_PATH || '/data',
  MIGRATION_PORT: '8099',
};
const r = spawnSync(process.execPath, [path.join(root, 'run.mjs')], { env, stdio: 'inherit' });
process.exit(r.status === null ? 1 : r.status);
