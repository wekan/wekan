'use strict';

// Optional HTTPS in WeKan's own server (#916): off without HTTPS_PORT; with
// it, a TLS listener hands each decrypted connection to the existing HTTP
// server, so pages AND websocket upgrades (DDP) are served over TLS; a renewed
// certificate is used without a restart; and plain HTTP can be redirected.
// Run: node tests/httpsServer.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');
const path = require('node:path');
const tls = require('node:tls');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const { httpsConfig, redirectLocation } = require('../models/lib/httpsConfig');
const { startHttpsBridge } = require('../server/lib/httpsBridge');
const HAS_OPENSSL = spawnSync('openssl', ['version']).status === 0;

function selfSigned(dir, cn) {
  const cert = path.join(dir, `${cn}.crt`);
  const key = path.join(dir, `${cn}.key`);
  const r = spawnSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-subj', `/CN=${cn}`,
    '-addext', `subjectAltName=DNS:${cn},IP:127.0.0.1`, '-keyout', key, '-out', cert], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return { cert, key };
}

test('settings: off without HTTPS_PORT; a port needs a certificate and a key (negative)', () => {
  assert.equal(httpsConfig({}), null);
  assert.equal(httpsConfig({ HTTPS_CERT_FILE: '/x', HTTPS_KEY_FILE: '/y' }), null, 'files alone change nothing');
  assert.throws(() => httpsConfig({ HTTPS_PORT: '8443' }), /HTTPS_CERT_FILE and HTTPS_KEY_FILE/);
  assert.throws(() => httpsConfig({ HTTPS_PORT: 'https', HTTPS_CERT_FILE: 'a', HTTPS_KEY_FILE: 'b' }), /must be a port/);
  const read = p => `content of ${p}`;
  const c = httpsConfig({ HTTPS_PORT: '8443', HTTPS_CERT_FILE: '/etc/c.pem', HTTPS_KEY_FILE: '-----BEGIN PRIVATE KEY-----\nx', BIND_IP: '10.0.0.1', HTTPS_REDIRECT: 'true' }, read);
  assert.deepEqual([c.port, c.host, c.cert, c.certPath, c.keyPath, c.redirect], [8443, '10.0.0.1', 'content of /etc/c.pem', '/etc/c.pem', null, true]);
});

test('the redirect keeps only the path, and names a host the browser asked for or ROOT_URL', () => {
  assert.equal(redirectLocation('wekan.example.com:8080', '/b/x?y=1', 8443), 'https://wekan.example.com:8443/b/x?y=1');
  assert.equal(redirectLocation('wekan.example.com', '/', 443), 'https://wekan.example.com/');
  assert.equal(redirectLocation('anything', '/p', 8443, 'https://boards.example.com'), 'https://boards.example.com/p');
  // Negative: no injected host, and no scheme-relative path to another site.
  assert.equal(redirectLocation('evil.com/@x', '/', 8443), null);
  assert.equal(redirectLocation('wekan.example.com', '//evil.com/', 8443), 'https://wekan.example.com:8443/');
});

test('pages and websocket upgrades over TLS, through the existing HTTP server; a renewed certificate without a restart', { skip: !HAS_OPENSSL && 'needs openssl' }, async () => {
  const dir = fs.mkdtempSync(path.join(ROOT, '.tools', 'tmp', 'https-'));
  const first = selfSigned(dir, 'first.example');
  // The page is named by comparison, never by echoing req.url back: a
  // response that reflects the request is the reflected-XSS shape (CodeQL
  // #583), even in a test (tests/noReflectedRequest.test.cjs).
  const app = http.createServer((req, res) => {
    const page = req.url === '/hello' ? '/hello' : 'another page';
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(`served ${page} encrypted=${!!req.socket.encrypted}`);
  });
  let upgraded = false;
  app.on('upgrade', (req, socket) => { upgraded = true; socket.end('HTTP/1.1 101 Switching Protocols\r\n\r\n'); });
  const env = { HTTPS_PORT: '1', HTTPS_CERT_FILE: first.cert, HTTPS_KEY_FILE: first.key };
  const config = httpsConfig(env);
  const { server, close } = startHttpsBridge(app, config, { readConfig: () => httpsConfig(env), log: { log() {}, error() {} } });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const get = (ca, servername = 'first.example') => new Promise((resolve, reject) => {
    https.get({ host: '127.0.0.1', port, path: '/hello', ca, servername }, res => {
      let body = '';
      res.on('data', d => { body += d; });
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
  try {
    assert.equal(await get(fs.readFileSync(first.cert)), 'served /hello encrypted=true');
    // Negative: without trusting the certificate, the client refuses it.
    await assert.rejects(get(undefined), /self[- ]signed|unable to verify/i);
    // A websocket upgrade (what DDP does) reaches the server's upgrade handler.
    await new Promise((resolve, reject) => {
      const socket = tls.connect({ host: '127.0.0.1', port, ca: fs.readFileSync(first.cert), servername: 'first.example' }, () => {
        socket.write('GET /sockjs/websocket HTTP/1.1\r\nHost: x\r\nConnection: Upgrade\r\nUpgrade: websocket\r\n\r\n');
      });
      socket.on('data', d => { if (String(d).startsWith('HTTP/1.1 101')) { socket.end(); resolve(); } });
      socket.on('error', reject);
    });
    assert.equal(upgraded, true);
    // A renewal is used without a restart (setSecureContext, as the file watch does).
    const second = selfSigned(dir, 'second.example');
    server.setSecureContext({ cert: fs.readFileSync(second.cert), key: fs.readFileSync(second.key) });
    assert.equal(await get(fs.readFileSync(second.cert), 'second.example'), 'served /hello encrypted=true', 'the new certificate is the one served');
  } finally {
    close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('WeKan starts the bridge on Meteor\'s own server, only when configured', () => {
  const src = fs.readFileSync(path.join(ROOT, 'server/httpsServer.js'), 'utf8');
  assert.match(src, /startHttpsBridge\(WebApp\.httpServer, config,/);
  assert.match(src, /if \(config\) \{/);
  assert.match(fs.readFileSync(path.join(ROOT, 'server/imports.js'), 'utf8'), /import '\/server\/httpsServer';/);
});
