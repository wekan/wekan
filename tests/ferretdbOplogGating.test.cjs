'use strict';

// Source guard for the FerretDB high-CPU fix (10.16-10.21 reports: the ferretdb
// process pegging ~2 cores while node is idle). ferretdb-control must enable the
// replica set / OpLog ONLY when WEKAN_FERRETDB_OPLOG=true; in the default
// polling-only mode it must run FerretDB STANDALONE, so no OpLog is maintained and
// nothing can spin on tailing it. Matches the gate in wekan-control.
// Run: node tests/ferretdbOplogGating.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const ctl = fs.readFileSync(
  path.join(__dirname, '..', 'snap-src', 'bin', 'ferretdb-control'), 'utf8');

check('replica-set args are gated on WEKAN_FERRETDB_OPLOG', () => {
  assert.ok(/if \[ "true" = "\$\{WEKAN_FERRETDB_OPLOG:-false\}" \]; then/.test(ctl),
    'must branch on WEKAN_FERRETDB_OPLOG (default false)');
  assert.ok(/REPL_SET_ARGS=\(--repl-set-name="\$\{REPL_SET_NAME\}"\)/.test(ctl),
    'oplog mode: pass --repl-set-name');
  assert.ok(/REPL_SET_ARGS=\(\)/.test(ctl),
    'polling mode: NO --repl-set-name (standalone, no OpLog)');
});

check('the exec uses the gated args, not an unconditional --repl-set-name', () => {
  // The single exec line must expand the gated array, and there must be no
  // hard-coded --repl-set-name on the exec anymore.
  assert.ok(/"\$\{REPL_SET_ARGS\[@\]\}"/.test(ctl), 'exec must expand the gated args array');
  const execIdx = ctl.indexOf('exec "$FERRETDB_BIN"');
  assert.ok(execIdx > -1, 'exec must exist');
  const execBlock = ctl.slice(execIdx, execIdx + 300);
  assert.ok(!/--repl-set-name=/.test(execBlock),
    'the exec must NOT hard-code --repl-set-name (it comes from the gated array)');
});

check('default (polling) mode is reflected in the startup log', () => {
  assert.ok(/polling only \(standalone, no OpLog\)/.test(ctl),
    'must log standalone/polling mode');
  assert.ok(/OpLog enabled \(replSet /.test(ctl), 'must log oplog mode when enabled');
});

check('wekan-control still clears MONGO_OPLOG_URL in polling mode (both sides gated)', () => {
  const wc = fs.readFileSync(
    path.join(__dirname, '..', 'snap-src', 'bin', 'wekan-control'), 'utf8');
  assert.ok(/unset MONGO_OPLOG_URL/.test(wc),
    'wekan-control must unset MONGO_OPLOG_URL when WEKAN_FERRETDB_OPLOG is not true');
});

console.log(`\nferretdbOplogGating: ${passed} checks passed`);
