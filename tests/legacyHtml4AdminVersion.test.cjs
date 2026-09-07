'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = relative => fs.readFileSync(path.resolve(__dirname, '..', relative), 'utf8');
const pages = read('server/lib/legacyHtml4Pages.js');
const route = read('server/legacyHtml4.js');
const statistics = read('server/statistics.js');
const jade = read('client/components/settings/informationBody.jade');
const shell = read('imports/lib/legacyHtml4.js');

console.log('legacyHtml4AdminVersion:');

const at = pages.indexOf('async function adminSettingsVersionPage');
assert.ok(at >= 0, 'the Version pane has a dedicated HTML4 controller');
const body = pages.slice(at, at + 7500);
assert.match(body, /path !== '\/admin\/settings\/version'/);
assert.match(body, /statisticsForAdmin\(userId\)/,
  'HTML4 uses the shared server statistics service');
assert.match(body, /adminSettingsNavigation\(translate\)/);
assert.match(body, /legacyOperation: 'check-newest-versions'/);
assert.match(route, /checkNewestVersionsForAdmin\(session\.userId\)/,
  'HTML4 uses the shared guarded version lookup');
assert.match(statistics, /export async function statisticsForAdmin\(userId\)/);
assert.match(statistics, /export async function checkNewestVersionsForAdmin\(userId\)/);
assert.match(statistics, /fields: \{ isAdmin: 1 \}/,
  'the shared service reloads the server-side Global Admin role');

for (const key of ['Platform', 'OS', 'Meteor', 'Database', 'Node']) {
  assert.ok(body.includes(`category('${key}')`), `${key} is an HTML4 category`);
  assert.ok(jade.includes(`{{_ '${key}'}}`), `${key} is an HTML5 category`);
}
for (const key of ['info', 'package', 'OS_Type', 'OS_Platform', 'OS_Arch',
  'OS_Release', 'OS_Uptime', 'OS_Loadavg', 'OS_Totalmem', 'OS_Freemem',
  'OS_Cpus', 'Meteor_version', 'Reactivity_mode', 'Reactivity_order',
  'DDP_transport', 'Database_type', 'MongoDB_version', 'Database_commit',
  'FerretDB_version', 'FerretDB_commit', 'MongoDB_storage_engine',
  'MongoDB_Oplog_enabled', 'Mongo_sessions_count', 'Node_version']) {
  assert.ok(body.includes(`'${key}'`), `${key} is rendered in HTML4`);
  assert.ok(jade.includes(key), `${key} remains rendered in HTML5`);
}
assert.match(shell, /'\/admin\/settings\/version', '\/admin\/problems\/summary'/,
  'Global Admin navigation reaches Settings without JavaScript');
assert.match(shell, /\/admin\\\/settings.*'settings'.*'Settings'/,
  'Settings navigation has a distinct accessible name');
assert.match(shell, /\/admin\\\/problems.*'problems'.*'Problems'/,
  'Problems navigation has a distinct accessible name');
assert.doesNotMatch(body, /Meteor\.call|fetch\(/,
  'the renderer neither bypasses the service nor performs network I/O');

console.log('  ok - complete shared Version data, operation and authorization');
