'use strict';

// wekan/wekan#6746: on the reporter's computer every WeKan snap command that
// talked to its own database failed with
//   write tcp 127.0.0.1:53014->127.0.0.1:27019: write: permission denied
// and `journalctl -k` held 1300 lines of
//   apparmor="DENIED" operation="file_perm" class="net" profile="snap.wekan.wekan"
//   ... fport=27019 ... requested="send" denied="send"
// - with the SAME denial for snap-store and standard-notes. FerretDB was
// running (the connection was accepted); the kernel refused the first write.
// That is snapd 2.77.1 on a kernel with an AppArmor socket mediation bug
// (https://bugs.launchpad.net/snapd/+bug/2169038), fixed by a newer kernel and
// worked around by `snap revert snapd`. WeKan cannot lift the denial; what it
// can do is say so at once instead of "FerretDB not ready yet" for two minutes
// followed by advice to read FerretDB's (clean) log.
//
// Run: node tests/snapSocketDenied.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const bin = path.join(root, 'snap-src', 'bin');
const helper = path.join(bin, 'socket-denied');
const control = fs.readFileSync(path.join(bin, 'wekan-control'), 'utf8');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

function bash(script, env = {}) {
  return spawnSync('bash', ['-c', script], {
    encoding: 'utf8',
    // The helper's path goes in through the environment, never into the
    // script text (CodeQL js/shell-command-injection-from-environment).
    env: { ...process.env, SNAP_INSTANCE_NAME: 'wekan', SOCKET_DENIED_HELPER: helper, ...env },
  });
}

function denied(err) {
  return bash(`source "$SOCKET_DENIED_HELPER"; socket_denied "$ERR"`, { ERR: err }).status === 0;
}

// The exact errors the reporter posted: mongorestore (Go driver) and db-eval
// (Node.js driver) word the same refusal differently.
const REPORTED = [
  'error connecting to host: failed to connect to mongodb://127.0.0.1:27019/: server selection error: context deadline exceeded, current topology: { Type: Single, Servers: [{ Addr: 127.0.0.1:27019, Type: Unknown, Last error:  connection(127.0.0.1:27019[-62]) unable to write wire message to network: write tcp 127.0.0.1:53014->127.0.0.1:27019: write: permission denied }, ] }',
  'db-eval ping: connect EACCES 127.0.0.1:27019',
  'db-eval ping: write EPERM',
];

test('the refusals from the report are recognised', () => {
  for (const err of REPORTED) assert.ok(denied(err), err);
});

test('negative: a database that is merely not up is not called an AppArmor problem', () => {
  for (const err of [
    '',
    'db-eval ping: connect ECONNREFUSED 127.0.0.1:27019',
    'db-eval ping: Server selection timed out after 5000 ms',
    'db-eval ping: Authentication failed.',
    'db-eval ping: connection <monitor> to 127.0.0.1:27019 closed',
  ]) {
    assert.ok(!denied(err), `must not match: ${JSON.stringify(err)}`);
  }
});

test('the explanation names the denial, the upstream bug, and both ways out', () => {
  const r = bash(`source "$SOCKET_DENIED_HELPER"; socket_denied_hint`);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.match(r.stdout, /journalctl -k \| grep -i denied/);
  assert.match(r.stdout, /operation="file_perm" class="net"/);
  assert.match(r.stdout, /profile="snap\.wekan\./);
  assert.match(r.stdout, /snapd 2\.77\.1/);
  assert.match(r.stdout, /https:\/\/bugs\.launchpad\.net\/snapd\/\+bug\/2169038/);
  assert.match(r.stdout, /sudo apt update && sudo apt full-upgrade && sudo reboot/);
  assert.match(r.stdout, /sudo snap revert snapd/);
  assert.match(r.stdout, /sudo snap restart wekan/);
  // A parallel install (wekan_2) is told to restart ITSELF.
  const r2 = bash(`source "$SOCKET_DENIED_HELPER"; socket_denied_hint`, { SNAP_INSTANCE_NAME: 'wekan_2' });
  assert.match(r2.stdout, /sudo snap restart wekan_2/);
});

// wekan-control: both readiness loops keep each attempt's error and report a
// kernel refusal on the FIRST attempt, once.
function loop(head) {
  const at = control.indexOf(head);
  assert.ok(at > 0, `missing loop: ${head}`);
  return control.slice(at, control.indexOf('\n    done\n', at));
}

test('wekan-control sources the helper and both wait loops use it', () => {
  assert.match(control, /\[ -f "\$SNAP\/bin\/socket-denied" \] && source "\$SNAP\/bin\/socket-denied"/);
  const ferret = loop('until _ping_err="$("$DB_EVAL" ping "$DB_URL" 2>&1 >/dev/null)"; do');
  assert.match(ferret, /show_socket_denied FerretDB "\$_ping_err"/);
  const mongo = loop('until _primary_err="$("$DB_EVAL" primary "$DB_URL" 2>&1 >/dev/null)"; do');
  assert.match(mongo, /show_socket_denied MongoDB "\$_primary_err"/);
  for (const body of [ferret, mongo]) {
    assert.match(body, /\[ "\$db_denied_shown" != "true" \] && show_socket_denied/);
    assert.match(body, /db_denied_shown=true/);
    // Not behind the two-minute timeout: that is the delay being removed.
    const call = body.indexOf('show_socket_denied');
    const timeout = body.indexOf('-ge "$WEKAN_DB_WAIT_TIMEOUT"');
    assert.ok(call > 0 && timeout > call, 'the refusal must be named before the timeout hint');
  }
});

test('show_socket_denied prints only for a refusal, and says so in the log', () => {
  const start = control.indexOf('show_socket_denied() {');
  const fn = control.slice(start, control.indexOf('\n}\n', start) + 3);
  const run = (err) => bash(
    'source "$SOCKET_DENIED_HELPER"; MONGO_HOST=127.0.0.1; MONGO_PORT=27019; eval "$SHOW_FN"; show_socket_denied FerretDB "$ERR"',
    { ERR: err, SHOW_FN: fn },
  );
  const yes = run(REPORTED[0]);
  assert.strictEqual(yes.status, 0);
  assert.match(yes.stdout, /WeKan: cannot talk to FerretDB on 127\.0\.0\.1:27019:/);
  assert.match(yes.stdout, /write: permission denied/);
  assert.match(yes.stdout, /sudo snap revert snapd/);
  const no = run('db-eval ping: connect ECONNREFUSED 127.0.0.1:27019');
  assert.strictEqual(no.status, 1);
  assert.strictEqual(no.stdout, '');
});

test('negative: no snap script explains "permission denied" on its own any more', () => {
  // One explanation, in one file: a second, vaguer copy is how the
  // "refused by this system's security policy" line came to say nothing about
  // what to do. Every script that talks to the database goes through
  // socket-denied for it.
  for (const name of fs.readdirSync(bin)) {
    if (name === 'socket-denied') continue;
    const text = fs.readFileSync(path.join(bin, name), 'utf8');
    assert.ok(!/\*"permission denied"\*/.test(text),
      `${name} must use socket_denied, not its own "permission denied" match`);
    if (/socket_denied/.test(text)) {
      assert.match(text, /source "\$SNAP\/bin\/socket-denied"/, `${name} must source the helper`);
    }
  }
});

console.log(`\nsnapSocketDenied: all ${passed} tests passed`);
