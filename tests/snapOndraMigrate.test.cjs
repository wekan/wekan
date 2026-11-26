'use strict';
// docs/Platforms/FOSS/Container/Snap/migrate-wekan-ondra-to-wekan.sh: moving a
// server from the wekan-ondra snap to the wekan snap, run against a fake
// `snap` command and a /var/snap of its own. It installs wekan from
// wekan-ondra's channel, sets each of wekan-ondra's settings on wekan (a path
// of wekan-ondra's becoming wekan's), stops and disables wekan-ondra before
// wekan starts - they share their ports - moves wekan's own data aside, copies
// wekan-ondra's, and leaves wekan-ondra's data where it was. Negative: no
// wekan-ondra, a wekan older than it, a refused question and a dry run change
// nothing.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const SCRIPT = path.join(__dirname, '..', 'docs/Platforms/FOSS/Container/Snap/migrate-wekan-ondra-to-wekan.sh');
const tmpBase = process.env.TMPDIR || os.tmpdir();

// A fake snap: `list` answers from snaps.json, `get -d` from settings.json,
// `install`/`refresh` add or update wekan, and every call is logged.
const FAKE = `#!/usr/bin/env bash
dir="$(dirname "$0")"
echo "$*" >> "$dir/calls.log"
case "$1" in
  list)
    python3 - "$dir/snaps.json" "$2" <<'PY'
import json, sys
snaps = json.load(open(sys.argv[1]))
if sys.argv[2] not in snaps:
    sys.exit(1)
print('Name Version Rev Tracking Publisher Notes')
s = snaps[sys.argv[2]]
print(sys.argv[2], s['version'], '1', s.get('tracking', 'latest/stable'), 'xet7', '-')
PY
    ;;
  get) cat "$dir/settings.json" ;;
  install|refresh)
    python3 - "$dir/snaps.json" "$2" "$(cat "$dir/available" 2>/dev/null || echo 9.99)" <<'PY'
import json, sys
snaps = json.load(open(sys.argv[1]))
snaps[sys.argv[2]] = {'version': sys.argv[3]}
json.dump(snaps, open(sys.argv[1], 'w'))
PY
    ;;
esac
exit 0
`;

function setup({ snaps, settings = {}, wekanData = true, available = '9.99' }) {
  const dir = fs.mkdtempSync(path.join(tmpBase, 'ondra-migrate-'));
  const bin = path.join(dir, 'snap');
  fs.writeFileSync(bin, FAKE, { mode: 0o755 });
  fs.writeFileSync(path.join(dir, 'snaps.json'), JSON.stringify(snaps));
  fs.writeFileSync(path.join(dir, 'settings.json'), JSON.stringify(settings));
  fs.writeFileSync(path.join(dir, 'available'), available);
  const root = path.join(dir, 'var-snap');
  const ondra = path.join(root, 'wekan-ondra/common');
  fs.mkdirSync(path.join(ondra, 'files/db'), { recursive: true });
  fs.writeFileSync(path.join(ondra, 'files/db/wekan.db'), 'ondra boards');
  fs.writeFileSync(path.join(ondra, 'Caddyfile'), 'tls /var/snap/wekan-ondra/common/cert.pem /var/snap/wekan-ondra/common/key.pem\n');
  fs.writeFileSync(path.join(ondra, 'mongodb.pid'), '123');
  if (wekanData) {
    fs.mkdirSync(path.join(root, 'wekan/common'), { recursive: true });
    fs.writeFileSync(path.join(root, 'wekan/common/old.txt'), 'wekan before');
  }
  return { dir, root, ondra };
}

function run(ctx, args, input = '') {
  return spawnSync('bash', [SCRIPT, ...args], {
    encoding: 'utf8', input,
    env: { ...process.env, SNAP_BIN: path.join(ctx.dir, 'snap'), WEKAN_SNAP_ROOT: ctx.root, WEKAN_MIGRATE_ALLOW_NONROOT: '1' },
  });
}
const calls = ctx => (fs.existsSync(path.join(ctx.dir, 'calls.log')) ? fs.readFileSync(path.join(ctx.dir, 'calls.log'), 'utf8') : '');
const changing = log => log.split('\n').filter(l => /^(set|install|refresh|stop|start) /.test(l));

// The move.
{
  const ctx = setup({
    snaps: { 'wekan-ondra': { version: '8.10', tracking: 'latest/candidate' } },
    settings: { 'root-url': 'https://kanban.example.com', port: '3001', 'caddy-enabled': true,
      'https-cert-file': '/var/snap/wekan-ondra/common/cert.pem', nested: { a: 1 } },
  });
  const r = run(ctx, ['--yes']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const log = calls(ctx);
  assert.match(log, /^install wekan --channel=latest\/candidate$/m, 'installed from wekan-ondra\'s channel');
  assert.match(log, /^set wekan root-url=https:\/\/kanban\.example\.com$/m);
  assert.match(log, /^set wekan caddy-enabled=true$/m);
  assert.match(log, /^set wekan https-cert-file=\/var\/snap\/wekan\/common\/cert\.pem$/m, 'a path becomes wekan\'s');
  assert.doesNotMatch(log, /nested/, 'an object setting is not flattened into a string');
  const order = changing(log);
  const stopOndra = order.indexOf('stop --disable wekan-ondra');
  const startWekan = order.indexOf('start --enable wekan');
  assert.ok(stopOndra >= 0 && startWekan > stopOndra, 'wekan-ondra stops before wekan starts: the same ports');
  assert.ok(order.findIndex(l => l.startsWith('set wekan ')) < startWekan, 'the settings are there before wekan starts');
  // The data: wekan-ondra's copied, wekan's own moved aside, wekan-ondra's left.
  assert.equal(fs.readFileSync(path.join(ctx.root, 'wekan/common/files/db/wekan.db'), 'utf8'), 'ondra boards');
  assert.equal(fs.readFileSync(path.join(ctx.ondra, 'files/db/wekan.db'), 'utf8'), 'ondra boards');
  const aside = fs.readdirSync(path.join(ctx.root, 'wekan')).find(n => n.startsWith('common.before-wekan-ondra-'));
  assert.ok(aside, 'wekan\'s own data is moved aside');
  assert.equal(fs.readFileSync(path.join(ctx.root, 'wekan', aside, 'old.txt'), 'utf8'), 'wekan before');
  assert.equal(fs.readFileSync(path.join(ctx.root, 'wekan/common/Caddyfile'), 'utf8'),
    'tls /var/snap/wekan/common/cert.pem /var/snap/wekan/common/key.pem\n');
  assert.ok(!fs.existsSync(path.join(ctx.root, 'wekan/common/mongodb.pid')), 'a stopped server\'s pid is not carried over');
  assert.doesNotMatch(log, /^remove /m, 'wekan-ondra is not removed');
  console.log('snapOndraMigrate: settings, data and service moved; wekan-ondra kept, stopped and disabled');
}

// An installed wekan older than wekan-ondra is refreshed; still older, refused.
{
  const ctx = setup({ snaps: { 'wekan-ondra': { version: '8.10' }, wekan: { version: '8.09' } }, available: '8.09' });
  const r = run(ctx, ['--yes']);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /older than wekan-ondra/);
  assert.match(calls(ctx), /^refresh wekan$/m);
  assert.deepEqual(changing(calls(ctx)).filter(l => !l.startsWith('refresh')), [], 'nothing else is changed');
  assert.equal(fs.readFileSync(path.join(ctx.root, 'wekan/common/old.txt'), 'utf8'), 'wekan before');
  console.log('snapOndraMigrate: a wekan older than wekan-ondra is refused, its data untouched');
}

// Negative: no wekan-ondra, a refused question, a dry run.
{
  const ctx = setup({ snaps: {} });
  const r = run(ctx, ['--yes']);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /wekan-ondra is not installed/);
  assert.deepEqual(changing(calls(ctx)), []);
}
{
  const ctx = setup({ snaps: { 'wekan-ondra': { version: '8.10' } } });
  const r = run(ctx, [], 'n\n');
  assert.notEqual(r.status, 0);
  assert.match(r.stdout, /Nothing was changed/);
  assert.deepEqual(changing(calls(ctx)), []);
  assert.ok(!fs.existsSync(path.join(ctx.root, 'wekan/common/files')));
}
{
  const ctx = setup({ snaps: { 'wekan-ondra': { version: '8.10' } }, settings: { port: '3001' } });
  const r = run(ctx, ['--dry-run']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /\+ .*snap set wekan port=3001/);
  assert.match(r.stdout, /\+ .*snap stop --disable wekan-ondra/);
  assert.deepEqual(changing(calls(ctx)), [], 'a dry run only shows');
  assert.ok(!fs.existsSync(path.join(ctx.root, 'wekan/common/files')));
  assert.equal(fs.readFileSync(path.join(ctx.root, 'wekan/common/old.txt'), 'utf8'), 'wekan before');
}
// Not as root, without the test's override: refused before anything.
{
  const ctx = setup({ snaps: { 'wekan-ondra': { version: '8.10' } } });
  if (process.getuid && process.getuid() !== 0) {
    const r = spawnSync('bash', [SCRIPT, '--yes'], { encoding: 'utf8',
      env: { ...process.env, SNAP_BIN: path.join(ctx.dir, 'snap'), WEKAN_SNAP_ROOT: ctx.root, WEKAN_MIGRATE_ALLOW_NONROOT: '' } });
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /run it as root/);
    assert.equal(calls(ctx), '');
  }
}
console.log('snapOndraMigrate: no wekan-ondra, a refused question, a dry run and a non-root run change nothing');
