'use strict';

// Guard: WeKan talks DDP over sockjs on every platform, and no bundle carries
// uWebSockets.js, the legacy client, or source maps.
// Run: node tests/sockjsEverywhere.test.cjs
//
// uws is not reliable enough yet to be what a default points at, so nothing
// WeKan ships selects it any more. That decision has three halves and all three
// have to hold together, or a deployment breaks in a way that is hard to read:
//
//   1. every default says sockjs - compose files, launchers, the image's own ENV,
//      the snap config, the Sandstorm grain;
//   2. every bundle is trimmed, so the module is not carried around (121 MiB) by
//      builds that will never load it;
//   3. every launcher COERCES an inherited DDP_TRANSPORT=uws back to sockjs. This
//      is the one that stops an upgrade from breaking somebody: an existing
//      docker-compose.yml that says uws would otherwise ask for a module the new
//      image does not have, and crash-loop on a missing require.
//
// A default without the coercion is an upgrade trap; a coercion without the
// trim is dead weight; and a trim without both is a crash. Hence one suite.
//
// The same trim drops two other passengers on every platform - the legacy client
// build (81 MiB) and the source maps (152 MiB once the legacy client's own are
// gone with it). Neither is on any loading path: Meteor serves web.browser to
// every browser when the legacy arch is absent, and a .map is read only by an
// attached debugger, which a released bundle does not have.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(ROOT, rel));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// A line that SETS the variable, in any of the shapes WeKan uses - ignoring
// commented-out ones, which are documentation rather than configuration.
function settings(text) {
  const found = [];
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || t.startsWith('//') || /^REM\b/i.test(t)) continue;
    // A message ABOUT the value, or the coercion's own comparison against it,
    // is not a setting of it. Both mention uws on purpose.
    if (/\becho\b/.test(t)) continue;
    if (/=\s*"uws"\s*\]/.test(t)) continue;
    for (const m of t.matchAll(/DDP_TRANSPORT\s*=\s*["']?([a-z]+)/g)) found.push(m[1]);
  }
  return found;
}

const COMPOSE = fs.readdirSync(ROOT).filter(f => /^docker-compose.*\.yml$/.test(f));

test('every docker-compose file in the repo asks for sockjs', () => {
  assert.ok(COMPOSE.length >= 5, `expected the compose files, found ${COMPOSE.length}`);
  for (const f of COMPOSE) {
    for (const value of settings(read(f))) {
      assert.strictEqual(value, 'sockjs', `${f} sets DDP_TRANSPORT=${value}`);
    }
  }
});

test('the launchers and dev scripts ask for sockjs', () => {
  for (const f of ['start-wekan.sh', 'start-wekan.bat', 'build.sh', 'build.bat',
    'releases/ferretdb/start-wekan.sh', 'releases/ferretdb/wekan-entrypoint.sh']) {
    if (!exists(f)) continue;
    for (const value of settings(read(f))) {
      assert.strictEqual(value, 'sockjs', `${f} sets DDP_TRANSPORT=${value}`);
    }
  }
});

test('the image and the snap default to sockjs', () => {
  assert.ok(/^ {4}DDP_TRANSPORT=sockjs \\$/m.test(read('Dockerfile')),
    "the Dockerfile's ENV block must state the default, not leave it to ddp-server");
  assert.ok(/^DEFAULT_DDP_TRANSPORT="sockjs"$/m.test(read('snap-src/bin/config')),
    'the snap config default must be sockjs');
});

test('the Sandstorm grain pins it, because its environ is the WHOLE environment', () => {
  assert.ok(/\(key\s*=\s*"DDP_TRANSPORT",\s*value\s*=\s*"sockjs"\)/.test(read('sandstorm-pkgdef.capnp')),
    'a grain has nowhere else to get the value from');
});

// The coercion: what keeps an existing deployment working across the upgrade.
for (const launcher of ['releases/ferretdb/wekan-entrypoint.sh', 'releases/ferretdb/start-wekan.sh']) {
  test(`${path.basename(launcher)} coerces an inherited uws back to sockjs`, () => {
    const s = read(launcher);
    assert.ok(/if \[ "\$\{DDP_TRANSPORT:-\}" = "uws" \]; then/.test(s),
      'it must notice the value it cannot honour');
    assert.ok(/DDP_TRANSPORT=sockjs/.test(s), 'and replace it');
    assert.ok(/echo "WeKan: DDP_TRANSPORT=uws is not available/.test(s),
      'and SAY so - a setting silently ignored is worse than one that fails');
    assert.ok(/export DDP_TRANSPORT="\$\{DDP_TRANSPORT:-sockjs\}"/.test(s),
      'and export a value either way, so the server never sees it unset');
  });
}

test('the coercion runs before the server is started, not after', () => {
  const s = read('releases/ferretdb/wekan-entrypoint.sh');
  assert.ok(s.indexOf('DDP_TRANSPORT:-sockjs') < s.indexOf('exec node /build/main.js'),
    'a transport chosen after exec would never be read');
});

// The trim: every place a bundle is assembled has to run it, or one platform
// quietly keeps the 121 MiB and the legacy client.
test('every bundle assembly site trims the bundle', () => {
  // The pairing is the check: prune-build-only-modules.mjs marks the places a
  // built bundle is post-processed, and bundle-trim.mjs belongs at every one.
  for (const f of ['.github/workflows/release-all.yml', 'Dockerfile',
    'releases/install-node-for-arch.sh']) {
    const s = read(f);
    // Count INVOCATIONS - `node .../<script>` - not the prose that names them.
    const prunes = (s.match(/node [^\n]*prune-build-only-modules\.mjs/g) || []).length;
    const trims = (s.match(/node [^\n]*bundle-trim\.mjs/g) || []).length;
    assert.ok(trims >= prunes,
      `${f} post-processes a bundle ${prunes} time(s) but trims it only ${trims} - `
      + 'a bundle that is pruned and not trimmed still carries uWebSockets.js');
  }
});

test('every trim call drops uws, the legacy client and the source maps', () => {
  for (const f of ['.github/workflows/release-all.yml', 'Dockerfile',
    'releases/install-node-for-arch.sh']) {
    // Join shell line continuations first: the amd64 site wraps its arguments
    // onto a second line, and half a command is not a command.
    const joined = read(f).replace(/\\\n\s*/g, ' ');
    const calls = joined.split('\n').filter(l => /node .*bundle-trim\.mjs/.test(l));
    assert.ok(calls.length > 0, `${f} never runs bundle-trim.mjs`);
    for (const call of calls) {
      assert.ok(/--transport sockjs/.test(call),
        `a trim call in ${f} does not pass --transport sockjs: ${call.trim()}`);
      assert.ok(/--drop-legacy-client/.test(call),
        `a trim call in ${f} does not pass --drop-legacy-client: ${call.trim()}`);
      // Source maps are dropped on every platform too, so no call keeps them.
      // They are read by an attached debugger and by nothing on the loading
      // path; a released bundle has neither.
      assert.ok(!/--keep-maps/.test(call),
        `a trim call in ${f} still keeps source maps: ${call.trim()}`);
    }
  }
});

test('the Dockerfile copies the scripts it runs (negative)', () => {
  const s = read('Dockerfile');
  for (const script of ['bundle-trim.mjs', 'prune-unreachable-npm.mjs']) {
    assert.ok(s.includes(`COPY --chmod=755 releases/${script} /tmp/${script}`),
      `a RUN that calls /tmp/${script} needs the COPY that puts it there`);
    assert.ok(s.indexOf(`COPY --chmod=755 releases/${script}`) < s.indexOf(`node /tmp/${script}`),
      `and the COPY of ${script} has to come first`);
  }
});

test('every bundle that is trimmed is also npm-pruned', () => {
  // The two run together everywhere: bundle-trim.mjs takes uWebSockets.js, the
  // legacy client and the source maps; prune-unreachable-npm.mjs takes what it
  // can prove is unreachable in programs/server/npm/node_modules. A site that
  // does one and not the other is a platform quietly shipping ~61 MiB more.
  for (const f of ['.github/workflows/release-all.yml', 'Dockerfile',
    'releases/install-node-for-arch.sh']) {
    const s = read(f);
    const trims = (s.match(/node [^\n]*bundle-trim\.mjs/g) || []).length;
    const prunes = (s.match(/node [^\n]*prune-unreachable-npm\.mjs/g) || []).length;
    assert.strictEqual(prunes, trims,
      `${f} trims ${trims} bundle(s) but npm-prunes ${prunes}`);
  }
});

console.log(`\nsockjsEverywhere: ${passed} tests passed`);
