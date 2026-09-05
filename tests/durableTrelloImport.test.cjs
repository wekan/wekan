'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'server/trelloApiImport.js'), 'utf8');

console.log('durableTrelloImport:');
assert.match(source, /const workerId =/);
assert.match(source, /async function claimJob/);
assert.match(source, /leaseUntil: \{ \$lte: now \}/);
assert.match(source, /Meteor\.setInterval\(\(\) => \{\s*renewJobLease/);
assert.match(source, /Meteor\.clearInterval\(heartbeat\)/);
assert.match(source, /activityType: 'importBoard',[\s\S]*'source\.system': 'Trello',[\s\S]*'source\.id': trelloBoardId/);
assert.match(source, /Meteor\.startup\(async \(\) => \{[\s\S]*status: 'running'/);
assert.doesNotMatch(source, /status: 'paused'.*server restart/s);
assert.match(source, /\[408, 425, 429\]\.includes\(res\.status\) \|\| res\.status >= 500/);
assert.match(source, /signal: options\.signal \|\| AbortSignal\.timeout\(REQUEST_TIMEOUT_MS\)/);
assert.match(source, /timeoutMs: REQUEST_TIMEOUT_MS/);
assert.match(source, /maxResponseBytes: 256 \* 1024 \* 1024/);
console.log('  ok - persisted jobs are leased, reclaimed, idempotent and network-bounded');
