'use strict';

// The grain's app port is handed from the please-wait bridge to WeKan at the
// moment Meteor BINDS it, not before main.js loads.
//
// Meteor 3 awaits every Meteor.startup hook before webapp calls
// httpServer.listen. start.js used to kill the bridge and then require
// main.js, so for the whole of WeKan's startup nothing answered on the port:
// sandstorm-http-bridge got connection-refused and the browser showed an empty
// response (NS_ERROR_NET_EMPTY_RESPONSE), for good when a startup hook never
// finished.
//
// This runs the real migration-bridge.js and the real yieldPortOnListen() from
// start.js on a free port, with a stand-in for Meteor that "starts up" for a
// while before listening. The waiting page answers throughout startup; its
// held readiness request survives the brief close/rebind handoff and completes
// only after the app listens. A new connection during that handoff can fail.
//
// Run: node tests/sandstormPortHandoff.test.cjs

const assert = require('assert');
const fs = require('fs');
const http = require('http');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const START = fs.readFileSync(path.join(ROOT, 'sandstorm-src/start.js'), 'utf8');
// The extracted handoff uses the same diagnostic callback as the real launcher.
const marks = [];
const markStartup = event => marks.push(event);

let passed = 0;
async function test(name, fn) { await fn(); passed += 1; console.log('  ok -', name); }
const wait = ms => new Promise(r => setTimeout(r, ms));

function extract(name) {
  const i = START.indexOf(`function ${name}(`);
  assert.ok(i > 0, `start.js has ${name}()`);
  const end = START.indexOf('\n}\n', i);
  return START.slice(i, end + 2);
}

function freePort() {
  return new Promise((resolve) => {
    const s = net.createServer().listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

function get(port) {
  return new Promise((resolve) => {
    const req = http.get({ host: '127.0.0.1', port, path: '/', agent: false }, (res) => {
      res.resume();
      res.on('end', () => resolve(res.statusCode));
    });
    req.on('error', e => resolve(e.code || 'error'));
    req.setTimeout(2000, () => { req.destroy(); resolve('timeout'); });
  });
}

(async () => {
  console.log('sandstormPortHandoff:');

  await test('the port answers throughout startup and held readiness survives handoff', async () => {
    const APP_PORT = String(await freePort());
    const child = spawn(process.execPath, [path.join(ROOT, 'sandstorm-src/migration-bridge.js')],
      { env: { ...process.env, PORT: APP_PORT }, stdio: ['ignore', 'ignore', 'ignore', 'ipc'] });
    try {
      for (let i = 0; i < 100 && (await get(APP_PORT)) !== 503; i++) await wait(50);
      assert.strictEqual(await get(APP_PORT), 503, 'the please-wait page is up');

      let bridge = child; // eslint-disable-line prefer-const
      // eslint-disable-next-line no-new-func
      const yieldPortOnListen = new Function('net', 'APP_PORT', 'getBridge', 'setBridge', 'markStartup', `
        ${extract('yieldPortOnListen').replace(/\bbridge = null;/, 'setBridge(null);')
          .replace(/const child = bridge;/, 'const child = getBridge();')}
        return yieldPortOnListen;`)(net, APP_PORT, () => bridge, (b) => { bridge = b; }, markStartup);
      const realListen = net.Server.prototype.listen;
      yieldPortOnListen();

      // "Meteor": a server created at load, bound only after its startup hooks.
      const app = http.createServer((req, res) => { res.writeHead(200); res.end('wekan'); });
      let notified = false;
      const ready = new Promise((resolve, reject) => {
        const request = http.get({ host: '127.0.0.1', port: APP_PORT,
          path: '/.sandstorm-startup-ready', agent: false }, response => {
          notified = true;
          assert.ok(app.listening, 'browser notified only AFTER the app is listening');
          response.resume();
          response.on('end', () => resolve(response.statusCode));
        });
        request.on('error', reject);
      });
      const seen = [];
      let polling = true;
      const poller = (async () => {
        while (polling) { seen.push(await get(APP_PORT)); await wait(25); }
      })();
      await wait(800);                                   // startup hooks running
      assert.equal(notified, false, 'readiness request stays open throughout startup');
      // Finish startup probes before initiating the close/rebind handoff.
      // New connections in that tiny interval are not guaranteed: the browser
      // uses the existing held request, which we keep checking across it.
      polling = false;
      await poller;
      assert.ok(seen.length > 5 && seen.every(s => s === 503),
        `please-wait answered throughout startup: ${seen.join(',')}`);
      const bound = new Promise(r => app.listen({ port: Number(APP_PORT), host: '127.0.0.1' }, r));
      await bound;
      assert.equal(await ready, 204, 'held request is released at HTTP readiness');
      assert.strictEqual(await get(APP_PORT), 200, 'and WeKan answers afterwards');
      for (let i = 0; i < 100 && child.exitCode === null && child.signalCode === null; i++) await wait(10);
      app.close();

      assert.strictEqual(net.Server.prototype.listen, realListen, 'listen is restored after the first bind');
      assert.ok(child.exitCode !== null || child.signalCode !== null, 'the bridge process is gone');
      assert.deepStrictEqual(marks.splice(0), ['meteor-listen-requested', 'meteor-listening']);
    } finally {
      try { child.kill('SIGKILL'); } catch (_) {}
    }
  });

  await test('an old bridge exit cannot discard its replacement after blocking migration', async () => {
    const APP_PORT = String(await freePort());
    const children = [];
    const realListen = net.Server.prototype.listen;
    const bridgePath = path.join(ROOT, 'sandstorm-src/migration-bridge.js');
    // start.js blocks the event loop in spawnSync/Atomics.wait during migration.
    // The first bridge exits in that interval, but its JS exit callback runs only
    // AFTER startBridge has installed the replacement for Meteor startup.
    const lifecycle = new Function('fs', 'BRIDGE', 'NODE', 'APP_PORT', 'spawn',
      'cpuExec', 'process', 'sleep', 'net', 'markStartup', `
        let bridge = null;
        ${extract('startBridge')}
        ${extract('stopBridge')}
        ${extract('yieldPortOnListen')}
        return { startBridge, stopBridge, yieldPortOnListen, current: () => bridge };
      `)(fs, bridgePath, process.execPath, APP_PORT, (...args) => {
        const child = spawn(...args);
        children.push(child);
        return child;
      }, (command, args) => [command, args], process,
      seconds => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, seconds * 1000), net, markStartup);
    const app = http.createServer((req, res) => res.end('wekan'));
    try {
      lifecycle.startBridge();
      for (let i = 0; i < 100 && (await get(APP_PORT)) !== 503; i++) await wait(50);
      assert.strictEqual(await get(APP_PORT), 503);
      const old = lifecycle.current();
      const exited = new Promise(resolve => old.once('exit', resolve));
      lifecycle.stopBridge(); // blocks: old's exit callback is queued
      lifecycle.startBridge('Starting WeKan');
      const replacement = lifecycle.current();
      assert.notStrictEqual(replacement, old);
      await exited; // deliver the old callback AFTER replacement was assigned
      assert.strictEqual(lifecycle.current(), replacement,
        'the old exit callback must not clear the new bridge');
      for (let i = 0; i < 100 && (await get(APP_PORT)) !== 503; i++) await wait(50);
      assert.strictEqual(await get(APP_PORT), 503, 'replacement owns the app port');
      lifecycle.yieldPortOnListen();
      await new Promise((resolve, reject) => {
        app.once('error', reject);
        app.listen({ port: Number(APP_PORT), host: '0.0.0.0' }, resolve);
      });
      assert.strictEqual(await get(APP_PORT), 200, 'WeKan takes the port without EADDRINUSE');
      for (let i = 0; i < 100 && replacement.exitCode === null && replacement.signalCode === null; i++) await wait(10);
      assert.ok(replacement.exitCode !== null || replacement.signalCode !== null,
        'replacement exits after releasing the port and notifying waiting clients');
    } finally {
      net.Server.prototype.listen = realListen;
      app.close();
      for (const child of children) {
        if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
      }
    }
  });

  await test('another port is bound straight away, untouched', async () => {
    const APP_PORT = String(await freePort());
    const other = await freePort();
    let bridge = null; // eslint-disable-line prefer-const
    // eslint-disable-next-line no-new-func
    const yieldPortOnListen = new Function('net', 'APP_PORT', 'getBridge', 'setBridge', 'markStartup', `
      ${extract('yieldPortOnListen').replace(/\bbridge = null;/, 'setBridge(null);')
        .replace(/const child = bridge;/, 'const child = getBridge();')}
      return yieldPortOnListen;`)(net, APP_PORT, () => bridge, (b) => { bridge = b; }, markStartup);
    const realListen = net.Server.prototype.listen;
    yieldPortOnListen();
    const s = http.createServer((q, r) => r.end());
    await new Promise(r => s.listen(other, '127.0.0.1', r));
    assert.notStrictEqual(net.Server.prototype.listen, realListen, 'still waiting for APP_PORT');
    s.close();
    // With no bridge running, APP_PORT binds at once.
    const a = http.createServer((q, r) => { r.writeHead(200); r.end(); });
    await new Promise(r => a.listen(Number(APP_PORT), '127.0.0.1', r));
    assert.strictEqual(await get(APP_PORT), 200);
    assert.strictEqual(net.Server.prototype.listen, realListen);
    a.close();
  });

  await test('the bridge is no longer killed before main.js loads (negative)', async () => {
    const run = START.slice(START.indexOf('function runApp()'));
    const body = run.slice(0, run.indexOf("require('./main.js')"));
    assert.ok(!/stopBridge\(\)/.test(body),
      'runApp must not release the port before Meteor binds it');
    assert.ok(/yieldPortOnListen\(\);\s*\n\s*require\('\.\/main\.js'\)/.test(run),
      'it arms the listen-time handoff right before loading WeKan');
  });

  console.log(`\n${passed} tests passed`);
})().catch((e) => { console.error(e); process.exit(1); });
