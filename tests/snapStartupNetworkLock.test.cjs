'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'snap-src/bin/startup-network');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-startup-lock-'));
const snap = path.join(temp, 'snap');
const common = path.join(temp, 'common');
const commands = path.join(temp, 'commands');
fs.mkdirSync(path.join(snap, 'bin'), { recursive: true });
fs.mkdirSync(common, { recursive: true });
fs.mkdirSync(commands, { recursive: true });
fs.copyFileSync(source, path.join(snap, 'bin/startup-network'));
fs.writeFileSync(path.join(snap, 'bin/node'), `#!/bin/sh
if [ "$2" = posix ] && [ "$3" = --ferretdb ]; then
  printf "export PORT='3001'\\nexport ROOT_URL='http://192.0.2.10:3001'\\nexport FERRETDB_LISTEN_ADDR='127.0.0.1:27019'\\nexport MONGO_URL='mongodb://127.0.0.1:27019/wekan'\\n"
else
  printf "export PORT='3001'\\nexport ROOT_URL='http://192.0.2.10:3001'\\n"
fi
`, { mode: 0o755 });
fs.writeFileSync(path.join(commands, 'snapctl'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });

function invoke() {
  return execFileSync('bash', ['-c', `. '${path.join(snap, 'bin/startup-network')}'; printf '%s\\n' "$MONGO_URL"`], {
    encoding: 'utf8', timeout: 12_000,
    env: { ...process.env, SNAP: snap, SNAP_COMMON: common,
      PATH: `${commands}:${process.env.PATH}` },
  });
}

// This is the exact v11.34 failure: mkdir happened, no owner/state was written,
// and every service waited forever while snap reported its shell as active.
fs.mkdirSync(path.join(common, '.startup-network.lock'));
assert.match(invoke(), /mongodb:\/\/127\.0\.0\.1:27019\/wekan/);
assert.ok(fs.existsSync(path.join(common, '.startup-network.env')),
  'a stale empty lock is recovered and endpoint state is generated');
assert.ok(!fs.existsSync(path.join(common, '.startup-network.lock')),
  'the successful owner removes its lock');

fs.rmSync(path.join(common, '.startup-network.env'));
fs.mkdirSync(path.join(common, '.startup-network.lock'));
fs.writeFileSync(path.join(common, '.startup-network.lock/pid'), '999999999\n');
assert.match(invoke(), /mongodb:\/\/127\.0\.0\.1:27019\/wekan/,
  'a lock whose owner is gone is recovered immediately');

fs.rmSync(temp, { recursive: true, force: true });
console.log('snapStartupNetworkLock: legacy and dead-owner locks recovered');
