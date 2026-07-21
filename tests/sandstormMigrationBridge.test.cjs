'use strict';

// Guards for the Sandstorm grain "please wait" bridge that fixes the framed-grain
// error noted in docs/Platforms/FOSS/Sandstorm/Sandstorm.md: while nothing is bound on
// the grain's app port during first-launch migration and the handoff to WeKan, the
// browser shows "This page can not be displayed embedded in another page". start.js now
// runs migration-bridge.js as a child process on the app port across those windows.
//
// These are wiring/ordering guards (there is no Node runtime here to boot a grain): the
// bridge must start before migration, YIELD the port around the importer (which serves
// its own dashboard on the app port), resume for the handoff, and be released before
// Meteor binds the port — and every use must be best-effort so it can never break
// grain startup.
//
// Run: node tests/sandstormMigrationBridge.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

console.log('sandstormMigrationBridge:');

test('the bridge page is a self-contained node:http 503 server on PORT', () => {
  const src = read('sandstorm-src/migration-bridge.js');
  assert.ok(/require\('http'\)/.test(src), 'uses node http only');
  assert.ok(/process\.env\.PORT/.test(src), 'listens on the PORT it is given');
  assert.ok(/listen\(\s*PORT\s*,\s*'127\.0\.0\.1'/.test(src), 'binds loopback (behind sandstorm-http-bridge)');
  assert.ok(/writeHead\(503/.test(src), 'answers 503 so it is treated as a temporary outage');
  assert.ok(/BRIDGE_MESSAGE/.test(src), 'shows the message start.js passes');
  assert.ok(/http-equiv="refresh"/.test(src), 'auto-refreshes so it opens WeKan when ready');
});

test('start.js manages the bridge best-effort (guarded, never crashes startup)', () => {
  const src = read('sandstorm-src/start.js');
  assert.ok(/const BRIDGE\s*=\s*path\.join\(APPROOT, 'migration-bridge\.js'\)/.test(src), 'resolves the bridge in the deps payload');
  assert.ok(/function startBridge/.test(src) && /function stopBridge/.test(src), 'has start/stop helpers');
  assert.ok(/fs\.existsSync\(BRIDGE\)/.test(src), 'skips cleanly if the bridge is not bundled');
  assert.ok(/bridge\.on\('error'/.test(src), 'a bridge spawn error must not break startup');
  assert.ok(/process\.on\('exit'[^)]*\)[^}]*bridge/.test(src.replace(/\n/g, ' ')), 'kills the bridge if the grain exits');
  // stopBridge must release the port (kill) and give the OS a moment before the next bind.
  const stop = src.slice(src.indexOf('function stopBridge'));
  assert.ok(/kill\(/.test(stop) && /sleep\(/.test(stop), 'stopBridge kills the child then waits for the port to free');
});

test('the bridge yields the app port around the importer, and is released for Meteor', () => {
  const src = read('sandstorm-src/start.js');
  const iTopStart = src.indexOf("startBridge(willMigrate");
  const iMigrate  = src.indexOf('migrateIfNeeded()', iTopStart);
  assert.ok(iTopStart > 0 && iMigrate > iTopStart, 'bridge starts before migration begins');

  const iStopImporter = src.indexOf('stopBridge();', src.indexOf('const ferret = startFerret(DB_PORT);   // the PERMANENT'));
  const iImporter     = src.indexOf('spawnSync(NODE, [IMPORTER]');
  assert.ok(iStopImporter > 0 && iStopImporter < iImporter, 'bridge is released BEFORE the importer binds the port');

  const iHandoff = src.indexOf("startBridge('Finishing up");
  assert.ok(iHandoff > iImporter, 'bridge resumes AFTER the importer for the handoff');

  const iRequire  = src.indexOf("require('./main.js')");
  const iStopMain = src.lastIndexOf('stopBridge();', iRequire);
  assert.ok(iStopMain > 0 && iStopMain < iRequire, 'bridge is released BEFORE Meteor binds the port');
});

test('the spk build ships the bridge into the deps payload', () => {
  const src = read('sandstorm-src/build-deps.sh');
  assert.ok(/cp -f "\$REPO\/sandstorm-src\/migration-bridge\.js"\s+"\$DEPS\/migration-bridge\.js"/.test(src),
    'build-deps.sh copies migration-bridge.js next to start.js');
});

test('the Sandstorm doc no longer tells users to close and reopen the grain', () => {
  const doc = read('docs/Platforms/FOSS/Sandstorm/Sandstorm.md');
  assert.ok(/migration-bridge\.js/.test(doc), 'documents the bridge');
  assert.ok(!/trying to fix it later/i.test(doc), 'the unfixed-workaround note is gone');
});

console.log(`\n${passed} tests passed`);
