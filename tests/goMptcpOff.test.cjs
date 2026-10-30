'use strict';
// CVE-2026-98432 (golang-announce, 2026-10): a Linux kernel use-after-free in
// IPv4 TCP connection handling, shown to give remote code execution through an
// MPTCP listener. Since Go 1.24 every Linux listen socket of a Go program is
// MPTCP by default, and WeKan ships two Go servers: Caddy (the snap's web
// server, on 80/443) and FerretDB (the default database). Every place WeKan
// starts one sets GODEBUG=multipathtcp=0 - Caddy is an upstream binary, so the
// environment is the only place it can be turned off; the FerretDB fork also
// builds with `godebug multipathtcp=0`. The real fix is a patched kernel.
// Run: node tests/goMptcpOff.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };
const LAUNCHERS = ['releases/ferretdb/wekan-entrypoint.sh', 'releases/ferretdb/start-wekan.sh'];
const SNIPPET = /case ",\$\{GODEBUG:-\}," in\n  \*,multipathtcp=\*\) ;;\n  \*\) GODEBUG="\$\{GODEBUG:\+\$GODEBUG,\}multipathtcp=0"; export GODEBUG ;;\nesac\n/;

test('the snap turns it off for every app, Caddy and FerretDB among them', () => {
  const snap = read('snapcraft.yaml');
  const env = snap.slice(snap.indexOf('\nenvironment:\n'), snap.indexOf('\nplatforms:'));
  assert.match(env, /^  GODEBUG: "multipathtcp=0"$/m);
  assert.match(snap, /^ {4}caddy:\n {8}command: \.\/bin\/caddy-control$/m, 'Caddy is one of those apps');
  assert.match(snap, /^ {4}ferretdb:\n {8}command: \.\/bin\/ferretdb-control$/m);
});

test('the Docker entrypoint and the bundle launcher set it before anything starts', () => {
  for (const file of LAUNCHERS) {
    const text = read(file);
    const at = text.search(SNIPPET);
    assert.ok(at > 0, file);
    assert.ok(at < text.indexOf('ferretdb', text.indexOf('esac', at)), `${file}: before FerretDB is started`);
  }
});

test('the launcher line: added when unset, appended to a setting, an operator\'s choice kept', () => {
  const snippet = read(LAUNCHERS[1]).match(SNIPPET)[0];
  const run = value => execFileSync('sh', ['-c', `${snippet}printf %s "$GODEBUG"`],
    { encoding: 'utf8', env: { PATH: process.env.PATH, ...(value === null ? {} : { GODEBUG: value }) } });
  assert.equal(run(null), 'multipathtcp=0');
  assert.equal(run(''), 'multipathtcp=0');
  assert.equal(run('gctrace=1'), 'gctrace=1,multipathtcp=0');
  assert.equal(run('multipathtcp=1'), 'multipathtcp=1', 'an operator who turned it on keeps it');
  assert.equal(run('x=1,multipathtcp=2'), 'x=1,multipathtcp=2');
});

test('every docker-compose FerretDB, and the Sandstorm grain\'s, run with it off', () => {
  const composes = fs.readdirSync(ROOT).filter(f => /^docker-compose.*\.yml$/.test(f));
  let services = 0;
  for (const file of composes) {
    // Each FerretDB service block: from its "ferretdb:" key to the next service.
    for (const m of read(file).matchAll(/^ {2}(#?)([\w-]*ferretdb[\w-]*):\n([\s\S]*?)(?=^ {2}#?[\w-]+:\n|^\S|(?![\s\S]))/gm)) {
      const [, commented, name, body] = m;
      if (!/image:/.test(body)) continue;
      services += 1;
      const want = commented ? /^ {2}# {4}- GODEBUG=multipathtcp=0$/m : /^ {6}GODEBUG: multipathtcp=0$/m;
      assert.match(body, want, `${file}: ${name}`);
    }
  }
  assert.ok(services >= 7, `found ${services} FerretDB services`);
  assert.match(read('sandstorm-src/start.js'), /FERRETDB_STATE_DIR: STATE_DIR, GODEBUG: 'multipathtcp=0' \}/);
});

test('negative: nothing turns MPTCP back on', () => {
  const files = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n')
    .filter(f => /(\.(sh|yml|yaml|js|cjs|mjs|bat)|Dockerfile[^/]*)$/.test(f) && !f.startsWith('tests/'));
  const found = [];
  for (const f of files) {
    read(f).split('\n').forEach((line, i) => {
      if (/multipathtcp=1|SetMultipathTCP\(\s*true/.test(line) && !/^\s*(#|\/\/)/.test(line)) found.push(`${f}:${i + 1}`);
    });
  }
  assert.deepEqual(found, []);
});

console.log(`goMptcpOff: ${passed} tests passed`);
