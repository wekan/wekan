'use strict';

// Every Caddyfile WeKan ships or documents is Caddy 2.
//
// The snap runs Caddy 2, and snap-src/bin/migrate-caddyfile-v1-to-v2.sh treats
// a Caddyfile that `caddy adapt` rejects as Caddy v1: it moves it aside to
// Caddyfile.v1.bak-<n> and, when it cannot convert it, puts the default in its
// place - on every start. Somebody who copied `proxy / localhost:3001 {
// websocket transparent }` from these docs had their file renamed each time
// they put it back. So no example may be Caddy v1, and the shipped templates
// must proxy to where WeKan really listens.
//
// Static checks always run. With a Caddy 2 binary (CADDY=/path/to/caddy, or
// one unpacked at .tools/caddy-<version>/caddy) every example is also run
// through `caddy adapt`, exactly as the snap does.
// Run: node tests/caddyfileExamplesV2.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log(`ok - ${name}`); };

// ---- where the Caddyfiles are ----------------------------------------------

const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT }).toString().split('\0').filter(Boolean);

// A directive only Caddy configures, so a block with one of these and a site
// block is a Caddyfile (and not nginx, Apache or a shell script).
const CADDY_DIRECTIVE = /^\s*(reverse_proxy|proxy\s|tls\b|file_server|encode\s|gzip\s*$|root\s|browse\b|fastcgi\s|php_fastcgi\s|redir\s|ext\s)/m;
const SITE_BLOCK = /^[^\s#{}][^{};=()]*\{\s*$/m;
const NOT_CADDY = /^\s*(server\s*\{|location\s|proxy_pass|listen\s+\d)|;\s*$|^\s*(<|function|const |var |import |export |\$\s)/m;

function caddyfiles() {
  const found = [];
  for (const rel of tracked) {
    if (/^(old-CHANGELOG|CHANGELOG\.md|tests\/|\.agents\/)/.test(rel)) continue;
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) continue;
    if (path.basename(rel) === 'Caddyfile') {
      found.push({ where: `${rel}:1`, text: fs.readFileSync(abs, 'utf8') });
    } else if (rel.endsWith('.md')) {
      const text = fs.readFileSync(abs, 'utf8');
      for (const m of text.matchAll(/```[^\n]*\n([\s\S]*?)```/g)) {
        const block = m[1];
        if (CADDY_DIRECTIVE.test(block) && SITE_BLOCK.test(block) && !NOT_CADDY.test(block)) {
          found.push({ where: `${rel}:${text.slice(0, m.index).split('\n').length + 1}`, text: block });
        }
      }
    }
  }
  return found;
}

// snapcraft.yaml writes the migration's fallback template inline.
function snapcraftTemplate() {
  const yaml = fs.readFileSync(path.join(ROOT, 'snapcraft.yaml'), 'utf8');
  const m = /cat > \$SNAPCRAFT_PART_INSTALL\/etc\/Caddyfile << 'EOF'\n([\s\S]*?)\n\s*EOF\n/.exec(yaml);
  assert.ok(m, 'snapcraft.yaml still writes etc/Caddyfile');
  const lines = m[1].split('\n');
  const indent = Math.min(...lines.filter(l => l.trim()).map(l => l.match(/^ */)[0].length));
  return lines.map(l => l.slice(indent)).join('\n') + '\n';
}

// snap-src/Caddyfile with its commented TLS example switched on, as a user
// would: everything from `#{$DOMAIN` on loses its leading '#'.
function templateUncommented() {
  const text = fs.readFileSync(path.join(ROOT, 'snap-src/Caddyfile'), 'utf8');
  const at = text.indexOf('#{$DOMAIN');
  assert.ok(at > 0, 'snap-src/Caddyfile still has the commented TLS example');
  return text.slice(0, at) + text.slice(at).replace(/^#/gm, '');
}

const examples = [
  ...caddyfiles(),
  { where: 'snapcraft.yaml etc/Caddyfile', text: snapcraftTemplate() },
  { where: 'snap-src/Caddyfile, TLS example uncommented', text: templateUncommented() },
];

// ---- the Caddy v1 shapes ---------------------------------------------------

const V1 = [
  [/^\s*proxy\s+\//m, 'v1 `proxy /` (Caddy 2: reverse_proxy)'],
  [/^\s*(websocket|transparent)\s*$/m, 'v1 proxy preset websocket/transparent (Caddy 2 does both by default)'],
  [/^\s*tls\s+(self_signed|off)\b/m, 'v1 `tls self_signed`/`tls off` (Caddy 2: tls internal / an http:// address)'],
  [/^\s*browse\s*$/m, 'v1 `browse` (Caddy 2: file_server browse)'],
  [/^\s*ext\s+\./m, 'v1 `ext` (Caddy 2: try_files)'],
  [/^\s*fastcgi\s+\//m, 'v1 `fastcgi /` (Caddy 2: php_fastcgi)'],
  [/^\s*gzip\s*$/m, 'v1 `gzip` (Caddy 2: encode gzip)'],
  [/^\s*root\s+\/\S+\s*$/m, 'v1 `root /path` (Caddy 2 reads /path as a matcher: root * /path)'],
  [/^\s*log\s+\/\S+/m, 'v1 `log /file` (Caddy 2: log { output file ... })'],
  [/^\s*errors\s*\{/m, 'v1 `errors` block'],
];

test('the scan finds the Caddyfiles it is meant to guard', () => {
  const where = examples.map(e => e.where);
  for (const expected of ['docs/Platforms/FOSS/Container/Snap/Install.md', 'docs/Platforms/Webserver/Caddy.md',
    'docs/Platforms/Webserver/Local-self-signed-TLS.md', 'docs/Platforms/FOSS/Container/Docker/Meteor3/caddy/Caddyfile',
    'snap-src/Caddyfile:1']) {
    assert.ok(where.some(w => w.startsWith(expected)), `${expected} has a Caddyfile`);
  }
  assert.ok(examples.length >= 25, `found ${examples.length}`);
});

test('negative: no Caddyfile example uses Caddy v1 syntax', () => {
  const offenders = [];
  for (const e of examples) {
    for (const [re, why] of V1) if (re.test(e.text)) offenders.push(`${e.where}: ${why}`);
  }
  assert.deepEqual(offenders, []);
});

test('negative: no Caddy 1 command line or installer is documented', () => {
  const offenders = [];
  for (const rel of tracked.filter(f => /^docs\/.*\.md$/.test(f))) {
    const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    if (/caddy\S*\s+-conf=|getcaddy\.com/.test(text)) offenders.push(rel);
  }
  assert.deepEqual(offenders, []);
});

test('the snap templates proxy to where WeKan listens, from the snap settings', () => {
  // With caddy enabled, WeKan listens on caddy-bind-port (default 3001) and
  // Caddy on `port`; caddy-control's environment carries both.
  for (const text of [fs.readFileSync(path.join(ROOT, 'snap-src/Caddyfile'), 'utf8'), snapcraftTemplate()]) {
    assert.match(text, /^:\{\$CADDY_PORT:8080\} \{/m);
    assert.match(text, /^\s*reverse_proxy localhost:\{\$CADDY_BIND_PORT:3001\}/m);
    assert.doesNotMatch(text, /localhost:3000/, 'nothing of WeKan listens on 3000 in the snap');
  }
  const settings = fs.readFileSync(path.join(ROOT, 'snap-src/bin/wekan-read-settings'), 'utf8');
  assert.match(settings, /export CADDY_PORT=\$\{PORT\}/);
  assert.match(settings, /export PORT=\$\{CADDY_BIND_PORT\}/);
  assert.match(fs.readFileSync(path.join(ROOT, 'snap-src/bin/caddy-control'), 'utf8'), /source \$SNAP\/bin\/wekan-read-settings/);
});

// ---- the real Caddy --------------------------------------------------------

function findCaddy() {
  if (process.env.CADDY) return process.env.CADDY;
  const tools = path.join(ROOT, '.tools');
  if (!fs.existsSync(tools)) return null;
  const dirs = fs.readdirSync(tools).filter(d => /^caddy-2\./.test(d)).sort().reverse();
  for (const d of dirs) {
    const bin = path.join(tools, d, 'caddy');
    if (fs.existsSync(bin)) return bin;
  }
  return null;
}

test('with Caddy 2: `caddy adapt` accepts every example, as the snap would', () => {
  const caddy = findCaddy();
  if (!caddy) { console.log('  (skipped: no Caddy 2 binary; set CADDY or unpack one at .tools/caddy-<version>/caddy)'); return; }
  const tmpRoot = process.env.TMPDIR || path.join(ROOT, '.tools/tmp');
  fs.mkdirSync(tmpRoot, { recursive: true });
  const dir = fs.mkdtempSync(path.join(tmpRoot, 'caddyfile-examples-'));
  const failures = [];
  try {
    examples.forEach((e, i) => {
      const file = path.join(dir, `${i}.Caddyfile`);
      fs.writeFileSync(file, e.text);
      const r = spawnSync(caddy, ['adapt', '--config', file, '--adapter', 'caddyfile'],
        { env: { ...process.env, LC_ALL: 'C', HOME: dir }, encoding: 'utf8' });
      if (r.status !== 0) {
        const msg = (r.stderr.match(/"msg":"([^"]*)"/g) || [r.stderr.trim()]).pop();
        failures.push(`${e.where}: ${msg}`);
      }
    });
    // The settings reach the file through the environment.
    const file = path.join(dir, 'template.Caddyfile');
    fs.copyFileSync(path.join(ROOT, 'snap-src/Caddyfile'), file);
    const json = execFileSync(caddy, ['adapt', '--config', file, '--adapter', 'caddyfile'],
      { env: { ...process.env, CADDY_PORT: '80', CADDY_BIND_PORT: '3005', HOME: dir }, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
    assert.match(json, /"listen":\[":80"\]/);
    assert.match(json, /"dial":"localhost:3005"/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  assert.deepEqual(failures, []);
  console.log(`  (${examples.length} Caddyfiles adapted with ${caddy})`);
});

console.log(`# ${passed} passed`);
