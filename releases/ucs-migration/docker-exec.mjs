#!/usr/bin/env node
// `docker exec <container> <cmd> [args...]` without the Docker CLI.
//
// The UCS migration worker only ever runs `mongo` and `mongoexport` inside the
// old database container, through the Docker socket the preinst mounts. That
// used to need Debian's docker-cli in the WeKan image, which is a Go program:
// its Go 1.24 standard library was the bulk of the image's vulnerability scan,
// and the app never uses it. This speaks the Docker Engine API over the unix
// socket directly instead:
//
//   POST /containers/<name>/exec   create the exec (stdout + stderr, no TTY)
//   POST /exec/<id>/start          upgraded to a raw stream, multiplexed in
//                                  frames of [type, 0, 0, 0, size(uint32 BE)]
//                                  where type 1 is stdout and 2 is stderr
//   GET  /exec/<id>/json           the command's ExitCode
//
// Exit status follows the Docker CLI: the command's own, or 125 when Docker
// itself refused (no socket, no such container, bad response).
//
// Usage: node docker-exec.mjs <container> <command> [args...]
// DOCKER_HOST=unix:///path overrides the default /var/run/docker.sock.

import http from 'node:http';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

export function socketPath(env = process.env) {
  const host = env.DOCKER_HOST || '';
  if (!host) return '/var/run/docker.sock';
  if (host.startsWith('unix://')) return host.slice('unix://'.length);
  throw new Error(`only a unix:// DOCKER_HOST is supported, not ${host}`);
}

function requestJson(sock, method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const req = http.request({
      socketPath: sock, method, path,
      headers: payload === undefined ? {} : {
        'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try { json = text ? JSON.parse(text) : null; } catch (e) { /* reported below */ }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`${method} ${path}: HTTP ${res.statusCode} ${json?.message || text}`.trim()));
        } else if (json === null && text) {
          reject(new Error(`${method} ${path}: response is not JSON`));
        } else resolve(json);
      });
    });
    req.on('error', reject);
    if (payload !== undefined) req.write(payload);
    req.end();
  });
}

// Splits the multiplexed stream into stdout/stderr. A frame header or payload
// may arrive split across any number of socket reads.
export function createDemuxer(onStdout, onStderr) {
  let pending = Buffer.alloc(0);
  return (chunk) => {
    pending = pending.length ? Buffer.concat([pending, chunk]) : chunk;
    while (pending.length >= 8) {
      const size = pending.readUInt32BE(4);
      if (pending.length < 8 + size) break;
      const type = pending[0];
      const payload = pending.subarray(8, 8 + size);
      if (type === 2) onStderr(payload); else if (type === 1) onStdout(payload);
      pending = pending.subarray(8 + size);
    }
  };
}

// Starts the exec and streams its output. Uses a raw socket because the
// response is an HTTP upgrade (101) whose body is the frame stream itself.
function startExec(sock, id, out, err) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ Detach: false, Tty: false });
    const conn = net.connect(sock);
    let head = Buffer.alloc(0);
    let demux = null;
    conn.on('connect', () => {
      conn.write(`POST /exec/${encodeURIComponent(id)}/start HTTP/1.1\r\nHost: docker\r\n` +
        'Content-Type: application/json\r\nConnection: Upgrade\r\nUpgrade: tcp\r\n' +
        `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);
    });
    conn.on('data', (chunk) => {
      if (demux) return demux(chunk);
      head = Buffer.concat([head, chunk]);
      const end = head.indexOf('\r\n\r\n');
      if (end < 0) return undefined;
      const status = Number(/^HTTP\/1\.[01] (\d{3})/.exec(head.toString('latin1'))?.[1]);
      if (status !== 101 && status !== 200) {
        conn.destroy();
        return reject(new Error(`exec start: HTTP ${status || '?'} ${head.subarray(end + 4).toString('utf8').trim()}`));
      }
      demux = createDemuxer(out, err);
      const rest = head.subarray(end + 4);
      if (rest.length) demux(rest);
      return undefined;
    });
    conn.on('end', () => (demux ? resolve() : reject(new Error('exec start: connection closed before a response'))));
    conn.on('error', reject);
  });
}

export async function dockerExec(container, cmd, {
  sock = socketPath(), stdout = process.stdout, stderr = process.stderr,
} = {}) {
  const created = await requestJson(sock, 'POST', `/containers/${encodeURIComponent(container)}/exec`, {
    AttachStdin: false, AttachStdout: true, AttachStderr: true, Tty: false, Cmd: cmd,
  });
  if (!created || typeof created.Id !== 'string') throw new Error('exec create: no exec ID in the response');
  await startExec(sock, created.Id, (b) => stdout.write(b), (b) => stderr.write(b));
  const inspected = await requestJson(sock, 'GET', `/exec/${encodeURIComponent(created.Id)}/json`);
  const code = inspected?.ExitCode;
  if (!Number.isInteger(code)) throw new Error('exec inspect: no exit code');
  return code;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [container, ...cmd] = process.argv.slice(2);
  if (!container || !cmd.length) {
    process.stderr.write('usage: docker-exec.mjs <container> <command> [args...]\n');
    process.exit(125);
  }
  dockerExec(container, cmd).then((code) => {
    // Let piped stdout drain before exiting with the command's status.
    process.exitCode = code;
  }, (e) => {
    process.stderr.write(`docker-exec: ${e.message}\n`);
    process.exitCode = 125;
  });
}
