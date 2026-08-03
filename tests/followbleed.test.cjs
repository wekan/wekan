'use strict';

// FollowBleed — redirect-based SSRF through the import download sinks
// (GHSA-j9p2-jm73-p549, reported by RandomGenerator against v10.53).
// Run: node tests/followbleed.test.cjs
//
// The report: the live Trello import validated the attachment URL with
// validateAttachmentUrl() — the fix for LiveBleed / CVE-2026-30844 — and then
// downloaded it with the platform fetch(), which FOLLOWS REDIRECTS. So the
// guard only ever saw the request:
//
//   1. the attacker puts http://<public-host>/attachment.txt on a Trello card
//   2. validateAttachmentUrl() resolves it, sees a public IP, allows it
//   3. that host answers  302 Location: http://127.0.0.1:18080/secret
//   4. fetch() follows, and the loopback body is stored as the attachment,
//      readable back through WeKan — non-blind SSRF, the very thing the
//      validation was added to stop
//
// A guard on the URL alone cannot hold, because the target gets to answer, and
// an answer can name a new URL. What holds is validating EVERY HOP. This pins
// that: fetchSafe refuses a redirect outright unless the caller opted in, and a
// followed redirect goes through the same protocol / blocked-IP / DNS-pinning
// checks as the original URL before a packet is sent to it.
//
// The second half pins the sinks: the importers must download through
// fetchSafe, and must not go back to a bare redirect-following fetch() — the
// regression the reporter asked for by name.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
const failures = [];
async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log('  ok -', name);
  } catch (err) {
    failures.push(name);
    console.error(`  FAIL - ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

// ── Load the two ES modules without a bundler ────────────────────────────────

function loadModule(rel, injected, exported) {
  const src = read(rel)
    .replace(/^import [^\n]*\n/gm, '')
    .replace(/^export (async function|function|const|let)/gm, '$1');
  const exports = {};
  const names = Object.keys(injected);
  // eslint-disable-next-line no-new-func
  new Function(
    'exports',
    ...names,
    `${src}\n${exported.map(n => `exports.${n} = ${n};`).join('\n')}`,
  )(exports, ...names.map(n => injected[n]));
  return exports;
}

const validation = loadModule(
  'models/lib/attachmentUrlValidation.js',
  { Meteor: { isServer: true }, require },
  ['isIpBlocked'],
);

// Hosts the stub resolver knows about. Anything else fails to resolve.
let DNS = {};
const dnsStub = {
  promises: {
    lookup: async host => {
      if (!DNS[host]) {
        const error = new Error(`ENOTFOUND ${host}`);
        throw error;
      }
      return DNS[host].map(address => ({ address, family: address.includes(':') ? 6 : 4 }));
    },
  },
};

// A transport that answers with a scripted list of responses, one per request,
// and records what it was asked to dial.
function scriptedTransport(steps) {
  const calls = [];
  return {
    calls,
    request(opts, cb) {
      const step = steps[calls.length] || { statusCode: 200, headers: {}, body: 'end' };
      calls.push(opts);
      const res = new Readable({ read() {} });
      res.statusCode = step.statusCode;
      res.headers = step.headers || {};
      process.nextTick(() => {
        cb(res);
        process.nextTick(() => {
          if (!res.destroyed) {
            res.push(step.body === undefined ? '' : step.body);
            res.push(null);
          }
        });
      });
      return { on() {}, write() {}, end() {} };
    },
  };
}

function loadGuard(transport) {
  return loadModule(
    'server/lib/ssrfGuard.js',
    {
      dns: dnsStub,
      fs: require('fs'),
      net: require('net'),
      http: transport,
      https: transport,
      URL: require('url').URL,
      isIpBlocked: validation.isIpBlocked,
      console: { info() {}, error() {}, warn() {} },
    },
    ['fetchSafe'],
  );
}

async function rejects(promise, pattern) {
  try {
    await promise;
  } catch (err) {
    assert.ok(
      pattern.test(err.message),
      `expected /${pattern.source}/, got: ${err.message}`,
    );
    return err;
  }
  throw new Error('expected the promise to reject, it resolved');
}

// ─────────────────────────────────────────────────────────────────────────────

(async () => {
  console.log('followbleed:');

  // ── The attack, exactly as reported ────────────────────────────────────────

  await test('the reported attack: a public URL that 302s to loopback is refused', async () => {
    DNS = {};
    const transport = scriptedTransport([
      { statusCode: 302, headers: { location: 'http://127.0.0.1:18080/secret' } },
      { statusCode: 200, body: 'WEKAN_LIVE_TRELLO_SSRF_POC_OK' },
    ]);
    const { fetchSafe } = loadGuard(transport);
    // The attacker's public-looking host passes input validation, as it did in
    // the report — the refusal has to come from the redirect, not the URL.
    assert.strictEqual(validation.isIpBlocked('198.51.101.10'), false);
    await rejects(
      fetchSafe('http://198.51.101.10:18081/attachment.txt', { maxRedirects: 5 }),
      /Blocked IP in URL: 127\.0\.0\.1/,
    );
    // and it never dialled the loopback service
    assert.strictEqual(transport.calls.length, 1, 'the second hop must not be sent');
  });

  await test('a redirect to a hostname that RESOLVES to loopback is refused', async () => {
    DNS = { 'public.example.com': ['93.184.216.34'], 'evil.example.com': ['127.0.0.1'] };
    const transport = scriptedTransport([
      { statusCode: 302, headers: { location: 'http://evil.example.com/secret' } },
    ]);
    const { fetchSafe } = loadGuard(transport);
    await rejects(
      fetchSafe('http://public.example.com/a.txt', { maxRedirects: 5 }),
      /Blocked IP 127\.0\.0\.1 resolved for evil\.example\.com/,
    );
    assert.strictEqual(transport.calls.length, 1);
  });

  await test('a redirect to the cloud metadata endpoint is refused', async () => {
    DNS = { 'public.example.com': ['93.184.216.34'] };
    const transport = scriptedTransport([
      {
        statusCode: 301,
        headers: { location: 'http://169.254.169.254/latest/meta-data/' },
      },
    ]);
    const { fetchSafe } = loadGuard(transport);
    await rejects(
      fetchSafe('http://public.example.com/a.txt', { maxRedirects: 5 }),
      /Blocked IP in URL: 169\.254\.169\.254/,
    );
  });

  await test('a redirect to a non-http(s) scheme is refused', async () => {
    DNS = { 'public.example.com': ['93.184.216.34'] };
    const transport = scriptedTransport([
      { statusCode: 302, headers: { location: 'file:///etc/passwd' } },
    ]);
    const { fetchSafe } = loadGuard(transport);
    await rejects(
      fetchSafe('http://public.example.com/a.txt', { maxRedirects: 5 }),
      /Protocol not allowed: file:/,
    );
  });

  await test('a RELATIVE redirect is resolved and re-validated, not skipped', async () => {
    DNS = { 'public.example.com': ['93.184.216.34'] };
    const transport = scriptedTransport([
      { statusCode: 302, headers: { location: '/second' } },
      { statusCode: 200, body: 'second-body' },
    ]);
    const { fetchSafe } = loadGuard(transport);
    const res = await fetchSafe('http://public.example.com/first', { maxRedirects: 5 });
    assert.strictEqual(await res.text(), 'second-body');
    assert.strictEqual(transport.calls[1].path, '/second');
    // still pinned to the validated IP, never re-resolved by hostname
    assert.strictEqual(transport.calls[1].hostname, '93.184.216.34');
  });

  // ── Refusing redirects stays the DEFAULT ───────────────────────────────────

  await test('with no maxRedirects, ANY redirect is still refused outright', async () => {
    DNS = { 'redir.example.com': ['93.184.216.34'] };
    const transport = scriptedTransport([
      // even a redirect to a perfectly public host
      { statusCode: 302, headers: { location: 'http://93.184.216.34/ok' } },
    ]);
    const { fetchSafe } = loadGuard(transport);
    await rejects(
      fetchSafe('http://redir.example.com/'),
      /Redirects are not allowed/,
    );
    assert.strictEqual(transport.calls.length, 1);
  });

  await test('a redirect chain cannot run past the caller\'s limit', async () => {
    DNS = { 'public.example.com': ['93.184.216.34'] };
    const transport = scriptedTransport([
      { statusCode: 302, headers: { location: 'http://public.example.com/2' } },
      { statusCode: 302, headers: { location: 'http://public.example.com/3' } },
      { statusCode: 302, headers: { location: 'http://public.example.com/4' } },
    ]);
    const { fetchSafe } = loadGuard(transport);
    await rejects(
      fetchSafe('http://public.example.com/1', { maxRedirects: 2 }),
      /Too many redirects \(limit 2\)/,
    );
    assert.strictEqual(transport.calls.length, 3);
  });

  await test('a redirect with no Location header is an error, not a silent body', async () => {
    DNS = { 'public.example.com': ['93.184.216.34'] };
    const transport = scriptedTransport([{ statusCode: 302, headers: {}, body: 'x' }]);
    const { fetchSafe } = loadGuard(transport);
    await rejects(
      fetchSafe('http://public.example.com/', { maxRedirects: 5 }),
      /Redirect without a Location header/,
    );
  });

  // ── A legitimate redirect still works (the import has to keep working) ─────

  await test('a redirect between two public hosts is followed, each hop pinned', async () => {
    DNS = {
      'trello.example.com': ['93.184.216.34'],
      's3.example.com': ['203.0.113.9', '198.51.99.7'],
    };
    // 203.0.113.0/24 is TEST-NET-3 and blocked, so the guard must pin the other
    // address; a host is only usable when EVERY address it returns is allowed.
    DNS['s3.example.com'] = ['198.51.99.7'];
    const transport = scriptedTransport([
      { statusCode: 302, headers: { location: 'https://s3.example.com/signed?x=1' } },
      { statusCode: 200, headers: { 'content-type': 'image/png' }, body: 'PNGDATA' },
    ]);
    const { fetchSafe } = loadGuard(transport);
    const res = await fetchSafe('https://trello.example.com/download/a.png', {
      maxRedirects: 5,
    });
    assert.strictEqual(res.ok, true);
    assert.strictEqual(await res.text(), 'PNGDATA');
    assert.strictEqual(transport.calls.length, 2);
    assert.strictEqual(transport.calls[0].hostname, '93.184.216.34');
    assert.strictEqual(transport.calls[1].hostname, '198.51.99.7');
    // Host header and SNI keep the real hostname of each hop
    assert.strictEqual(transport.calls[1].headers.Host, 's3.example.com');
    assert.strictEqual(transport.calls[1].servername, 's3.example.com');
  });

  await test('a host whose OTHER address is blocked is refused, not pinned around', async () => {
    DNS = { 'public.example.com': ['93.184.216.34'], 'mixed.example.com': ['93.184.216.34', '10.0.0.5'] };
    const transport = scriptedTransport([
      { statusCode: 302, headers: { location: 'http://mixed.example.com/x' } },
    ]);
    const { fetchSafe } = loadGuard(transport);
    await rejects(
      fetchSafe('http://public.example.com/', { maxRedirects: 5 }),
      /Blocked IP 10\.0\.0\.5 resolved for mixed\.example\.com/,
    );
  });

  // ── Credentials do not travel to wherever a redirect points ────────────────

  await test('the Authorization header is dropped on a CROSS-origin redirect', async () => {
    DNS = { 'trello.example.com': ['93.184.216.34'], 's3.example.com': ['198.51.99.7'] };
    const transport = scriptedTransport([
      { statusCode: 302, headers: { location: 'https://s3.example.com/signed' } },
      { statusCode: 200, body: 'ok' },
    ]);
    const { fetchSafe } = loadGuard(transport);
    await fetchSafe('https://trello.example.com/download/a.png', {
      headers: { Authorization: 'OAuth oauth_consumer_key="KEY", oauth_token="TOKEN"' },
      maxRedirects: 5,
    });
    assert.ok(transport.calls[0].headers.Authorization, 'the first hop keeps it');
    assert.strictEqual(
      transport.calls[1].headers.Authorization,
      undefined,
      'the Trello API key and token must not be handed to the redirect target',
    );
  });

  await test('the Authorization header survives a SAME-origin redirect', async () => {
    DNS = { 'trello.example.com': ['93.184.216.34'] };
    const transport = scriptedTransport([
      { statusCode: 302, headers: { location: 'https://trello.example.com/b' } },
      { statusCode: 200, body: 'ok' },
    ]);
    const { fetchSafe } = loadGuard(transport);
    await fetchSafe('https://trello.example.com/a', {
      headers: { Authorization: 'OAuth x' },
      maxRedirects: 5,
    });
    assert.strictEqual(transport.calls[1].headers.Authorization, 'OAuth x');
  });

  await test('a 303 continues as a bodyless GET, a 307 keeps the method', async () => {
    DNS = { 'public.example.com': ['93.184.216.34'] };
    let transport = scriptedTransport([
      { statusCode: 303, headers: { location: 'http://public.example.com/b' } },
      { statusCode: 200, body: 'ok' },
    ]);
    let guard = loadGuard(transport);
    await guard.fetchSafe('http://public.example.com/a', {
      method: 'POST',
      body: '{}',
      maxRedirects: 5,
    });
    assert.strictEqual(transport.calls[1].method, 'GET');

    transport = scriptedTransport([
      { statusCode: 307, headers: { location: 'http://public.example.com/b' } },
      { statusCode: 200, body: 'ok' },
    ]);
    guard = loadGuard(transport);
    await guard.fetchSafe('http://public.example.com/a', {
      method: 'POST',
      body: '{}',
      maxRedirects: 5,
    });
    assert.strictEqual(transport.calls[1].method, 'POST');
  });

  // ── The response shape callers rely on ─────────────────────────────────────

  await test('headers answer both res.headers[name] and headers.get(name)', async () => {
    DNS = { 'public.example.com': ['93.184.216.34'] };
    const transport = scriptedTransport([
      { statusCode: 200, headers: { 'content-type': 'image/png; charset=x' }, body: 'b' },
    ]);
    const { fetchSafe } = loadGuard(transport);
    const res = await fetchSafe('http://public.example.com/');
    assert.strictEqual(res.headers['content-type'], 'image/png; charset=x');
    assert.strictEqual(res.headers.get('content-type'), 'image/png; charset=x');
    assert.strictEqual(res.headers.get('Content-Type'), 'image/png; charset=x');
    assert.strictEqual(res.headers.get('nope'), null);
  });

  // ── The sinks: they must USE the guard ─────────────────────────────────────

  await test('the live Trello import downloads through fetchSafe, not bare fetch', () => {
    const src = read('server/trelloApiImport.js');
    assert.ok(
      /import \{ fetchSafe \} from '\/server\/lib\/ssrfGuard'/.test(src),
      'trelloApiImport must import fetchSafe',
    );

    // downloadAttachmentBase64 — the attachment sink
    const attachment = src.slice(
      src.indexOf('async function downloadAttachmentBase64'),
      src.indexOf('async function fetchBoard'),
    );
    assert.ok(/validateAttachmentUrl\(url\)/.test(attachment), 'must still validate the URL');
    assert.ok(/\{ untrusted: true \}/.test(attachment),
      'the attachment download must go through the guarded fetch');
    assert.ok(!/await fetch\(/.test(attachment), 'no bare fetch in the attachment sink');

    // inlineBoardBackground — the background sink
    const background = src.slice(
      src.indexOf('export async function inlineBoardBackground'),
      src.indexOf('export async function inlineMemberAvatars'),
    );
    assert.ok(/fetchSafe\(url, \{/.test(background), 'the background must use fetchSafe');
    assert.ok(!/await fetch\(/.test(background), 'no bare fetch in the background sink');

    // inlineMemberAvatars — the avatar sink
    const avatars = src.slice(
      src.indexOf('export async function inlineMemberAvatars'),
      src.indexOf('export async function inlineStickers'),
    );
    assert.ok(/fetchSafe\(imgUrl/.test(avatars), 'the avatar download must use fetchSafe');
    assert.ok(!/await fetch\(imgUrl/.test(avatars), 'no bare fetch in the avatar sink');

    // The ONLY remaining bare fetch is the hardcoded api.trello.com call.
    assert.strictEqual(
      (src.match(/await fetch\(/g) || []).length,
      1,
      'only the api.trello.com request may use the platform fetch',
    );
    assert.ok(
      /maxRedirects: MAX_DOWNLOAD_REDIRECTS/.test(src),
      'downloads must cap and validate redirects rather than follow them blindly',
    );
  });

  await test('the offline importers no longer download via Meteor-Files loadAsync', () => {
    // Comments below explain what loadAsync used to do, so read the CODE.
    const codeOnly = text => text.replace(/^\s*\/\/.*$/gm, '');
    for (const file of ['models/trelloCreator.js', 'models/wekanCreator.js']) {
      const src = codeOnly(read(file));
      assert.ok(
        !/Attachments\.loadAsync\(/.test(src),
        `${file}: loadAsync fetches with the redirect-following platform fetch`,
      );
      assert.ok(
        /fetchImportedAttachment\(att\.url\)/.test(src),
        `${file}: must download through the hop-validating helper`,
      );
    }
    const helper = read('models/lib/importAttachmentDownload.js');
    assert.ok(/validateAttachmentUrl\(url\)/.test(helper), 'the helper validates at input time');
    assert.ok(/fetchSafe\(url, \{ maxRedirects/.test(helper), 'and downloads through fetchSafe');
  });

  console.log(
    `\nfollowbleed: ${passed} checks passed` +
      (failures.length ? `, ${failures.length} FAILED: ${failures.join(', ')}` : ''),
  );
})();
