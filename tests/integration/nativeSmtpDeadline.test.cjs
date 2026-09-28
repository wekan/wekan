'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const http = require('node:http');
const path = require('node:path');
const { installNativeSmtpDeadline } = require('../../server/lib/nativeSmtpDeadline');
const enabled = process.env.WEKAN_SMTP_TEST === '1';
const nodemailer = enabled && require(process.env.WEKAN_NODEMAILER_PATH || path.resolve(
  '.meteor/local/build/programs/server/npm/node_modules/meteor/email/node_modules/nodemailer'));
const message = { from: 'sender@example.test', to: 'recipient@example.test', text: 'test body' };
const policy = { timeoutMs: 200, timeouts: { connectionTimeout: 2000, greetingTimeout: 2000, socketTimeout: 2000 } };
if (enabled) installNativeSmtpDeadline(nodemailer, policy);
async function fixture(t, handler) {
  const sockets = new Set();
  const server = net.createServer(socket => {
    sockets.add(socket); socket.on('error', () => {});
    socket.on('close', () => sockets.delete(socket)); handler(socket);
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  t.after(async () => { for (const socket of sockets) socket.destroy(); await new Promise(resolve => server.close(resolve)); });
  return `smtp://127.0.0.1:${server.address().port}/?wekanTotalTimeout=200`;
}
function accept(socket, bodies) {
  socket.write('220 localhost\r\n');
  let buffer = '', data = null;
  socket.on('data', chunk => {
    buffer += chunk;
    let end;
    while ((end = buffer.indexOf('\r\n')) !== -1) {
      const line = buffer.slice(0, end); buffer = buffer.slice(end + 2);
      if (data !== null) {
        if (line === '.') { bodies.push(data.join('\n')); data = null; socket.write('250 accepted\r\n'); }
        else data.push(line);
      } else if (line === 'DATA') { data = []; socket.write('354 body\r\n'); }
      else if (line === 'STARTTLS') socket.write('454 TLS unavailable\r\n');
      else socket.write('250 OK\r\n');
    }
  });
}
for (const pool of [true, false]) test(`native pool=${pool} preserves compile/stream plugins and defaults`,
  { skip: !enabled, timeout: 5000 }, async t => {
    const bodies = [], url = await fixture(t, socket => accept(socket, bodies));
    const mailer = nodemailer.createTransport(`${url}&pool=${pool}`, { subject: 'default subject' });
    let compiled = 0, streamed = 0;
    mailer.use('compile', (mail, next) => { compiled++; mail.data.text += ' compiled'; setImmediate(next); });
    mailer.use('stream', (mail, next) => { streamed++; mail.message.addHeader('X-Test-Plugin', 'retained'); next(); });
    const result = await mailer.sendMail(message);
    assert.deepEqual(result.accepted, ['recipient@example.test']);
    assert.equal(compiled, 1); assert.equal(streamed, 1);
    assert.match(bodies[0], /Subject: default subject/);
    assert.match(bodies[0], /X-Test-Plugin: retained/);
    assert.match(bodies[0], /test body compiled/);
  });
test('native callback sends cancel their own socket without affecting a concurrent send',
  { skip: !enabled, timeout: 5000 }, async t => {
    let connections = 0, closed = 0;
    const url = await fixture(t, socket => {
      socket.on('close', () => closed++);
      if (++connections === 1) {
        const timer = setInterval(() => socket.write('220-still waiting\r\n'), 5);
        socket.on('close', () => clearInterval(timer));
      } else accept(socket, []);
    });
    const mailer = nodemailer.createTransport(url);
    let callbacks = 0;
    const failure = new Promise(resolve => {
      assert.equal(mailer.sendMail(message, error => { callbacks++; resolve(error); }), undefined);
    });
    while (!connections) await new Promise(resolve => setTimeout(resolve, 5));
    const success = await mailer.sendMail(message);
    assert.deepEqual(success.accepted, ['recipient@example.test']);
    assert.equal((await failure).code, 'OUTBOUND_DEADLINE_EXCEEDED');
    while (closed < 2) await new Promise(resolve => setTimeout(resolve, 5));
    assert.equal(callbacks, 1);
  });
test('late plugins cannot dial after expiration; reinstalls and unrelated transports are safe',
  { skip: !enabled, timeout: 5000 }, async t => {
    let connections = 0, resume;
    const url = await fixture(t, () => connections++);
    const factory = nodemailer.createTransport;
    installNativeSmtpDeadline(nodemailer, policy);
    assert.equal(nodemailer.createTransport, factory);
    const mailer = nodemailer.createTransport(url);
    mailer.use('compile', (mail, next) => { resume = next; });
    await assert.rejects(mailer.sendMail(message), { code: 'OUTBOUND_DEADLINE_EXCEEDED' });
    resume(); await new Promise(resolve => setTimeout(resolve, 80));
    assert.equal(connections, 0);
    const result = await nodemailer.createTransport({ jsonTransport: true }).sendMail(message);
    assert.match(result.message, /test body/);
    const service = nodemailer.createTransport({ service: 'Gmail' });
    service.use('compile', () => {}); // no DNS/network: prove native provider selection has a budget
    await assert.rejects(service.sendMail(message), { code: 'OUTBOUND_DEADLINE_EXCEEDED' });
  });
for (const mode of ['handshake', 'tunnel', 'delivery']) test(`HTTP proxy ${mode} has bounded delivery and socket cleanup`,
  { skip: !enabled, timeout: 5000 }, async t => {
    let disconnected, requestHeaders;
    const bodies = [];
    const closed = new Promise(resolve => { disconnected = resolve; });
    const sockets = new Set();
    const proxy = http.createServer();
    proxy.on('connect', (request, socket) => {
      requestHeaders = request.headers;
      sockets.add(socket); socket.on('error', () => {});
      // CONNECT hands HTTP's half-open socket to the proxy implementation.
      // Finish the server half after observing the client's FIN.
      socket.on('end', () => socket.end());
      let timer;
      socket.on('close', () => { clearInterval(timer); sockets.delete(socket); disconnected(); });
      if (mode !== 'handshake') {
        socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
        if (mode === 'delivery') accept(socket, bodies);
        else timer = setInterval(() => socket.write('220-still waiting\r\n'), 5);
      }
      socket.resume();
    });
    await new Promise(resolve => proxy.listen(0, '127.0.0.1', resolve));
    t.after(async () => { for (const socket of sockets) socket.destroy(); await new Promise(resolve => proxy.close(resolve)); });
    const proxyUrl = `http://proxyuser:p%40ss@127.0.0.1:${proxy.address().port}`;
    const url = `smtp://smtp.invalid:25/?wekanTotalTimeout=200&proxy=${encodeURIComponent(proxyUrl)}`;
    const sending = nodemailer.createTransport(url).sendMail(message);
    if (mode === 'delivery') {
      assert.deepEqual((await sending).accepted, ['recipient@example.test']);
      assert.equal(bodies.length, 1);
    } else await assert.rejects(sending, { code: 'OUTBOUND_DEADLINE_EXCEEDED' });
    await closed;
    assert.equal(requestHeaders['proxy-authorization'], `Basic ${Buffer.from('proxyuser:p@ss').toString('base64')}`);
    assert.equal(requestHeaders.authorization, undefined);
  });

test('native requireTLS never sends plaintext mail when STARTTLS is refused',
  { skip: !enabled, timeout: 5000 }, async t => {
    const bodies = [], url = await fixture(t, socket => accept(socket, bodies));
    await assert.rejects(nodemailer.createTransport(`${url}&requireTLS=true`).sendMail(message), { code: 'ETLS' });
    assert.equal(bodies.length, 0);
  });
