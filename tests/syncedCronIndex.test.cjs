'use strict';

// Guard: #6769 - synced-cron's per-minute running-job lookup is indexed.
// Run: node tests/syncedCronIndex.test.cjs
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'server/cron/syncedCron.js'), 'utf8');
assert.match(src, /export const CRON_RUNNING_JOB_INDEX = \{ name: 1, finishedAt: 1 \};/);
assert.match(src, /return await ensureIndex\(collection, CRON_RUNNING_JOB_INDEX\);/);
assert.match(src, /startSyncedCron\(\);\s*\/\/[^\n]*\n[^\n]*\n\s*if \(!\(await ensureCronIndexes\(\)\)/);
// negative: the job history keeps its TTL (the index must not replace it)
assert.match(src, /collectionTTL: 172800/);
console.log('ok - the running-job lookup has its index, created at startup');
