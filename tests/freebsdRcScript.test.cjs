'use strict';

// #2662: the FreeBSD bundle carries an rc.d script (releases/bsd/rc.d/wekan),
// so `service wekan start` runs it at boot like any FreeBSD service.
// Source-read test: no FreeBSD here, so the script is checked for the rc.subr
// contract and syntax-checked with sh -n; bsd.yml requires it in the zip.
// Run: node tests/freebsdRcScript.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const file = path.join(ROOT, 'releases/bsd/rc.d/wekan');
const rc = fs.readFileSync(file, 'utf8');

// Positive: the rc.subr contract.
assert.ok(rc.startsWith('#!/bin/sh\n'));
assert.ok(fs.statSync(file).mode & 0o111, 'executable');
execFileSync('sh', ['-n', file]);
for (const re of [/^# PROVIDE: wekan$/m, /^# REQUIRE: LOGIN NETWORKING$/m, /^# KEYWORD: shutdown$/m,
  /^\. \/etc\/rc\.subr$/m, /^name="wekan"$/m, /^rcvar="wekan_enable"$/m, /^load_rc_config "\$name"$/m,
  /^run_rc_command "\$1"$/m, /^: "\$\{wekan_enable:=NO\}"$/m]) {
  assert.match(rc, re);
}
assert.ok(rc.indexOf('load_rc_config') < rc.indexOf(': "${wekan_enable:=NO}"'), 'defaults after rc.conf is read');
console.log('  ok - a well-formed rc.subr script, off unless enabled');

// It runs the bundle's own launcher, as wekan_user, with the settings in env.
assert.match(rc, /command="\/usr\/sbin\/daemon"/);
assert.match(rc, /command_args="-f -P \$\{pidfile\} -o \$\{wekan_logfile\} -t \$\{name\} \$\{wekan_dir\}\/start-wekan\.sh"/);
assert.match(rc, /command_args="-u \$\{wekan_user\} \$\{command_args\}"/);
assert.match(rc, /wekan_env="PORT=\$\{wekan_port\} ROOT_URL=\$\{wekan_root_url\} WRITABLE_PATH=\$\{wekan_data\} HOME=\$\{wekan_data\} \$\{wekan_env\}"/);
for (const v of ['PORT', 'ROOT_URL', 'WRITABLE_PATH']) {
  assert.match(fs.readFileSync(path.join(ROOT, 'releases/ferretdb/start-wekan.sh'), 'utf8'),
    new RegExp(`export ${v}="\\$\\{${v}:-`), `start-wekan.sh still takes ${v} from the environment`);
}
console.log('  ok - start-wekan.sh under daemon(8), configured from rc.conf');

// Negative: it never runs WeKan as root, never restarts on top of the
// launcher's own loop, and stop reaches node and FerretDB, not only the shell.
assert.doesNotMatch(rc, /daemon[^\n]*-r\b|-r -P|-f -r/, 'start-wekan.sh already restarts WeKan');
assert.doesNotMatch(rc, /wekan_user:=root/);
assert.match(rc, /kill -TERM -- "-\$\{pgid\}"/, 'the process group, so FerretDB stops too');
assert.match(rc, /wait_for_pids "\$\{pid\}"/);
console.log('  ok - unprivileged, one restart loop, stop ends the whole group');

// Shipped and required.
assert.match(fs.readFileSync(path.join(ROOT, 'releases/bsd/build-bundle.sh'), 'utf8'),
  /if \[ "\$os" = freebsd \]; then\s*\n\s*mkdir -p "\$root\/bundle\/rc\.d"\s*\n\s*install -m 555 "\$root\/releases\/bsd\/rc\.d\/wekan" "\$root\/bundle\/rc\.d\/wekan"/);
assert.match(fs.readFileSync(path.join(ROOT, '.github/workflows/bsd.yml'), 'utf8'), /grep -q " bundle\/rc\.d\/wekan\$" zip-listing\.txt/);
console.log('  ok - the FreeBSD bundle ships it and CI requires it');

console.log('\nfreebsdRcScript: all tests passed');
