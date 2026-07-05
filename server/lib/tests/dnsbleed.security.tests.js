/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import dns from 'dns';
import http from 'http';
import https from 'https';
import { EventEmitter } from 'events';
import {
  isIpBlocked,
  validateAttachmentUrl,
} from '/models/lib/attachmentUrlValidation';
import { fetchSafe, isBlockedIPv4, isBlockedIPv6 } from '/server/lib/ssrfGuard';

// Regression tests for the DnsBleed fix: SSRF filter bypass via a public
// hostname that resolves (DNS) to a blocked internal address in outgoing
// webhooks (GHSA-66m2-4wfr-c45p, CWE-918). Incomplete-fix follow-up to
// WebhookBleed (GHSA-hc3x-hq3m-663q) and IntegrationBleed / RebindBleed.
//
// The core of the fix:
//   1. The delivery guard fetchSafe() must reject a hostname whose RESOLVED IP
//      is private/loopback/link-local/reserved — for BOTH address families
//      (A + AAAA), not just IPv4 as the previous dns.resolve4-only code did.
//   2. The block-list is a single shared source of truth (isIpBlocked) used by
//      both the input-time validator (validateAttachmentUrl) and the
//      delivery-time guard (fetchSafe), so they can never drift apart.
//
// See https://wekan.fi/hall-of-fame/dnsbleed/ and the Upcoming release CHANGELOG.

// Make dns.promises.lookup deterministic. `map` is hostname -> array of
// { address, family } records (matching dns.lookup({ all: true })). A hostname
// mapped to 'FAIL' (or absent) throws, like an unresolvable name.
function stubLookup(map) {
  sinon.stub(dns.promises, 'lookup').callsFake(async host => {
    const value = map[host];
    if (value === undefined || value === 'FAIL') {
      const err = new Error(`ENOTFOUND ${host}`);
      err.code = 'ENOTFOUND';
      throw err;
    }
    return value;
  });
}

// Replace the real TCP request with an in-memory fake so "allowed" hosts never
// hit the network. Returns a `capture` object whose `.opts` holds the request
// options fetchSafe built (so tests can assert the pinned IP / Host / SNI).
function stubTransport({ statusCode = 200, headers = {}, body = '' } = {}) {
  const capture = {};
  const fake = (opts, cb) => {
    capture.opts = opts;
    const req = new EventEmitter();
    req.write = () => {};
    req.end = () => {};
    const res = new EventEmitter();
    res.statusCode = statusCode;
    res.headers = headers;
    res.destroy = () => {};
    process.nextTick(() => {
      cb(res);
      process.nextTick(() => {
        if (body) res.emit('data', Buffer.from(body));
        res.emit('end');
      });
    });
    return req;
  };
  sinon.stub(http, 'request').callsFake(fake);
  sinon.stub(https, 'request').callsFake(fake);
  return capture;
}

async function expectReject(promise, matcher) {
  let error;
  try {
    await promise;
  } catch (e) {
    error = e;
  }
  expect(error, 'expected the promise to reject but it resolved').to.exist;
  expect(error.message).to.match(matcher);
  return error;
}

describe('DnsBleed SSRF guard (GHSA-66m2-4wfr-c45p)', function () {
  afterEach(function () {
    sinon.restore();
  });

  // ── Shared block-list: single source of truth ────────────────────────────
  describe('isIpBlocked() — shared block-list', function () {
    const blocked = [
      ['127.0.0.1', 'IPv4 loopback'],
      ['127.9.9.9', 'IPv4 loopback range'],
      ['10.0.0.1', 'RFC1918 10/8'],
      ['172.16.0.1', 'RFC1918 172.16/12 low edge'],
      ['172.31.255.255', 'RFC1918 172.16/12 high edge'],
      ['192.168.1.1', 'RFC1918 192.168/16'],
      ['169.254.169.254', 'link-local / cloud metadata (IMDS)'],
      ['0.0.0.0', 'current network / unspecified'],
      ['100.64.0.1', 'CGNAT shared address (RFC6598)'],
      ['::1', 'IPv6 loopback'],
      ['::', 'IPv6 unspecified'],
      ['fd00::1', 'IPv6 unique-local (fd)'],
      ['fe80::1', 'IPv6 link-local'],
      ['ff02::1', 'IPv6 multicast'],
      ['::ffff:127.0.0.1', 'IPv4-mapped loopback'],
      ['::ffff:169.254.169.254', 'IPv4-mapped metadata'],
    ];
    blocked.forEach(([ip, label]) => {
      it(`blocks ${ip} (${label})`, function () {
        expect(isIpBlocked(ip)).to.equal(true);
      });
    });

    // Negative tests: public / non-reserved addresses must be allowed.
    const allowed = [
      ['8.8.8.8', 'public IPv4'],
      ['1.1.1.1', 'public IPv4'],
      ['93.184.216.34', 'public IPv4 (example.com)'],
      ['172.15.0.1', 'just below RFC1918 172.16/12'],
      ['172.32.0.1', 'just above RFC1918 172.16/12'],
      ['100.63.255.255', 'just below CGNAT 100.64/10'],
      ['2606:4700:4700::1111', 'public IPv6 (Cloudflare)'],
      ['2001:4860:4860::8888', 'public IPv6 (Google)'],
    ];
    allowed.forEach(([ip, label]) => {
      it(`allows ${ip} (${label})`, function () {
        expect(isIpBlocked(ip)).to.equal(false);
      });
    });

    it('fails closed for a non-IP string', function () {
      expect(isIpBlocked('not-an-ip')).to.equal(true);
      expect(isIpBlocked('')).to.equal(true);
    });
  });

  // ── Backward-compatible family wrappers over the shared list ──────────────
  describe('isBlockedIPv4() / isBlockedIPv6() wrappers', function () {
    it('isBlockedIPv4 matches the shared list for IPv4', function () {
      expect(isBlockedIPv4('127.0.0.1')).to.equal(true);
      expect(isBlockedIPv4('169.254.169.254')).to.equal(true);
      expect(isBlockedIPv4('8.8.8.8')).to.equal(false);
    });
    it('isBlockedIPv4 fails closed for non-IPv4 input', function () {
      expect(isBlockedIPv4('::1')).to.equal(true);
      expect(isBlockedIPv4('garbage')).to.equal(true);
    });
    it('isBlockedIPv6 matches the shared list for IPv6', function () {
      expect(isBlockedIPv6('::1')).to.equal(true);
      expect(isBlockedIPv6('fd00::1')).to.equal(true);
      expect(isBlockedIPv6('2606:4700:4700::1111')).to.equal(false);
    });
    it('isBlockedIPv6 fails closed for non-IPv6 input', function () {
      expect(isBlockedIPv6('127.0.0.1')).to.equal(true);
      expect(isBlockedIPv6('garbage')).to.equal(true);
    });
  });

  // ── fetchSafe: must reject before any connection ─────────────────────────
  describe('fetchSafe() rejects SSRF targets before connecting', function () {
    it('rejects non-http(s) protocols', async function () {
      await expectReject(fetchSafe('ftp://example.com/x'), /Protocol not allowed/);
      await expectReject(fetchSafe('file:///etc/passwd'), /Protocol not allowed/);
    });

    it('rejects an unparseable URL', async function () {
      await expectReject(fetchSafe('http://'), /Invalid URL|DNS resolution failed/);
    });

    it('rejects a literal loopback IPv4 URL (no DNS)', async function () {
      const spy = sinon.stub(dns.promises, 'lookup');
      await expectReject(fetchSafe('http://127.0.0.1/'), /Blocked IP in URL/);
      expect(spy.called, 'DNS must not be queried for a literal IP').to.equal(false);
    });

    it('rejects a literal metadata IPv4 URL', async function () {
      await expectReject(
        fetchSafe('http://169.254.169.254/latest/meta-data/'),
        /Blocked IP in URL/,
      );
    });

    it('rejects a literal IPv6 loopback URL', async function () {
      await expectReject(fetchSafe('http://[::1]/'), /Blocked IP in URL/);
    });

    it('rejects decimal-integer-encoded loopback (http://2130706433)', async function () {
      const spy = sinon.stub(dns.promises, 'lookup');
      // Either block path is correct: the WHATWG URL parser normalises the
      // integer host 2130706433 to 127.0.0.1, so the dotted-quad guard blocks it
      // ("Blocked IP in URL: 127.0.0.1"); if a parser leaves it integer-encoded,
      // the guard's own decimal decoder blocks it ("decodes to blocked 127.0.0.1").
      await expectReject(
        fetchSafe('http://2130706433/'),
        /(decodes to blocked|Blocked IP in URL:)\s*127\.0\.0\.1/,
      );
      expect(spy.called).to.equal(false);
    });

    // The published PoC: a public wildcard-DNS hostname that resolves to the
    // cloud-metadata IP. This is the exact DnsBleed bypass.
    it('rejects 169-254-169-254.nip.io -> 169.254.169.254 (the PoC)', async function () {
      stubLookup({
        '169-254-169-254.nip.io': [{ address: '169.254.169.254', family: 4 }],
      });
      await expectReject(
        fetchSafe('http://169-254-169-254.nip.io/latest/meta-data/'),
        /Blocked IP 169\.254\.169\.254 resolved/,
      );
    });

    it('rejects 127-0-0-1.nip.io -> 127.0.0.1', async function () {
      stubLookup({ '127-0-0-1.nip.io': [{ address: '127.0.0.1', family: 4 }] });
      await expectReject(
        fetchSafe('http://127-0-0-1.nip.io/'),
        /Blocked IP 127\.0\.0\.1 resolved/,
      );
    });

    it('rejects an attacker domain whose A record points at RFC1918', async function () {
      stubLookup({ 'evil.example.com': [{ address: '10.0.0.5', family: 4 }] });
      await expectReject(
        fetchSafe('http://evil.example.com/'),
        /Blocked IP 10\.0\.0\.5 resolved/,
      );
    });

    // Regression for the newly-closed gap: the old resolve4-only guard was
    // blind to AAAA. A hostname resolving to an internal IPv6 address must now
    // be rejected at delivery time.
    it('rejects a hostname whose AAAA record points at internal IPv6', async function () {
      stubLookup({ 'evil6.example.com': [{ address: 'fd00::1', family: 6 }] });
      await expectReject(
        fetchSafe('http://evil6.example.com/'),
        /Blocked IP fd00::1 resolved/,
      );
    });

    it('rejects a hostname whose AAAA record is IPv6 loopback', async function () {
      stubLookup({ 'lo6.example.com': [{ address: '::1', family: 6 }] });
      await expectReject(fetchSafe('http://lo6.example.com/'), /Blocked IP ::1 resolved/);
    });

    // Dual-stack partial-bypass: a public A record must NOT excuse an internal
    // AAAA record. If ANY resolved address is blocked, the whole request fails.
    it('rejects dual-stack when only the AAAA record is internal', async function () {
      stubLookup({
        'dual.example.com': [
          { address: '93.184.216.34', family: 4 },
          { address: 'fd00::1', family: 6 },
        ],
      });
      await expectReject(
        fetchSafe('http://dual.example.com/'),
        /Blocked IP fd00::1 resolved/,
      );
    });

    it('rejects when the hostname does not resolve', async function () {
      stubLookup({});
      await expectReject(fetchSafe('http://nope.invalid/'), /DNS resolution failed/);
    });

    it('rejects when resolution returns no addresses', async function () {
      stubLookup({ 'empty.example.com': [] });
      await expectReject(
        fetchSafe('http://empty.example.com/'),
        /No DNS records returned/,
      );
    });
  });

  // ── fetchSafe: negative tests — legitimate public hosts must work ────────
  describe('fetchSafe() allows public hosts and pins the connection', function () {
    it('allows a public host and pins the dial to the resolved IP', async function () {
      stubLookup({ 'example.com': [{ address: '93.184.216.34', family: 4 }] });
      const cap = stubTransport({ statusCode: 200, body: '{"ok":true}' });

      const res = await fetchSafe('http://example.com/hook', {
        method: 'POST',
        headers: { 'X-Test': '1' },
        body: '{}',
      });

      expect(res.status).to.equal(200);
      // Connection is pinned to the validated IP, not re-resolved by hostname.
      expect(cap.opts.hostname).to.equal('93.184.216.34');
      // Original Host header is preserved for virtual-hosting.
      expect(cap.opts.headers.Host).to.equal('example.com');
      expect(cap.opts.headers['X-Test']).to.equal('1');
      expect(await res.json()).to.deep.equal({ ok: true });
    });

    it('prefers an IPv4 address when a dual-stack host is all-public', async function () {
      stubLookup({
        'dualpub.example.com': [
          { address: '93.184.216.34', family: 4 },
          { address: '2606:4700:4700::1111', family: 6 },
        ],
      });
      const cap = stubTransport({ statusCode: 200 });
      const res = await fetchSafe('http://dualpub.example.com/');
      expect(res.status).to.equal(200);
      expect(cap.opts.hostname).to.equal('93.184.216.34');
    });

    it('pins to a public IPv6 address for an IPv6-only host', async function () {
      stubLookup({
        'v6.example.com': [{ address: '2606:4700:4700::1111', family: 6 }],
      });
      const cap = stubTransport({ statusCode: 200 });
      const res = await fetchSafe('http://v6.example.com/');
      expect(res.status).to.equal(200);
      expect(cap.opts.hostname).to.equal('2606:4700:4700::1111');
    });

    it('allows a literal public IPv4 URL without any DNS lookup', async function () {
      const spy = sinon.stub(dns.promises, 'lookup');
      const cap = stubTransport({ statusCode: 204 });
      const res = await fetchSafe('http://93.184.216.34/');
      expect(res.status).to.equal(204);
      expect(cap.opts.hostname).to.equal('93.184.216.34');
      expect(spy.called).to.equal(false);
    });

    it('sets the TLS SNI to the original hostname for https', async function () {
      stubLookup({ 'secure.example.com': [{ address: '93.184.216.34', family: 4 }] });
      const cap = stubTransport({ statusCode: 200 });
      const res = await fetchSafe('https://secure.example.com/');
      expect(res.status).to.equal(200);
      expect(cap.opts.hostname).to.equal('93.184.216.34');
      expect(cap.opts.servername).to.equal('secure.example.com');
    });

    it('blocks redirects even when the host itself is public', async function () {
      stubLookup({ 'redir.example.com': [{ address: '93.184.216.34', family: 4 }] });
      stubTransport({ statusCode: 302, headers: { location: 'http://127.0.0.1/' } });
      await expectReject(
        fetchSafe('http://redir.example.com/'),
        /Redirects are not allowed/,
      );
    });
  });

  // ── Input-time validator parity (validateAttachmentUrl) ──────────────────
  describe('validateAttachmentUrl() — input-time DNS-aware validation', function () {
    it('rejects a literal metadata IP', async function () {
      const result = await validateAttachmentUrl('http://169.254.169.254/');
      expect(result.valid).to.equal(false);
    });

    it('rejects localhost', async function () {
      const result = await validateAttachmentUrl('http://localhost/hook');
      expect(result.valid).to.equal(false);
    });

    it('rejects non-http(s) protocols', async function () {
      const result = await validateAttachmentUrl('ftp://example.com/x');
      expect(result.valid).to.equal(false);
    });

    // Same DnsBleed PoC, blocked at input time (REST create/update).
    it('rejects 169-254-169-254.nip.io -> 169.254.169.254', async function () {
      stubLookup({
        '169-254-169-254.nip.io': [{ address: '169.254.169.254', family: 4 }],
      });
      const result = await validateAttachmentUrl('http://169-254-169-254.nip.io/');
      expect(result.valid).to.equal(false);
      expect(result.reason).to.match(/not allowed/i);
    });

    it('rejects a hostname whose AAAA record is internal IPv6', async function () {
      stubLookup({ 'evil6.example.com': [{ address: 'fd00::1', family: 6 }] });
      const result = await validateAttachmentUrl('http://evil6.example.com/');
      expect(result.valid).to.equal(false);
    });

    it('allows a public host (negative test)', async function () {
      stubLookup({ 'example.com': [{ address: '93.184.216.34', family: 4 }] });
      const result = await validateAttachmentUrl('http://example.com/hook');
      expect(result.valid).to.equal(true);
    });
  });
});
