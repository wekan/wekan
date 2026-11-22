'use strict';
// docs/Platforms/FOSS/Container/Docker/Meteor3/localhost-limit.sh: each WeKan
// container of the Meteor 3 Docker hosting may reach, on this machine, only its
// own Node.js port and its database port. The containers share the host's
// network (network_mode: host), so without this one customer's WeKan could
// open every other customer's 127.0.0.1:<port>.
//
// A fake `docker`, a fake /proc, a fake Caddyfile and a fake `iptables` that
// records what it was told play the server. Nothing touches a real firewall.
// Run: node --test tests/meteor3LocalhostLimit.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'docs/Platforms/FOSS/Container/Docker/Meteor3');
const tmpRoot = process.env.TMPDIR || path.join(root, '.tools/tmp');
fs.mkdirSync(tmpRoot, { recursive: true });

function world({ containers }) {
  const base = fs.mkdtempSync(path.join(tmpRoot, 'meteor3-limit-'));
  const here = path.join(base, 'here');
  const bin = path.join(base, 'bin');
  const proc = path.join(base, 'proc');
  const cg = path.join(base, 'cgroup');
  for (const d of [here, bin, proc, cg, path.join(here, 'restore', 'c3')]) fs.mkdirSync(d, { recursive: true });
  fs.copyFileSync(path.join(dir, 'localhost-limit.sh'), path.join(here, 'localhost-limit.sh'));
  fs.writeFileSync(path.join(here, '1createdb.sh'), 'MONGO_PORT=27017\n');
  fs.writeFileSync(path.join(cg, 'cgroup.controllers'), 'cpu memory\n');
  // c3 has no PORT in its environment: it comes from its compose file.
  fs.writeFileSync(path.join(here, 'restore', 'c3', 'docker-compose.yml'),
    'services:\n  c3:\n    container_name: c3-tenant\n    environment:\n      - PORT=3003\n      - MONGO_URL=mongodb://c3_user:x@localhost:27017/c3?replicaSet=rs0\n');
  const caddy = path.join(base, 'Caddyfile');
  fs.writeFileSync(caddy, 'a.example.com {\n\timport wekan_proxy 3001\n}\nb.example.com {\n\timport wekan_proxy 3002\n}\n'
    + 'c.example.com {\n\treverse_proxy 127.0.0.1:3003\n}\n# import wekan_proxy 3999\nd.example.com {\n\timport wekan_proxy 3004\n}\n');
  const data = path.join(base, 'docker');
  fs.mkdirSync(data);
  containers.forEach((c, i) => {
    const pid = String(100 + i);
    fs.appendFileSync(path.join(data, 'ps'), `${c.id} ${c.name}\n`);
    fs.writeFileSync(path.join(data, `${c.id}.pid`), `${pid}\n`);
    fs.writeFileSync(path.join(data, `${c.id}.env`), `${c.env.join('\n')}\n`);
    fs.mkdirSync(path.join(proc, pid));
    fs.writeFileSync(path.join(proc, pid, 'cgroup'), `0::/system.slice/docker-${c.id}.scope\n`);
  });
  // docker ps --format ... | docker inspect -f <format> <id>
  fs.writeFileSync(path.join(bin, 'docker'), `#!/bin/bash
# The containers are on the server: only there does docker answer.
[ "\${ON_SERVER:-}" = 1 ] || exit 1
d=${JSON.stringify(data)}
case "$1" in
  ps) cat "$d/ps" ;;
  inspect) case "$3" in *Pid*) cat "$d/$4.pid" ;; *) cat "$d/$4.env" ;; esac ;;
esac
`, { mode: 0o755 });
  // ssh -- <host> bash -s: the command runs "on the server".
  const sshLog = path.join(base, 'ssh.log');
  fs.writeFileSync(path.join(bin, 'ssh'), `#!/bin/bash
printf '%s\\n' "$*" >> ${JSON.stringify(sshLog)}
while [ "$1" != "--" ]; do shift; done; shift; shift
ON_SERVER=1 exec "$@"
`, { mode: 0o755 });
  const log = path.join(base, 'iptables.log');
  for (const t of ['iptables', 'ip6tables']) {
    fs.writeFileSync(path.join(bin, t), `#!/bin/bash
echo "${t} $*" >> ${JSON.stringify(log)}
case "$1" in -C) exit 1 ;; -S) exit 1 ;; esac
exit 0
`, { mode: 0o755 });
  }
  const run = (args, { remote = false } = {}) => spawnSync('bash', [path.join(here, 'localhost-limit.sh'), ...args], {
    encoding: 'utf8',
    env: {
      ...process.env,
      ON_SERVER: remote ? '' : '1',
      PATH: `${bin}:${process.env.PATH}`,
      CADDYFILE: caddy, PROC_ROOT: proc, CGROUP_ROOT: cg,
      LOCALHOST_LIMIT_NOT_ROOT_OK: '1',
    },
  });
  const logged = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8') : '');
  const sshCalls = () => (fs.existsSync(sshLog) ? fs.readFileSync(sshLog, 'utf8').trim().split('\n').filter(Boolean) : []);
  return { run, logged, sshCalls, base };
}

const CONTAINERS = [
  { id: 'aaa111', name: 'c1-app', env: ['PORT=3001', 'MONGO_URL=mongodb://c1_user:x@localhost:27017/c1?replicaSet=rs0', 'MONGO_OPLOG_URL=mongodb://c1_user:x@localhost:27017/local'] },
  { id: 'bbb222', name: 'c2-tenant', env: ['PORT=3002', 'MONGO_URL=mongodb://c2_user:x@127.0.0.1:27018/c2'] },
  { id: 'ccc333', name: 'c3-tenant', env: ['ROOT_URL=https://c.example.com'] },
  { id: 'ddd444', name: 'unrelated-db', env: ['PORT=9999'] },
];

test('plan: each container, its port, its database port, and the rules - nothing changed', () => {
  const w = world({ containers: CONTAINERS });
  const r = w.run(['plan']);
  assert.match(r.stdout, /c1-app\s+port 3001\s+database 27017/);
  assert.match(r.stdout, /c2-tenant\s+port 3002\s+database 27018/);
  assert.match(r.stdout, /c3-tenant\s+port 3003/, 'a PORT missing from the environment comes from restore/<customer>/docker-compose.yml');
  assert.doesNotMatch(r.stdout, /unrelated-db/, 'only *-app and *-tenant containers are WeKan');
  assert.match(r.stdout, /Caddy proxies to .*: 3001 3002 3003 3004/);
  assert.doesNotMatch(r.stdout, /3999/, 'a commented-out Caddyfile line is not a port');
  assert.match(r.stdout, /Caddy proxies to 3004, but no running WeKan container has that PORT/);
  assert.match(r.stdout, /-m cgroup --path \/system\.slice\/docker-aaa111\.scope .* -p tcp --dport 3001 -j RETURN/);
  assert.match(r.stdout, /docker-aaa111\.scope .* -p tcp --dport 27017 -j RETURN/);
  assert.match(r.stdout, /docker-bbb222\.scope .* -p tcp --dport 27018 -j RETURN/);
  assert.match(r.stdout, /docker-aaa111\.scope .* --ctstate ESTABLISHED,RELATED -j RETURN/, 'Caddy -> WeKan answers still go out');
  assert.match(r.stdout, /Nothing was changed/);
  assert.equal(w.logged(), '', 'plan never runs iptables');
});

test('negative: a container may not reach another customer\'s port - its chain ends in REJECT', () => {
  const w = world({ containers: CONTAINERS });
  const lines = w.run(['plan']).stdout.split('\n').filter(l => l.includes('docker-aaa111.scope'));
  const ports = lines.map(l => (l.match(/--dport (\d+)/) || [])[1]).filter(Boolean);
  assert.deepEqual([...new Set(ports)].sort(), ['27017', '3001', '53'], 'c1 is allowed only its own port, its database and DNS');
  assert.ok(!ports.includes('3002') && !ports.includes('3003'), 'never another customer\'s port');
  assert.match(lines[lines.length - 1], /-j REJECT$/, 'everything else c1 sends to a local port is rejected');
});

test('apply builds the new chain before swapping the jump, for IPv4 and IPv6', () => {
  const w = world({ containers: CONTAINERS });
  const r = w.run(['apply']);
  assert.equal(r.status, 0, r.stderr);
  const log = w.logged();
  for (const t of ['iptables', 'ip6tables']) {
    const mine = log.split('\n').filter(l => l.startsWith(`${t} `));
    const firstAppend = mine.findIndex(l => l.startsWith(`${t} -A WEKAN-LOCALHOST-new`));
    const jump = mine.findIndex(l => l === `${t} -I OUTPUT 1 -o lo -j WEKAN-LOCALHOST-new`);
    const rename = mine.findIndex(l => l === `${t} -E WEKAN-LOCALHOST-new WEKAN-LOCALHOST`);
    assert.ok(firstAppend >= 0 && jump > firstAppend && rename > jump, `${t}: rules, then the jump, then the rename`);
  }
  assert.ok(!/-o eth|-o en|-A INPUT/.test(log), 'only loopback output is touched, never the internet or INPUT');
});

test('negative: apply refuses without cgroup v2, and without root', () => {
  const w = world({ containers: CONTAINERS });
  fs.rmSync(path.join(w.base, 'cgroup', 'cgroup.controllers'));
  const r = w.run(['apply']);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /cgroup v2/);
  assert.equal(w.logged(), '');
  // Root is asked of the SERVER (its id -u came back with the rest), not of
  // the machine the menu runs on.
  const w2 = world({ containers: CONTAINERS });
  const r2 = spawnSync('bash', [path.join(w2.base, 'here', 'localhost-limit.sh'), 'apply'], {
    encoding: 'utf8',
    env: { ...process.env, PATH: `${path.join(w2.base, 'bin')}:${process.env.PATH}`, ON_SERVER: '1',
      CADDYFILE: path.join(w2.base, 'Caddyfile'), PROC_ROOT: path.join(w2.base, 'proc'), CGROUP_ROOT: path.join(w2.base, 'cgroup') },
  });
  if (process.getuid && process.getuid() !== 0) {
    assert.notEqual(r2.status, 0);
    assert.match(r2.stderr, /as root/);
    assert.equal(w2.logged(), '', 'nothing reaches the firewall');
  }
});

test('with a server: its containers, Caddyfile and firewall over SSH, the settings read here', () => {
  const w = world({ containers: CONTAINERS });
  const r = w.run(['--host', 'c2', 'apply'], { remote: true });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Server: c2 \(over SSH\)/);
  assert.match(r.stdout, /c1-app\s+port 3001/, 'the containers came from the server');
  assert.match(r.stdout, /c3-tenant\s+port 3003/, 'the PORT missing on the server came from restore/ here');
  const calls = w.sshCalls();
  assert.equal(calls.length, 3, 'one call to read the server, one to put the rules in place, one to show them');
  assert.ok(calls.every(c => c === '-- c2 bash -s'), calls.join(' | '));
  assert.match(w.logged(), /iptables -E WEKAN-LOCALHOST-new WEKAN-LOCALHOST/, 'the rules went to the server');
});

test('negative: a host that is an ssh option is refused, and nothing is run', () => {
  const w = world({ containers: CONTAINERS });
  const r = w.run(['--host', '-oProxyCommand=x', 'plan'], { remote: true });
  assert.equal(r.status, 2);
  assert.deepEqual(w.sshCalls(), []);
});

test('ufw: the jump goes before ufw\'s loopback ACCEPT, and status says when it does not', () => {
  const src = fs.readFileSync(path.join(dir, 'localhost-limit.sh'), 'utf8');
  assert.match(src, /"\$T" -I OUTPUT 1 -o lo -j "\$C-new"/, 'inserted first in OUTPUT');
  assert.match(src, /NOT in effect: ufw's loopback ACCEPT comes first/);
  assert.match(src, /apply_script \| on_server[\s\S]*?status_script \| on_server/, 'apply shows the order it left');
});

test('the menu offers it; with a server set it runs here and reaches the server itself', () => {
  const menu = fs.readFileSync(path.join(dir, 'build.sh'), 'utf8');
  assert.match(menu, /"Server setup\|localhost-limit\.sh\|limit\|Limit localhost access to current node\.js port and database port only"/);
  assert.match(menu, /limit\)[\s\S]*?if \[ -n "\$h" \]; then[\s\S]*?\(cd "\$HERE" && bash "\.\/\$script" --host "\$h" "\$a"\)[\s\S]*?else\s+run_script "\$script" "\$a"/);
});
