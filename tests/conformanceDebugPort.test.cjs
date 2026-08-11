'use strict';

// The database-conformance run must not depend on a port nothing in it uses.
// Run: node tests/conformanceDebugPort.test.cjs
//
// From the 2026-08-11_16-55-04 run: EVERY backend failed before a single query
// was compared.
//
//   db-conformance-sqlite.log:
//     Failed to create debug handler ... listen tcp 127.0.0.1:8088:
//     bind: address already in use
//   db-conformance-summary.txt:
//     ERROR sqlite  FerretDB did not start on this backend
//     ERROR postgresql  FerretDB did not start on this backend
//
// FerretDB opens a debug handler for metrics and profiling at 127.0.0.1:8088 by
// default, and EXITS when that address is taken. An unrelated FerretDB happened
// to be running on the machine, so the whole conformance stage reported a
// database problem that was nothing of the sort.
//
// The script already takes this seriously for the two ports it knows about - it
// picks a free wire port, and says in its own comment that it is "chosen so this
// can run WHILE something else is running". The debug port was simply never
// passed, so it always took the default. Nothing in the run queries it, so it is
// not opened at all: `--debug-addr=-` is how FerretDB's main.go spells that
// (`if addr := cli.DebugAddr; addr != "" && addr != "-"`).
//
// Verified by hand against the built binary, with 8088 deliberately held: without
// the flag FerretDB does not come up, with it it does.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const script = fs.readFileSync(
  path.join(repoRoot, 'releases/db-conformance.sh'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Every line that starts the FerretDB being tested.
const launches = script.split('\n').filter(l => /"\$FERRET_BIN" --handler=/.test(l));

test('every backend launch is found', () => {
  assert.strictEqual(launches.length, 4,
    'sqlite, postgresql, mysql and hana - if a backend is added it needs the ' +
    `same treatment; found ${launches.length}`);
});

test('no launch opens the debug handler', () => {
  // Checked on the whole command, which spans continuation lines.
  const commands = script.split('"$FERRET_BIN" --handler=').slice(1)
    .map(chunk => chunk.split(';;')[0]);
  assert.strictEqual(commands.length, 4);
  for (const command of commands) {
    const handler = (command.match(/^(\w+)/) || [])[1];
    assert.ok(/--debug-addr=-/.test(command),
      `the ${handler} launch must pass --debug-addr=- : nothing in the run asks ` +
      `the debug handler anything, and leaving it on the default 8088 makes the ` +
      `whole stage fail when anything else on the machine is using it`);
  }
});

test('the wire port is still chosen to be free, as it was', () => {
  // The fix must not have replaced the care that was already there.
  assert.ok(/FERRET_PORT="\$\(free_port /.test(script),
    'the port FerretDB serves on is still moved off a busy one');
  assert.ok(/WEKAN_CONFORMANCE_PORT/.test(script) && /WEKAN_CONFORMANCE_DB_PORT/.test(script),
    'and both remain overridable');
});

test('the reason is written down where the ports are explained', () => {
  assert.ok(/debug handler/.test(script) && /8088/.test(script),
    'the next person choosing ports here needs to know there is a third one');
  assert.ok(/address already in use/.test(script),
    'quoting the failure is what makes it recognisable when it recurs');
});

console.log(`\n${passed} passed`);
