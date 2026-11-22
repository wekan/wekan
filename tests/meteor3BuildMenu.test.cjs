'use strict';
// docs/Platforms/FOSS/Container/Docker/Meteor3/build.sh: one menu for every
// script of the Meteor 3 Docker hosting setup, its settings in settings.ini, and
// - with a server set - every script run on that server over SSH, in the
// server's directory, never on this machine.
//
// A fake `ssh` on PATH plays the server: it records what it was asked and runs
// the command in a temporary "server" directory. Nothing touches a real host.
// Run: node --test tests/meteor3BuildMenu.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'docs/Platforms/FOSS/Container/Docker/Meteor3');
const script = path.join(dir, 'build.sh');
const tmpRoot = process.env.TMPDIR || path.join(root, '.tools/tmp');
fs.mkdirSync(tmpRoot, { recursive: true });

function world() {
  const base = fs.mkdtempSync(path.join(tmpRoot, 'meteor3-menu-'));
  const bin = path.join(base, 'bin');
  const server = path.join(base, 'server');
  fs.mkdirSync(bin);
  fs.mkdirSync(server);
  const log = path.join(base, 'ssh.log');
  // ssh [-t] -- <host> <command>: the command runs with "/srv/wekan" mapped to
  // the fake server's directory.
  fs.writeFileSync(path.join(bin, 'ssh'), `#!/bin/bash
printf '%s\\n' "$*" >> ${JSON.stringify(log)}
while [ "$1" != "--" ]; do shift; done; shift
host="$1"; shift
cmd="\${*//\\/srv\\/wekan/$FAKE_SERVER_DIR}"
exec bash -c "$cmd"
`, { mode: 0o755 });
  const ini = path.join(base, 'settings.ini');
  const run = (args, input = '') => spawnSync('bash', [script, ...args], {
    input, encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, WEKAN_METEOR3_SETTINGS: ini, FAKE_SERVER_DIR: server },
  });
  return { base, server, log, ini, run, done: () => fs.rmSync(base, { recursive: true, force: true }) };
}

test('every .sh script of the Meteor3 directory is in the menu', () => {
  const w = world();
  try {
    const listed = w.run(['--list']).stdout.split('\n').map(l => l.split(/\s+/)[0]).filter(Boolean);
    const scripts = spawnSync('find', ['.', '-name', '*.sh', '!', '-name', 'build.sh'], { cwd: dir, encoding: 'utf8' })
      .stdout.split('\n').filter(Boolean).map(f => f.replace(/^\.\//, ''));
    assert.deepEqual([...listed].sort(), [...scripts].sort());
  } finally { w.done(); }
});

test('settings are saved in settings.ini from the menu, mode 600', () => {
  const w = world();
  try {
    w.run([], 's\n1\nc2\n2\n/srv/wekan\n3\n0\n0\n');
    const ini = fs.readFileSync(w.ini, 'utf8');
    assert.match(ini, /\[server\]\nhost = c2\ndir = \/srv\/wekan\nsync = no/);
    assert.equal(fs.statSync(w.ini).mode & 0o777, 0o600);
    // And read back: the menu says where it runs.
    assert.match(w.run([], '0\n').stdout, /Runs on: c2, in \/srv\/wekan {2}\(over SSH; nothing runs here\)/);
  } finally { w.done(); }
});

test('with a server set, the script runs THERE, in its directory, after the scripts are copied', () => {
  const w = world();
  try {
    fs.writeFileSync(w.ini, '[server]\nhost = c2\ndir = /srv/wekan\nsync = yes\n');
    const r = w.run(['sh.sh', 'customer1']);
    // sh.sh ran on the "server": its own error, from its directory, about the
    // customer file that lives there.
    assert.match(r.stdout, /Error: File 'customer1\.txt' not found\./);
    const calls = fs.readFileSync(w.log, 'utf8');
    assert.match(calls, /^-- c2 mkdir -p \/srv\/wekan && tar -xf - -C \/srv\/wekan$/m, 'copied first');
    assert.match(calls, /^-t -- c2 cd \/srv\/wekan && bash sh\.sh customer1$/m, 'then run there, with a terminal');
    for (const f of ['1createdb.sh', 'backup.sh', 'apt/update.sh', 'restore/docker-start.yml', 'caddy/Caddyfile']) {
      assert.ok(fs.existsSync(path.join(w.server, f)), `${f} is on the server`);
    }
    // Negative: what holds passwords is never copied there from here.
    for (const f of ['settings.ini', 'admin.txt', 'build.sh']) assert.ok(!fs.existsSync(path.join(w.server, f)), `${f} is not copied`);
  } finally { w.done(); }
});

test('negative: a server name that is an ssh option, a relative directory, an unknown script, a bad customer name', () => {
  const w = world();
  try {
    fs.writeFileSync(w.ini, '[server]\nhost = -oProxyCommand=touch /tmp/x\ndir = /srv/wekan\n');
    const r = w.run(['sh.sh', 'customer1']);
    assert.match(r.stdout, /is not a host name/);
    assert.ok(!fs.existsSync(w.log), 'ssh was never called');
    assert.match(w.run([], 's\n2\nrelative/dir\n0\n0\n').stdout, /An absolute path, starting with \//);
    assert.equal(w.run(['rm.sh']).status, 2);
    fs.writeFileSync(w.ini, '[server]\nhost = c2\ndir = /srv/wekan\nsync = no\n');
    const bad = w.run([], '12\nCustomer;rm\n0\n');
    assert.match(bad.stderr, /Not a database name/);
    assert.ok(!fs.existsSync(w.log) || !/bash/.test(fs.readFileSync(w.log, 'utf8')), 'nothing was run');
  } finally { w.done(); }
});

test('without a server, it runs on this machine; a config example is shown, never run', () => {
  const w = world();
  try {
    const r = w.run(['sh.sh', 'customer1']);
    assert.match(r.stdout, /Error: File 'customer1\.txt' not found\./);
    assert.ok(!fs.existsSync(w.log), 'no ssh');
    assert.match(w.run(['encrypt-ram/encrypt-ram_etc-default-grub.sh']).stdout, /GRUB_CMDLINE_LINUX_DEFAULT/);
  } finally { w.done(); }
});
