// The UCS migration's `docker exec` without the Docker CLI.
//
// Debian's docker-cli was in the WeKan image only so the UCS migration worker
// could run `mongo` and `mongoexport` inside the old database container. It is
// a Go program, and its Go 1.24 standard library was most of the image's Quay
// vulnerability scan. releases/ucs-migration/docker-exec.mjs speaks the Docker
// Engine API over the socket instead; this drives it against a fake engine on a
// unix socket and checks the image no longer installs any Docker CLI.
//
// Run: node tests/ucsDockerExec.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(ROOT, 'releases/ucs-migration/docker-exec.mjs');
const { createDemuxer, socketPath } = await import(SCRIPT);

const frame = (type, text) => {
  const payload = Buffer.from(text);
  const head = Buffer.alloc(8);
  head[0] = type;
  head.writeUInt32BE(payload.length, 4);
  return Buffer.concat([head, payload]);
};

// A minimal Docker Engine: exec create, an upgraded exec start that writes the
// given frames in tiny pieces, and exec inspect.
function fakeEngine({ container = 'wekan-db', frames = [], exitCode = 0, startStatus = 101 } = {}) {
  const dir = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'docker-exec-'));
  const sock = path.join(dir, 'docker.sock');
  const seen = [];
  const server = net.createServer((conn) => {
    let buf = Buffer.alloc(0);
    conn.on('data', (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      const end = buf.indexOf('\r\n\r\n');
      if (end < 0) return;
      const head = buf.subarray(0, end).toString();
      const length = Number(/content-length: (\d+)/i.exec(head)?.[1] || 0);
      if (buf.length < end + 4 + length) return;
      const [method, url] = head.split(' ');
      const body = buf.subarray(end + 4, end + 4 + length).toString();
      seen.push({ method, url, body: body ? JSON.parse(body) : null, head });
      buf = Buffer.alloc(0);
      const json = (status, obj) => conn.end(`HTTP/1.1 ${status} X\r\nContent-Type: application/json\r\n` +
        `Content-Length: ${Buffer.byteLength(JSON.stringify(obj))}\r\nConnection: close\r\n\r\n${JSON.stringify(obj)}`);
      if (method === 'POST' && url === `/containers/${container}/exec`) return json(201, { Id: 'exec1' });
      if (method === 'POST' && url.startsWith('/containers/')) return json(404, { message: `No such container: ${decodeURIComponent(url.split('/')[2])}` });
      if (method === 'POST' && url === '/exec/exec1/start') {
        if (startStatus !== 101) return json(startStatus, { message: 'start refused' });
        const all = Buffer.concat([Buffer.from('HTTP/1.1 101 UPGRADED\r\nContent-Type: application/vnd.docker.raw-stream\r\n' +
          'Connection: Upgrade\r\nUpgrade: tcp\r\n\r\n'), ...frames]);
        // Three bytes at a time: headers and payloads split across reads.
        let i = 0;
        const pump = () => { if (i >= all.length) return conn.end(); conn.write(all.subarray(i, i += 3)); setImmediate(pump); };
        return pump();
      }
      if (method === 'GET' && url === '/exec/exec1/json') return json(200, { ExitCode: exitCode, Running: false });
      return json(500, { message: 'unexpected' });
    });
  });
  return new Promise((resolve) => server.listen(sock, () => resolve({
    sock, seen, close: () => new Promise((r) => server.close(() => { fs.rmSync(dir, { recursive: true, force: true }); r(); })),
  })));
}

function run(args, env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [SCRIPT, ...args], { env: { ...process.env, ...env } });
    let stdout = '', stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

test('runs the command in the container and keeps stdout, stderr and the exit code apart', async () => {
  const big = 'x'.repeat(70000);
  const engine = await fakeEngine({
    frames: [frame(1, '{"a":1}\n'), frame(2, 'connected to: 127.0.0.1\n'), frame(1, `${big}\n`), frame(1, '{"b":2}\n')],
    exitCode: 3,
  });
  try {
    const r = await run(['wekan-db', 'mongoexport', '--db', 'wekan', '-c', 'cards'], { DOCKER_HOST: `unix://${engine.sock}` });
    assert.equal(r.code, 3, r.stderr);
    assert.equal(r.stdout, `{"a":1}\n${big}\n{"b":2}\n`);
    assert.equal(r.stderr, 'connected to: 127.0.0.1\n');
    const create = engine.seen[0];
    assert.equal(create.url, '/containers/wekan-db/exec');
    assert.deepEqual(create.body.Cmd, ['mongoexport', '--db', 'wekan', '-c', 'cards']);
    assert.equal(create.body.Tty, false);
    assert.equal(create.body.AttachStdin, false);
    assert.match(engine.seen[1].head, /Upgrade: tcp/);
  } finally { await engine.close(); }
});

test('exit status 0 passes through', async () => {
  const engine = await fakeEngine({ frames: [frame(1, '1\n')], exitCode: 0 });
  try {
    const r = await run(['wekan-db', 'mongo', '--quiet', 'wekan', '--eval', 'db.cards.count()'], { DOCKER_HOST: `unix://${engine.sock}` });
    assert.equal(r.code, 0);
    assert.equal(r.stdout, '1\n');
  } finally { await engine.close(); }
});

test('Docker refusals exit 125 with the reason, never 0 (negative)', async () => {
  const engine = await fakeEngine({ container: 'other' });
  try {
    let r = await run(['wekan-db', 'mongo'], { DOCKER_HOST: `unix://${engine.sock}` });
    assert.equal(r.code, 125);
    assert.match(r.stderr, /HTTP 404 No such container: wekan-db/);
    r = await run(['wekan-db', 'mongo'], { DOCKER_HOST: `unix://${engine.sock}.missing` });
    assert.equal(r.code, 125);
    assert.match(r.stderr, /ENOENT/);
    r = await run(['wekan-db'], {});
    assert.equal(r.code, 125);
    assert.match(r.stderr, /usage/);
    r = await run(['wekan-db', 'mongo'], { DOCKER_HOST: 'tcp://127.0.0.1:2375' });
    assert.equal(r.code, 125);
    assert.match(r.stderr, /only a unix:\/\/ DOCKER_HOST/);
  } finally { await engine.close(); }
  const refused = await fakeEngine({ startStatus: 409 });
  try {
    const r = await run(['wekan-db', 'mongo'], { DOCKER_HOST: `unix://${refused.sock}` });
    assert.equal(r.code, 125);
    assert.match(r.stderr, /exec start: HTTP 409/);
  } finally { await refused.close(); }
});

test('the demuxer reassembles frames split anywhere', () => {
  const out = [], err = [];
  const demux = createDemuxer((b) => out.push(b.toString()), (b) => err.push(b.toString()));
  const all = Buffer.concat([frame(1, 'ab'), frame(2, 'cd'), frame(1, '')]);
  for (const byte of all) demux(Buffer.from([byte]));
  assert.deepEqual(out, ['ab', '']);
  assert.deepEqual(err, ['cd']);
  assert.equal(socketPath({}), '/var/run/docker.sock');
  assert.equal(socketPath({ DOCKER_HOST: 'unix:///x/d.sock' }), '/x/d.sock');
});

test('the image installs no Docker CLI or other Go client, and the migration tools use docker-exec.mjs', () => {
  const dockerfile = fs.readFileSync(path.join(ROOT, 'Dockerfile'), 'utf8');
  const installs = [...dockerfile.matchAll(/^[^#\n]*apt-get install[^\n]*/gm)].map((m) => m[0]).join('\n');
  assert.doesNotMatch(installs, /\b(docker-cli|docker\.io|docker-ce|docker-ce-cli|containerd|podman|golang)\b/);
  for (const tool of ['mongo', 'mongoexport']) {
    const src = fs.readFileSync(path.join(ROOT, 'releases/ucs-migration/tools', tool), 'utf8');
    assert.match(src, /exec node "\$\(dirname -- "\$0"\)\/\.\.\/docker-exec\.mjs" wekan-db /);
    assert.doesNotMatch(src, /\bdocker exec\b/);
    assert.ok(fs.statSync(path.join(ROOT, 'releases/ucs-migration/tools', tool)).mode & 0o111, `${tool} is executable`);
  }
  const start = fs.readFileSync(path.join(ROOT, 'releases/ucs-migration/start.sh'), 'utf8');
  assert.doesNotMatch(start, /docker --version/, 'the --check must not need a Docker CLI');
  assert.match(start, /docker-exec\.mjs; do node --check/);
  // Nothing else in the migration calls a docker binary either.
  for (const f of ['run.mjs', 'importer.mjs', 'verify.mjs', 'start.sh']) {
    const src = fs.readFileSync(path.join(ROOT, 'releases/ucs-migration', f), 'utf8');
    assert.doesNotMatch(src, /spawn(Sync)?\(\s*['"]docker['"]|exec docker |^\s*docker /m, f);
  }
});
