'use strict';
// Sandstorm is at sandstorm.org. v12.69's build-sandstorm stopped because the
// certificate of the old installer host had expired; install.sandstorm.org,
// the installer it serves and the dl.sandstorm.org it downloads from are
// current, and that installer configures a development server at
// local.sandstorm.org.
//
// This file names no Sandstorm host but sandstorm.org: it looks for every OTHER
// top-level domain by shape. A substring check for the old host name was CodeQL
// alert #598 (incomplete URL substring sanitization, CWE-20).
// Run: node tests/sandstormOrgHosts.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

test('every Sandstorm build installs Sandstorm from install.sandstorm.org', () => {
  const releaseAll = read('.github/workflows/release-all.yml');
  assert.match(releaseAll, /releases\/fetch\.sh" -o \/tmp\/install-sandstorm\.sh https:\/\/install\.sandstorm\.org\n/);
  for (const wf of ['.github/workflows/sandstorm.yml', '.github/workflows/sandstorm-store.yml']) {
    assert.match(read(wf), /curl https:\/\/install\.sandstorm\.org \| sudo bash -s -- -d/, wf);
  }
  assert.match(read('releases/install-sandstorm.sh'), /curl https:\/\/install\.sandstorm\.org \| bash/);
});

test('the store workflow publishes to both app markets (#6833)', () => {
  const store = read('.github/workflows/sandstorm-store.yml');
  assert.match(store, /"\$SPK_BIN" publish --webkey=https:\/\/api-[0-9a-f]+\.oasis\.sandstorm\.org#\S+ "\$SPK"/);
  // The older market's API, alpha-api.sandstorm.<its own TLD>.
  assert.match(store, /"\$SPK_BIN" publish --webkey=https:\/\/alpha-api\.sandstorm\.(?!org\b)[a-z]+\/#\S+ "\$SPK"/);
});

// A Sandstorm host on any top-level domain but org, written as a URL: with a
// scheme or "//" before it, or a port or a path right after it. Shape alone is
// not enough - services.sandstorm.id is a property path, and sandstorm.js a
// file - and the domains reserved for tests (RFC 2606) are not hosts anyone
// runs.
const RESERVED = new Set(['example', 'test', 'invalid', 'localhost']);
function otherHosts(line) {
  const hosts = [];
  const re = /((?:[a-z][a-z0-9+.-]*:)?\/\/)?((?:[a-z0-9-]+\.)*)sandstorm\.([a-z]{2,})\b(:\d|\/)?/gi;
  for (const m of line.matchAll(re)) {
    const [whole, scheme, sub, tld, after] = m;
    if (tld.toLowerCase() === 'org' || RESERVED.has(tld.toLowerCase())) continue;
    if (!scheme && !after) continue;
    const at = m.index;
    if (!scheme && at > 0 && /[A-Za-z0-9_$.-]/.test(line[at - 1])) continue;
    hosts.push({ host: `${sub}sandstorm.${tld}`, subdomain: sub.replace(/\.$/, ''), tld, whole });
  }
  return hosts;
}

// Kept on purpose, each by its subdomain and where it is:
//   demo      - the app demo has no sandstorm.org name;
//   alpha-api - the store workflow publishes to the older app market too
//               (#6833), and this is that market's API.
const KEPT = [
  { subdomain: 'demo', where: () => true },
  { subdomain: 'alpha-api', where: (file, line) => file === '.github/workflows/sandstorm-store.yml' && /--webkey=https:\/\/alpha-api\./.test(line) },
];
const kept = (file, line, host) => KEPT.some(k => k.subdomain === host.subdomain && k.where(file, line));

test('negative: no tracked file names a Sandstorm host on another top-level domain', () => {
  // A released changelog section is a record, and stays as it was written.
  const files = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n')
    .filter(f => f && f !== 'CHANGELOG.md' && f !== 'CHANGELOG-big.md' && !f.startsWith('old-CHANGELOG/'));
  const found = [];
  for (const f of files) {
    let text;
    try { text = read(f); } catch (e) { continue; }
    if (text.includes('\0') || !/sandstorm\./.test(text)) continue;
    text.split('\n').forEach((line, i) => {
      for (const host of otherHosts(line)) {
        if (!kept(f, line, host)) found.push(`${f}:${i + 1}: ${host.host}`);
      }
    });
  }
  assert.deepEqual(found, []);
});

test('the host check finds what it should, and nothing else', () => {
  const tld = ['i', 'o'].join('');   // the old one, without writing its host here
  const hostsOf = line => otherHosts(line).map(h => h.host);
  assert.deepEqual(hostsOf(`see https://docs.sandstorm.${tld}/en/latest/`), [`docs.sandstorm.${tld}`]);
  assert.deepEqual(hostsOf(`[Sandstorm](https://sandstorm.${tld})`), [`sandstorm.${tld}`]);
  assert.deepEqual(hostsOf(`open http://local.sandstorm.${tld}:6080/`), [`local.sandstorm.${tld}`]);
  assert.deepEqual(hostsOf(`curl https://install.sandstorm.${tld} | bash`), [`install.sandstorm.${tld}`]);
  assert.deepEqual(hostsOf(`api-URL.local.sandstorm.${tld}:6080/api`), [`api-URL.local.sandstorm.${tld}`]);
  // Negative: sandstorm.org, property paths, file names, test domains, words.
  for (const line of ['https://docs.sandstorm.org/en/', 'user.services.sandstorm.id', 'doc.services.sandstorm.permissions)',
    'sandstorm.js', '../../sandstorm.js', 'workflows/sandstorm.yml', 'sandstorm-pkgdef.capnp',
    'https://abc123.sandstorm.example/x', 'Sandstorm is at sandstorm.org']) {
    assert.deepEqual(hostsOf(line), [], line);
  }
  // The exceptions hold only where they are written.
  assert.ok(kept('docs/x.md', `https://demo.sandstorm.${tld}/appdemo/x`, { subdomain: 'demo' }));
  assert.ok(kept('.github/workflows/sandstorm-store.yml', `publish --webkey=https://alpha-api.sandstorm.${tld}/#k`, { subdomain: 'alpha-api' }));
  assert.ok(!kept('docs/x.md', `--webkey=https://alpha-api.sandstorm.${tld}/#k`, { subdomain: 'alpha-api' }));
  assert.ok(!kept('docs/x.md', `curl https://install.sandstorm.${tld}`, { subdomain: 'install' }));
});

console.log(`sandstormOrgHosts: ${passed} tests passed`);
