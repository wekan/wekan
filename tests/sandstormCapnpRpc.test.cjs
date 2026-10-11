'use strict';

// WeKan on Sandstorm sends activity events and redeems Powerbox identity
// requests over Cap'n Proto RPC on sandstorm-http-bridge's /tmp/sandstorm-api
// socket. That used to need node-capnp (capnp.node), a native addon built for
// Node 14 that cannot load on Node 26, so both features were off. It is now
// done in plain JavaScript with @wekanteam/capnp-es, the fork in
// npm-packages/capnp-es, and imports/sandstorm/bridgeClient.mjs.
//
// Upstream capnp-es 0.0.16 dropped Resolve, Release and Disembargo, never
// released an import, answered tail calls with nothing, and lost messages
// that arrived together - each of which the C++ bridge exercises. This suite
// pins the fork's behaviour three ways:
//
//   A. A hand-built peer sends each RPC message to a Conn and checks exactly
//      what comes back. Pure JavaScript; always runs.
//   B. The real thing: the reference C++ RPC implementation and Sandstorm's
//      own schemas (tests/fixtures/capnp-rpc/mock-bridge.c++), driven through
//      bridgeClient.mjs. Runs when .tools/ holds the toolchain that
//      releases/sandstorm-capnp-schemas.sh --mock builds, and says so when
//      it does not.
//   C. The wiring: sandstorm.js uses the new client, nothing loads capnp.node,
//      the .spk no longer ships it.
//
// Run: node tests/sandstormCapnpRpc.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let passed = 0;
async function test(name, fn) {
  await fn();
  passed += 1;
  console.log('  ok -', name);
}

async function main() {
  console.log('sandstormCapnpRpc:');
  const capnp = await import('@wekanteam/capnp-es');
  const rpc = await import('@wekanteam/capnp-es/capnp/rpc');
  const fixture = await import(path.join(ROOT, 'tests/fixtures/capnp-rpc/rpc-fixture.mjs'));
  const client = await import(path.join(ROOT, 'imports/sandstorm/bridgeClient.mjs'));
  const { Conn, DeferredTransport, Message, utils } = capnp;
  const { Fixture, Counter$Server, Fixture_ServerCounterLater$Results, Fixture_EchoLater$Results,
    Counter_Next$Results } = fixture;

  // ── A. hand-built peer ──────────────────────────────────────────────────────

  class PeerTransport extends DeferredTransport {
    constructor() { super(); this.sent = []; }
    sendMessage(m) {
      // Round-trip through bytes, exactly as a socket would.
      this.sent.push(new Message(m.segment.message.toArrayBuffer(), false).getRoot(rpc.Message));
    }
    take(which) {
      const i = this.sent.findIndex((m) => m.which() === which);
      return i < 0 ? null : this.sent.splice(i, 1)[0];
    }
    all(which) { return this.sent.filter((m) => m.which() === which); }
  }
  function frame(build) {
    const msg = new Message();
    build(msg.initRoot(rpc.Message));
    return msg.toArrayBuffer();
  }
  const tick = () => sleep(5);
  // A peer that will resolve a promise to a capability we passed it keeps that
  // capability: releaseParamCaps defaults to true and would release it.
  const keepParams = (ret) => { ret.releaseParamCaps = false; };

  // Start a Conn whose bootstrap answer is an import with id 3.
  async function connected() {
    const t = new PeerTransport();
    const conn = new Conn(t);
    const fx = conn.bootstrap(Fixture);
    t.resolve(frame((m) => {
      const ret = m._initReturn();
      ret.answerId = t.take(rpc.Message.BOOTSTRAP).bootstrap.questionId;
      const p = ret._initResults();
      p._initCapTable(1).get(0).senderHosted = 3;
      utils.setInterfacePointer(0, utils.getPointer(0, p));
    }));
    await tick();
    t.sent.length = 0;   // the Finish for the bootstrap
    return { t, conn, fx };
  }
  // Answer the newest Call with a results struct whose pointer 0 is a cap.
  function returnCap(t, ResultsClass, setDescriptor, extra = () => {}) {
    const call = t.take(rpc.Message.CALL).call;
    t.resolve(frame((m) => {
      const ret = m._initReturn();
      ret.answerId = call.questionId;
      extra(ret);
      const p = ret._initResults();
      setDescriptor(p._initCapTable(1).get(0));
      const res = utils.initStructAt(0, ResultsClass, p);
      utils.setInterfacePointer(0, utils.getPointer(0, res));
    }));
    return call;
  }
  function returnN(t, n) {
    const call = t.take(rpc.Message.CALL).call;
    t.resolve(frame((m) => {
      const ret = m._initReturn();
      ret.answerId = call.questionId;
      utils.initStructAt(0, Counter_Next$Results, ret._initResults()).n = n;
    }));
    return call;
  }

  await test('a transport keeps every message that arrives before it is read', async () => {
    const t = new DeferredTransport();
    t.resolve(frame((m) => { m._initFinish().questionId = 1; }));
    t.resolve(frame((m) => { m._initFinish().questionId = 2; }));
    assert.strictEqual((await t.recvMessage()).finish.questionId, 1);
    assert.strictEqual((await t.recvMessage()).finish.questionId, 2,
      'upstream replaced the first message with the second');
  });

  await test('Release: an import is released once, with every reference the peer sent', async () => {
    const { t, fx } = await connected();
    const first = fx.serverCounterLater(() => {});
    returnCap(t, Fixture_ServerCounterLater$Results, (d) => { d.senderHosted = 9; });
    const a = (await first.promise()).cap;
    const second = fx.serverCounterLater(() => {});
    returnCap(t, Fixture_ServerCounterLater$Results, (d) => { d.senderHosted = 9; });
    const b = (await second.promise()).cap;
    await tick();
    t.sent.length = 0;
    a.client.close();
    await tick();
    assert.deepStrictEqual(t.all(rpc.Message.RELEASE), [], 'released while still held');
    b.client.close();
    await tick();
    const rel = t.all(rpc.Message.RELEASE);
    assert.strictEqual(rel.length, 1);
    assert.strictEqual(rel[0].release.id, 9);
    assert.strictEqual(rel[0].release.referenceCount, 2);
  });

  await test('Resolve to a peer capability redirects calls there, with no embargo', async () => {
    const { t, fx } = await connected();
    const got = fx.serverCounterLater(() => {});
    returnCap(t, Fixture_ServerCounterLater$Results, (d) => { d.senderPromise = 9; });
    const counter = (await got.promise()).cap;
    const before = counter.next(() => {});
    assert.strictEqual(t.sent.at(-1).call.target.importedCap, 9, 'calls go to the promise first');
    returnN(t, 1);
    assert.strictEqual((await before.promise()).n, 1);
    t.resolve(frame((m) => {
      const r = m._initResolve();
      r.promiseId = 9;
      r._initCap().senderHosted = 11;
    }));
    await tick();
    t.sent.length = 0;
    const after = counter.next(() => {});
    assert.strictEqual(t.all(rpc.Message.DISEMBARGO).length, 0);
    assert.strictEqual(t.sent.at(-1).call.target.importedCap, 11, 'and to the resolution after');
    returnN(t, 2);
    assert.strictEqual((await after.promise()).n, 2);
    counter.client.close();
    await tick();
    const released = t.all(rpc.Message.RELEASE).map((m) => [m.release.id, m.release.referenceCount]);
    assert.deepStrictEqual(released.sort(), [[11, 1], [9, 1]], 'promise and resolution both released');
  });

  await test('Resolve back to our own capability holds new calls until the Disembargo returns', async () => {
    const { t, fx } = await connected();
    let delivered = 0;
    const mine = new Counter$Server({ async next(_p, r) { r.n = ++delivered; } }).client();
    const got = fx.echoLater((p) => { p.cap = mine; });
    const exportId = t.sent.at(-1).call.params.capTable.get(0).senderHosted;
    returnCap(t, Fixture_EchoLater$Results, (d) => { d.senderPromise = 9; }, keepParams);
    const echoed = (await got.promise()).cap;
    echoed.next(() => {});                         // through the promise: needs the embargo
    t.sent.length = 0;
    t.resolve(frame((m) => {
      const r = m._initResolve();
      r.promiseId = 9;
      r._initCap().receiverHosted = exportId;
    }));
    await tick();
    const dis = t.take(rpc.Message.DISEMBARGO);
    assert.ok(dis, 'a Disembargo is sent');
    assert.strictEqual(dis.disembargo.context.which(), rpc.Disembargo_Context_Which.SENDER_LOOPBACK);
    assert.strictEqual(dis.disembargo.target.importedCap, 9, 'aimed at the promise');
    const held = echoed.next(() => {});
    await tick();
    assert.strictEqual(delivered, 0, 'a call made during the embargo is held');
    t.resolve(frame((m) => {
      const d = m._initDisembargo();
      d._initTarget().importedCap = exportId;
      d._initContext().receiverLoopback = dis.disembargo.context.senderLoopback;
    }));
    assert.strictEqual((await held.promise()).n, 1, 'and delivered locally once it lifts');
  });

  await test('Resolve to an exception fails the calls that follow', async () => {
    const { t, fx } = await connected();
    const got = fx.brokenLater(() => {});
    returnCap(t, Fixture_ServerCounterLater$Results, (d) => { d.senderPromise = 9; });
    const counter = (await got.promise()).cap;
    t.resolve(frame((m) => {
      const r = m._initResolve();
      r.promiseId = 9;
      r._initException().reason = 'broken on purpose';
    }));
    await tick();
    await assert.rejects(counter.next(() => {}).promise(), /broken on purpose/);
  });

  await test('a tail call keeps its results here and takeFromOtherQuestion collects them', async () => {
    const { t, conn, fx } = await connected();
    const mine = new Counter$Server({ async next(_p, r) { r.n = 42; } }).client();
    const got = fx.echoLater((p) => { p.cap = mine; });
    const exportId = t.sent.at(-1).call.params.capTable.get(0).senderHosted;
    returnCap(t, Fixture_EchoLater$Results, (d) => { d.senderPromise = 9; }, keepParams);
    const echoed = (await got.promise()).cap;
    const answer = echoed.next(() => {});
    const ours = t.sent.at(-1).call.questionId;
    // The peer forwards our call straight back to our own counter...
    t.resolve(frame((m) => {
      const c = m._initCall();
      c.questionId = 50;
      c._initTarget().importedCap = exportId;
      c.interfaceId = fixture.Counter$Client.interfaceId;
      c.methodId = 0;
      c._initParams();
      c._initSendResultsTo().yourself = true;
    }));
    await tick();
    const ret = t.take(rpc.Message.RETURN).return;
    assert.strictEqual(ret.answerId, 50);
    assert.strictEqual(ret.which(), rpc.Return.RESULTS_SENT_ELSEWHERE, 'results stay here');
    // ...and answers ours by pointing at that answer.
    t.resolve(frame((m) => {
      const r = m._initReturn();
      r.answerId = ours;
      r.takeFromOtherQuestion = 50;
    }));
    assert.strictEqual((await answer.promise()).n, 42, 'upstream left this pending forever');
    void conn;
  });

  await test('noFinishNeeded suppresses the Finish', async () => {
    const { t, fx } = await connected();
    const got = fx.liveServerCounters(() => {});
    const call = t.take(rpc.Message.CALL).call;
    t.resolve(frame((m) => {
      const r = m._initReturn();
      r.answerId = call.questionId;
      r.noFinishNeeded = true;
      r._initResults();
    }));
    await got.promise();
    await tick();
    assert.deepStrictEqual(t.all(rpc.Message.FINISH), []);
  });

  await test('Unimplemented: an unknown message is echoed, an echoed Call is rejected', async () => {
    const { t, fx } = await connected();
    t.resolve(frame((m) => { m._initJoin(); }));
    await tick();
    const echo = t.take(rpc.Message.UNIMPLEMENTED);
    assert.ok(echo && echo.unimplemented.which() === rpc.Message.JOIN, 'Join is echoed back');
    const got = fx.liveServerCounters(() => {});
    const call = t.take(rpc.Message.CALL);
    t.resolve(frame((m) => { m.unimplemented = call; }));
    await assert.rejects(got.promise(), /does not implement/);
  });

  await test('Release and Finish from the peer free our exports, by their own ids', async () => {
    const { t, conn, fx } = await connected();
    const mine = new Counter$Server({ async next(_p, r) { r.n = 1; } }).client();
    fx.echoLater((p) => { p.cap = mine; });
    const exportId = t.sent.at(-1).call.params.capTable.get(0).senderHosted;
    assert.ok(conn.exports[exportId], 'exported');
    t.resolve(frame((m) => {
      const r = m._initRelease();
      r.id = exportId;
      r.referenceCount = 1;
    }));
    await tick();
    assert.strictEqual(conn.exports[exportId], null, 'Release freed it');

    // Finish(releaseResultCaps) releases what a Return exported - bootstrap here.
    const t2 = new PeerTransport();
    const server = new Conn(t2);
    server.initMain(Fixture, {});
    const mainId = server.exports.findIndex(Boolean);
    t2.resolve(frame((m) => { m._initBootstrap().questionId = 0; }));
    await tick();
    assert.strictEqual(server.exports[mainId].wireRefs, 2, 'bootstrap exported it once more');
    t2.resolve(frame((m) => {
      const f = m._initFinish();
      f.questionId = 0;
      f.releaseResultCaps = true;
    }));
    await tick();
    assert.strictEqual(server.exports[mainId].wireRefs, 1,
      'upstream released export INDEX 0 of an empty list, i.e. nothing');
  });

  await test('Return.releaseParamCaps releases the caps our call exported, not the question id', async () => {
    const { t, conn, fx } = await connected();
    const mine = new Counter$Server({ async next() {} }).client();
    const got = fx.echoLater((p) => { p.cap = mine; });
    const exportId = t.sent.at(-1).call.params.capTable.get(0).senderHosted;
    returnCap(t, Fixture_EchoLater$Results, (d) => { d.senderHosted = 12; },
      (ret) => { ret.releaseParamCaps = true; });
    await got.promise();
    assert.strictEqual(conn.exports[exportId], null);
  });

  // ── B. against the reference C++ implementation ─────────────────────────────

  const mock = path.join(ROOT, '.tools/capnp-rpc/mock-bridge');
  if (!fs.existsSync(mock) && fs.existsSync(path.join(ROOT, '.tools/capnproto/lib/libcapnp-rpc.a'))) {
    spawnSync('bash', [path.join(ROOT, 'releases/sandstorm-capnp-schemas.sh'), '--mock'], { stdio: 'inherit' });
  }
  if (!fs.existsSync(mock)) {
    console.log('  SKIPPED - the C++ interop cases: no .tools/capnp-rpc/mock-bridge.');
    console.log('            Build it with: releases/sandstorm-capnp-schemas.sh --mock');
  } else {
    const dir = fs.mkdtempSync(path.join(process.env.TMPDIR || path.join(ROOT, '.tools/tmp'), 'capnp-rpc-'));
    let peers = 0;
    async function withPeer(mode, fn) {
      const sock = path.join(dir, `${mode}-${++peers}.sock`);
      const proc = spawn(mock, [sock, mode], { stdio: ['ignore', 'pipe', 'inherit'] });
      const events = [];
      let buf = '';
      proc.stdout.on('data', (d) => {
        buf += d;
        let i;
        while ((i = buf.indexOf('\n')) >= 0) { events.push(JSON.parse(buf.slice(0, i))); buf = buf.slice(i + 1); }
      });
      for (let i = 0; i < 100 && !events.some((e) => e.listening); i++) await sleep(20);
      assert.ok(events.some((e) => e.listening), `the C++ peer did not start (${mode})`);
      try {
        await fn(sock, events);
      } finally {
        proc.kill();
      }
    }
    const until = async (cond, ms = 2000) => {
      for (let i = 0; i < ms / 10 && !cond(); i++) await sleep(10);
      return cond();
    };

    try {
      await test('C++: calls made on a promise of our own capability arrive in order', async () => {
        await withPeer('fixture', async (sock) => {
          const conn = new Conn(new client.SocketTransport(require('net').connect(sock)));
          const fx = conn.bootstrap(Fixture);
          let delivered = 0;
          const mine = new Counter$Server({ async next(_p, r) { r.n = ++delivered; } }).client();
          const { cap: echoed } = await fx.echoLater((p) => { p.cap = mine; }).promise();
          const calls = Array.from({ length: 10 }, () => echoed.next(() => {}).promise());
          let disembargoes = 0;
          const send = conn.sendMessage.bind(conn);
          conn.sendMessage = (m) => { if (m.which() === rpc.Message.DISEMBARGO) disembargoes++; send(m); };
          const resolve = conn.handleResolveMessage.bind(conn);
          const resolved = new Promise((res) => {
            conn.handleResolveMessage = (m) => {
              resolve(m);
              for (let i = 0; i < 10; i++) calls.push(echoed.next(() => {}).promise());
              res();
            };
          });
          await resolved;
          const ns = (await Promise.all(calls)).map((x) => x.n);
          assert.deepStrictEqual(ns, Array.from({ length: 20 }, (_, i) => i + 1));
          assert.strictEqual(disembargoes, 1, 'the C++ peer echoed our Disembargo');
          conn.shutdown();
        });
      });

      await test('C++: Resolve to a server capability, then Release destroys it', async () => {
        await withPeer('fixture', async (sock, events) => {
          const conn = new Conn(new client.SocketTransport(require('net').connect(sock)));
          const fx = conn.bootstrap(Fixture);
          const { cap } = await fx.serverCounterLater(() => {}).promise();
          assert.strictEqual((await cap.next(() => {}).promise()).n, 1);
          await sleep(200);   // past the Resolve
          assert.strictEqual((await cap.next(() => {}).promise()).n, 2);
          assert.strictEqual((await fx.liveServerCounters(() => {}).promise()).n, 1);
          client.release(cap);
          assert.ok(await until(() => events.some((e) => e.released === 'counter')),
            'the C++ object is destroyed by our Release, not by the disconnect');
          assert.strictEqual((await fx.liveServerCounters(() => {}).promise()).n, 0);
          conn.shutdown();
        });
      });

      await test('C++: a promise that breaks fails calls before and after its Resolve', async () => {
        await withPeer('fixture', async (sock) => {
          const conn = new Conn(new client.SocketTransport(require('net').connect(sock)));
          const fx = conn.bootstrap(Fixture);
          const { cap } = await fx.brokenLater(() => {}).promise();
          await assert.rejects(cap.next(() => {}).promise(), /broken on purpose/);
          await sleep(200);
          await assert.rejects(cap.next(() => {}).promise(), /broken on purpose/);
          conn.shutdown();
        });
      });

      await test('C++ bridge: an activity event reaches the session with its users', async () => {
        await withPeer('bridge', async (sock, events) => {
          const b = client.createBridge({ socketPath: sock });
          await client.reportActivity(b.bridge, 'sess-1', {
            path: 'b/sandstorm/libreboard/card1', type: 9, caption: 'a comment',
            users: [
              { id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', subscribed: true },
              { id: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', mentioned: true },
              { id: 'cccccccccccccccccccccccccccccccc', mentioned: true },
            ],
          });
          assert.ok(await until(() => events.some((e) => e.activity)));
          assert.deepStrictEqual(events.find((e) => e.activity).activity, {
            session: 'sess-1', path: 'b/sandstorm/libreboard/card1', type: 9, caption: 'a comment',
            users: [
              { name: 'alice', mentioned: false, subscribed: true },
              { name: 'bob', mentioned: true, subscribed: false },
            ],
          }, 'an identity that does not resolve is left out, as before');
          assert.ok(await until(() => events.filter((e) => e.released === 'identity').length === 2 &&
            events.some((e) => e.released === 'context')),
          'the session context and both identities are released after use');
          b.close();
        });
      });

      await test('C++ bridge: a Powerbox identity request is redeemed and saved', async () => {
        await withPeer('bridge', async (sock, events) => {
          const b = client.createBridge({ socketPath: sock });
          const info = await client.claimIdentity(b.bridge, 'sess-2', 'good-token', ['participate']);
          assert.deepStrictEqual(info, {
            id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', name: 'alice Example', permissions: ['participate'],
            picture: 'https://example.org/alice.png', preferredHandle: 'alice', pronouns: 'robot',
          });
          assert.ok(events.some((e) => e.saved === 'alice'), 'saveIdentity was called');
          await assert.rejects(client.claimIdentity(b.bridge, 'sess-3', 'forged-token', []),
            /unknown request token/, 'a token the bridge does not know is refused (negative)');
          b.close();
        });
      });

      await test('C++ bridge: the activity types come from the pkgdef bridge config', async () => {
        // Encode sandstorm-pkgdef.capnp's bridgeConfig the way `spk pack`
        // writes /sandstorm-http-bridge-config, with the real C++ encoder.
        const capnpBin = path.join(ROOT, '.tools/capnproto/bin/capnp');
        const r = spawnSync(capnpBin, ['eval', '-b', `-I${path.join(ROOT, '.tools/sandstorm/src')}`,
          `-I${path.join(ROOT, '.tools/capnproto/include')}`, path.join(ROOT, 'sandstorm-pkgdef.capnp'),
          'pkgdef.bridgeConfig'], { maxBuffer: 1 << 24 });
        assert.strictEqual(r.status, 0, String(r.stderr));
        const names = client.parseEventTypeNames(r.stdout);
        const pkgdefNames = [...read('sandstorm-pkgdef.capnp').matchAll(/name = "([a-zA-Z]+)",\s*\n\s*verbPhrase/g)]
          .map((m) => m[1]);
        assert.deepStrictEqual(names, pkgdefNames);
        assert.ok(names.includes('addComment'));
      });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  // ── C. the wiring ───────────────────────────────────────────────────────────

  await test('the client descriptor asks for participate, as the Powerbox button means', async () => {
    const js = read('sandstorm.js');
    const descriptor = js.match(/identity: '([A-Za-z0-9_-]+)'/)[1];
    assert.deepStrictEqual(client.parseIdentityRequestPermissions(descriptor), ['participate']);
  });

  await test('server/sandstorm.js uses the JavaScript bridge client, and nothing loads capnp.node (negative)', async () => {
    const js = read('server/sandstorm.js');
    assert.ok(js.includes("import('/imports/sandstorm/bridgeClient.mjs')"));
    assert.ok(/reportActivity\(/.test(js) && /claimIdentity\(/.test(js));
    const offenders = spawnSync('git', ['grep', '-l', '-E', "Npm\\.require\\(['\"]capnp['\"]\\)|require\\(['\"]capnp['\"]\\)",
      '--', '*.js', '*.mjs', ':!npm-packages', ':!tests'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim();
    assert.strictEqual(offenders, '', `still requires node-capnp: ${offenders}`);
  });

  await test('the .spk no longer carries the 33 MB Node 14 capnp.node', async () => {
    assert.ok(/rm -rf "\$DEPS\/programs\/server\/node_modules\/capnp\.node"/.test(read('sandstorm-src/build-deps.sh')));
  });

  await test('@wekanteam/capnp-es is the fork in npm-packages, pinned by provenance', async () => {
    const pkg = JSON.parse(read('package.json'));
    assert.strictEqual(pkg.dependencies['@wekanteam/capnp-es'], 'file:npm-packages/capnp-es');
    const readme = read('npm-packages/capnp-es/README.md');
    assert.ok(readme.includes('01217c5c26155ec831843feff682a6ab1ce8445796e5f9ffd0b25e88a9053b64'), 'tarball SHA256');
    assert.ok(readme.includes('439f564bffdaf0c2d6376b263c2317b25a0ba00f'), 'upstream tag commit');
    const fork = JSON.parse(read('npm-packages/capnp-es/package.json'));
    assert.ok(!fork.scripts && !fork.dependencies, 'no lifecycle scripts, no dependencies');
  });

  await test('the generated schema modules say where they came from', async () => {
    const dir = path.join(ROOT, 'imports/sandstorm/capnp');
    for (const f of fs.readdirSync(dir)) {
      const src = fs.readFileSync(path.join(dir, f), 'utf8');
      assert.ok(src.startsWith('// GENERATED by releases/sandstorm-capnp-schemas.sh'), f);
      assert.ok(!/from "capnp-es/.test(src), `${f} imports upstream capnp-es, not the fork`);
    }
  });

  console.log(`\nsandstormCapnpRpc: ${passed} tests passed`);
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
