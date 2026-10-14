'use strict';

// Outgoing requests through an HTTP proxy (#1455): HTTP_PROXY, HTTPS_PROXY and
// NO_PROXY, as everywhere, with the SSRF guard (server/lib/ssrfGuard.js) still
// deciding where a request may go. The proxy is handed the address the guard
// checked, never the name, so it cannot resolve the name to somewhere else;
// and a destination the guard refuses never reaches the proxy at all.
// Run: node tests/outboundProxy.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const proxyLib = require('../server/lib/outboundProxy');
const { proxyFor, noProxyMatches, proxyAuthorization, pinnedAuthority } = proxyLib;

test('which proxy: HTTPS_PROXY for https, HTTP_PROXY for http, lower case too, none when unset', () => {
  const env = { HTTPS_PROXY: 'http://squid:3128', http_proxy: 'proxy.lan:8080' };
  assert.equal(proxyFor(new URL('https://hooks.example.com/x'), env).href, 'http://squid:3128/');
  assert.equal(proxyFor(new URL('http://hooks.example.com/x'), env).href, 'http://proxy.lan:8080/');
  assert.equal(proxyFor(new URL('https://hooks.example.com/x'), {}), null);
  assert.throws(() => proxyFor(new URL('https://a.example'), { HTTPS_PROXY: 'socks5://p:1080' }), /not supported/);
});

test('NO_PROXY: names and their subdomains, host:port, addresses, and *', () => {
  const list = 'localhost, .internal.example, chat.example.com:8443 10.0.0.5 *.corp';
  assert.equal(noProxyMatches('a.internal.example', 443, list), true);
  assert.equal(noProxyMatches('internal.example', 443, list), true);
  assert.equal(noProxyMatches('chat.example.com', 8443, list), true);
  assert.equal(noProxyMatches('chat.example.com', 443, list), false, 'another port');
  assert.equal(noProxyMatches('10.0.0.5', 80, list), true);
  assert.equal(noProxyMatches('x.corp', 80, list), true);
  // Negative: a name that only ENDS like an entry is not under it.
  assert.equal(noProxyMatches('evilinternal.example', 443, list), false);
  assert.equal(noProxyMatches('notlocalhost', 80, list), false);
  assert.equal(noProxyMatches('anything', 1, '*'), true);
  assert.equal(proxyFor(new URL('https://a.internal.example'), { HTTPS_PROXY: 'http://p:1', NO_PROXY: list }), null);
});

test('credentials become Proxy-Authorization; the proxy is asked for the checked address', () => {
  assert.equal(proxyAuthorization(new URL('http://us%40er:p%3Ass@p:1')), `Basic ${Buffer.from('us@er:p:ss').toString('base64')}`);
  assert.equal(proxyAuthorization(new URL('http://p:1')), null);
  assert.equal(pinnedAuthority('93.184.216.34', 443), '93.184.216.34:443');
  assert.equal(pinnedAuthority('2001:db8::1', 443), '[2001:db8::1]:443');
});

// The real guard, loaded the way its other tests load it, with a resolver stub
// and the real http/https/tls/net.
function loadGuard(dnsTable) {
  const src = fs.readFileSync(path.join(ROOT, 'server/lib/ssrfGuard.js'), 'utf8')
    .replace(/^import [^\n]*\n/gm, '')
    .replace(/^export (async function|function|const|let)/gm, '$1');
  const validation = (() => {
    const v = fs.readFileSync(path.join(ROOT, 'models/lib/attachmentUrlValidation.js'), 'utf8')
      .replace(/^import [^\n]*\n/gm, '').replace(/^export (async function|function|const|let)/gm, '$1');
    const out = {};
    new Function('exports', 'Meteor', 'require', `${v}\nexports.isIpBlocked = isIpBlocked;`)(out, { isServer: true }, require);
    return out;
  })();
  const injected = {
    dns: { promises: { lookup: async host => {
      if (!dnsTable[host]) throw new Error(`ENOTFOUND ${host}`);
      return dnsTable[host].map(address => ({ address, family: 4 }));
    } } },
    fs, net: require('node:net'), http, https: require('node:https'), tls: require('node:tls'), URL,
    isIpBlocked: validation.isIpBlocked, createOutboundDeadline: require('../server/lib/outboundDeadline').createOutboundDeadline,
    ...proxyLib, console: { info() {}, error() {}, warn() {} },
  };
  const out = {};
  new Function('exports', ...Object.keys(injected), `${src}\nexports.fetchSafe = fetchSafe;`)(out, ...Object.values(injected));
  return out;
}

function startProxy(onRequest) {
  const seen = [];
  const server = http.createServer((req, res) => {
    seen.push({ method: req.method, url: req.url, host: req.headers.host, auth: req.headers['proxy-authorization'] });
    onRequest(req, res);
  });
  server.on('connect', (req, socket) => {
    seen.push({ method: 'CONNECT', url: req.url, host: req.headers.host, auth: req.headers['proxy-authorization'] });
    socket.end('HTTP/1.1 403 Forbidden\r\n\r\n');
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, seen, port: server.address().port })));
}

test('through a real proxy: the pinned address, the real Host, credentials; and a refused destination never reaches it', async () => {
  const proxy = await startProxy((req, res) => res.end('via proxy'));
  const saved = { ...process.env };
  try {
    process.env.HTTP_PROXY = `http://hook:secret@127.0.0.1:${proxy.port}`;
    process.env.HTTPS_PROXY = `http://127.0.0.1:${proxy.port}`;
    delete process.env.NO_PROXY;
    delete process.env.no_proxy;
    const { fetchSafe } = loadGuard({ 'hooks.example.com': ['93.184.216.34'], 'rebind.example.com': ['10.1.2.3'] });

    const res = await fetchSafe('http://hooks.example.com/hook?x=1', { method: 'POST', body: '{}' });
    assert.equal(await res.text(), 'via proxy');
    assert.deepEqual(proxy.seen[0], { method: 'POST', url: 'http://93.184.216.34:80/hook?x=1', host: 'hooks.example.com',
      auth: `Basic ${Buffer.from('hook:secret').toString('base64')}` });

    await assert.rejects(fetchSafe('https://hooks.example.com/hook'), /proxy refused the tunnel \(403\)/);
    assert.equal(proxy.seen[1].method, 'CONNECT');
    assert.equal(proxy.seen[1].url, '93.184.216.34:443', 'the tunnel is to the checked address, not the name');

    // Negative: a name that resolves to a private address is refused by the
    // guard, before the proxy is asked anything.
    const before = proxy.seen.length;
    await assert.rejects(fetchSafe('http://rebind.example.com/x'), /SSRF_GUARD/);
    await assert.rejects(fetchSafe('http://127.0.0.1:1/x'), /SSRF_GUARD/);
    assert.equal(proxy.seen.length, before);
  } finally {
    for (const k of ['HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY', 'no_proxy']) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
    proxy.server.close();
  }
});

test('the guard asks for a proxy on every request, and only through this module', () => {
  const src = fs.readFileSync(path.join(ROOT, 'server/lib/ssrfGuard.js'), 'utf8');
  assert.match(src, /function requestOnce\(parsed, resolvedIp, options, deadline\) \{\n  const proxy = proxyFor\(parsed\);/);
  assert.match(src, /path: authority,/, 'CONNECT names the pinned authority');
  assert.doesNotMatch(src, /path: `\$\{parsed\.hostname\}:/, 'never the name');
});
