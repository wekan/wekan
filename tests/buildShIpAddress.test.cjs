'use strict';

// build.sh's dev-server menu finds the machine's IP address on macOS and on
// Linux. Run: node tests/buildShIpAddress.test.cjs
//
// "CUSTOM-IP:PORT" listed addresses with `ip address`, which macOS does not
// have ("ip: command not found"), and the CURRENT-IP options tried only en0
// and en1 on macOS, missing a Mac whose network is on another interface. The
// functions are run here in bash with stub commands for each platform.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const source = fs.readFileSync(path.join(__dirname, '..', 'build.sh'), 'utf8');
const fn = name => {
  const match = source.match(new RegExp(`^function ${name}\\(\\)\\{[\\s\\S]*?^\\}$`, 'm'));
  assert.ok(match, `${name} exists in build.sh`);
  return match[0];
};
const functions = `${fn('current_ip_address')}\n${fn('list_ip_addresses')}\n`;

const tmpRoot = path.join(__dirname, '..', '.tools', 'tmp');
fs.mkdirSync(tmpRoot, { recursive: true });

function run(ostype, stubs, script) {
  const bin = fs.mkdtempSync(path.join(tmpRoot, 'ipstub-'));
  try {
    for (const [name, body] of Object.entries(stubs)) {
      fs.writeFileSync(path.join(bin, name), `#!/bin/sh\n${body}\n`, { mode: 0o755 });
    }
    // Only the stubs and the basic tools the functions pipe through.
    for (const tool of ['awk', 'sed', 'head', 'cat']) {
      const real = execFileSync('/bin/sh', ['-c', `command -v ${tool}`]).toString().trim();
      fs.symlinkSync(real, path.join(bin, tool));
    }
    return execFileSync('/bin/bash', ['-c', `OSTYPE=${ostype}\n${functions}\n${script}`],
      { env: { PATH: bin } }).toString().trim();
  } finally {
    fs.rmSync(bin, { recursive: true, force: true });
  }
}

const IFCONFIG = `cat <<'OUT'
lo0: flags=8049<UP,LOOPBACK,RUNNING,MULTICAST> mtu 16384
	inet 127.0.0.1 netmask 0xff000000
	inet6 ::1 prefixlen 128
en8: flags=8863<UP,BROADCAST,SMART,RUNNING,SIMPLEX,MULTICAST> mtu 1500
	inet 192.168.1.20 netmask 0xffffff00 broadcast 192.168.1.255
OUT`;

// macOS: the default-route interface wins, even when it is not en0/en1.
const mac = {
  route: 'echo "   route to: default"; echo "  interface: en8"',
  ipconfig: '[ "$2" = en8 ] && echo 192.168.1.20 || exit 1',
  ifconfig: IFCONFIG,
};
assert.equal(run('darwin25', mac, 'current_ip_address'), '192.168.1.20');
// No default route: the usual interface names are still tried.
assert.equal(run('darwin25', { ...mac, route: 'exit 1', ipconfig: '[ "$2" = en1 ] && echo 10.0.0.5 || exit 1' },
  'current_ip_address'), '10.0.0.5');
// Nothing at all: localhost, never an empty ROOT_URL host.
assert.equal(run('darwin25', { route: 'exit 1', ipconfig: 'exit 1' }, 'current_ip_address'), 'localhost');
// The list uses ifconfig: there is no `ip` on macOS.
assert.equal(run('darwin25', mac, 'list_ip_addresses'), 'lo0 127.0.0.1\nen8 192.168.1.20');
console.log('  ok - macOS: default-route interface address, and ifconfig for the list');

// Linux: the kernel's source address, then hostname -I, and `ip` for the list.
const linux = {
  ip: `case "$*" in
  "route get 1.1.1.1") echo "1.1.1.1 via 192.168.0.1 dev eth0 src 192.168.0.42 uid 1000";;
  "-4 -o address show") echo "1: lo    inet 127.0.0.1/8 scope host lo"; echo "2: eth0    inet 192.168.0.42/24 brd 192.168.0.255 scope global eth0";;
esac`,
};
assert.equal(run('linux-gnu', linux, 'current_ip_address'), '192.168.0.42');
assert.equal(run('linux-gnu', { ip: 'exit 1', hostname: 'echo "10.1.2.3 172.17.0.1"' }, 'current_ip_address'), '10.1.2.3');
assert.equal(run('linux-gnu', {}, 'current_ip_address'), 'localhost');
assert.equal(run('linux-gnu', linux, 'list_ip_addresses'), 'lo 127.0.0.1\neth0 192.168.0.42');
console.log('  ok - Linux: route source address, hostname -I fallback, and ip for the list');

// Negative: the menu never calls `ip` or macOS-only commands outside these
// functions, and every dev-server option uses them.
const outside = source.replace(fn('current_ip_address'), '').replace(fn('list_ip_addresses'), '')
  .replace(/^\s*#.*$/gm, '');
assert.doesNotMatch(outside, /^\s*ip address\s*$/m, 'no bare `ip address` in the menu');
assert.doesNotMatch(outside, /ipconfig getifaddr|ip route get|hostname -I/, 'IP lookups live only in current_ip_address');
assert.equal((source.match(/(?<!_)IPADDRESS=\$\(current_ip_address\)/g) || []).length, 2, 'both CURRENT-IP options');
assert.match(source, /list_ip_addresses\n\t\tDEFAULT_IPADDRESS=\$\(current_ip_address\)/, 'CUSTOM-IP lists and offers a default');
console.log('  ok - every dev-server IP option uses the shared functions');
