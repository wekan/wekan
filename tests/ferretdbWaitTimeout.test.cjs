'use strict';

// Regression guard (no Meteor) for wekan/wekan#6476: "9.98: Wekan starts but
// doesn't open a listening port". With database=ferretdb, snap wekan-control
// blocks BEFORE starting node until FerretDB accepts connections. That wait loop
// used to have no timeout and no diagnostics, so when FerretDB never started
// listening (crashed/incompatible per-arch binary, locked/corrupt SQLite, failed
// migration hand-off) WeKan blocked there forever, its web port never opened,
// and the only symptom was a silent "FerretDB not ready yet" repeating.
//
// The FerretDB branch must now mirror the MongoDB branch: a WEKAN_DB_WAIT_TIMEOUT
// after which it prints an actionable hint once, then keeps retrying.
//
// Run: node tests/ferretdbWaitTimeout.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const control = fs.readFileSync(path.join(repoRoot, 'snap-src/bin/wekan-control'), 'utf8');

// Slice out the FerretDB branch only (up to the MongoDB `elif`), so we assert on
// the branch that actually regressed and not the already-correct MongoDB one.
const start = control.indexOf('if [ "ferretdb" = "${DATABASE}" ]; then');
const elif = control.indexOf('elif [ "true" != "${DISABLE_MONGODB}" ]; then', start);
assert.ok(start !== -1 && elif !== -1 && elif > start, 'could not locate the FerretDB branch');
const ferretBranch = control.slice(start, elif);

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('the FerretDB wait loop has a bounded, overridable timeout', () => {
  assert.ok(/WEKAN_DB_WAIT_TIMEOUT=\$\{WEKAN_DB_WAIT_TIMEOUT:-120\}/.test(ferretBranch),
    'WEKAN_DB_WAIT_TIMEOUT (default 120, user-overridable) must gate the hint');
  assert.ok(/db_waited=\$\(\(db_waited \+ 5\)\)/.test(ferretBranch),
    'elapsed wait time must be tracked so the timeout can fire');
  assert.ok(/db_waited" -ge "\$WEKAN_DB_WAIT_TIMEOUT/.test(ferretBranch),
    'the hint must trigger once the timeout is reached');
});

test('the hint is printed at most once', () => {
  assert.ok(/db_hint_shown=false/.test(ferretBranch));
  assert.ok(/db_hint_shown" != "true"/.test(ferretBranch));
  assert.ok(/db_hint_shown=true/.test(ferretBranch));
});

test('the hint points to the FerretDB service log and the SQLite dir', () => {
  assert.ok(/snap logs \$\{WEKAN_SNAP_SVC\}\.ferretdb/.test(ferretBranch),
    'must tell the admin where the real error is');
  assert.ok(ferretBranch.includes('$FERRETDB_SQLITE_DIR'),
    'must name the SQLite database directory to check for locks/corruption');
  assert.ok(/database=mongodb/.test(ferretBranch),
    'must offer the fallback to keep working on MongoDB');
});

test('it still keeps retrying after the hint (does not give up / crash)', () => {
  assert.ok(/until "\$DB_EVAL" ping "\$DB_URL"/.test(ferretBranch),
    'must keep polling FerretDB readiness');
  assert.ok(/FerretDB not ready yet, retrying in 5 seconds/.test(ferretBranch));
  assert.ok(/\n\s*sleep 5\n/.test(ferretBranch));
  assert.ok(/echo "FerretDB is ready\."/.test(ferretBranch),
    'must proceed to start WeKan once FerretDB answers');
});

// Negative guard against the exact regression: the FerretDB branch must NOT be a
// bare infinite loop again (an `until ping` whose body is only echo + sleep, with
// no timeout bookkeeping).
test('NEGATIVE: the FerretDB wait is not a silent infinite loop', () => {
  const loopBody = ferretBranch.slice(
    ferretBranch.indexOf('until "$DB_EVAL" ping'),
    ferretBranch.indexOf('echo "FerretDB is ready."'),
  );
  assert.ok(loopBody.includes('WEKAN_DB_WAIT_TIMEOUT'),
    'the wait loop body must reference the timeout — no unbounded silent wait');
  assert.ok(loopBody.includes('db_waited'),
    'the wait loop must advance an elapsed-time counter');
});

console.log(`\nAll ${passed} FerretDB wait-timeout tests passed`);
