/**
 * server/lib/ssrfGuard.js — SSRF + DNS-Rebinding hardened fetch
 *
 * Prevents Server-Side Request Forgery by, for EVERY hop of a request:
 *   1. Blocking private / loopback IP ranges in the URL string.
 *   2. Resolving the hostname exactly once and validating every returned IP.
 *   3. Pinning the TCP connection to the resolved IP — no second DNS lookup
 *      can occur, eliminating the DNS-rebinding window entirely.
 *   4. Refusing HTTP redirects by default, and validating a followed redirect
 *      the same way as the original URL when a caller opts in to following one.
 *
 * "Every hop" is the point. A guard that checks only the URL the caller passed
 * is a guard the target can step around by ANSWERING with a redirect to
 * 127.0.0.1 instead of serving the request — the bypass reported as FollowBleed
 * (GHSA-j9p2-jm73-p549). So a redirect is either refused (maxRedirects: 0, the
 * default, correct for webhooks and avatar downloads) or followed only after
 * the new URL has been through the same validation and pinning.
 *
 * Uses only Node.js built-in modules (http, https, dns, net) so there is no
 * external-package version dependency.
 *
 * Usage:
 *   import { fetchSafe } from '/server/lib/ssrfGuard';
 *   const response = await fetchSafe(url, { method: 'POST', body: '…' });
 *   const file     = await fetchSafe(url, { maxRedirects: 5 });
 */

import dns from 'dns';
import fs from 'fs';
import net from 'net';
import http from 'http';
import https from 'https';
import { URL } from 'url';
import { isIpBlocked } from '/models/lib/attachmentUrlValidation';

// dns/promises is only a standalone sub-path from Node 15+; use dns.promises
// for compatibility with the Node 14 runtime bundled in Meteor 2.x.
const dnsPromises = dns.promises;

// ─── Blocked-range helpers ────────────────────────────────────────────────────
//
// The authoritative block-list lives in models/lib/attachmentUrlValidation.js
// (`isIpBlocked`) and is shared by both the input-time validator and this
// delivery-time guard so the two can never drift apart. The two functions below
// are kept only as backward-compatible, family-specific wrappers over that
// single source of truth — do NOT reintroduce a private range list here.

/**
 * Returns true if the IPv4 address belongs to a range that must never be
 * contacted from a server-side outgoing request. Thin wrapper over the shared
 * `isIpBlocked`.
 *
 * @param {string} addr  Dotted-decimal IPv4 string, e.g. "192.168.1.1"
 * @returns {boolean}
 */
export function isBlockedIPv4(addr) {
  return net.isIPv4(addr) ? isIpBlocked(addr) : true;
}

/**
 * Returns true if the IPv6 address belongs to a range that must never be
 * contacted from a server-side outgoing request. Thin wrapper over the shared
 * `isIpBlocked`.
 *
 * @param {string} addr  IPv6 string without surrounding brackets
 * @returns {boolean}
 */
export function isBlockedIPv6(addr) {
  return net.isIPv6(addr) ? isIpBlocked(addr) : true;
}

// ─── DNS resolve + validate ───────────────────────────────────────────────────

/**
 * Resolve the hostname exactly once, validate every returned IP against the
 * block-list, and return a single safe address to pin the connection to.
 *
 * If the caller already passed a raw IP (no DNS needed) it is validated and
 * returned directly.
 *
 * Resolution goes through `dns.lookup({ all: true })` so BOTH address families
 * (A + AAAA) are returned and checked — the same resolver call the input-time
 * validator uses (models/lib/attachmentUrlValidation.js). The previous
 * implementation resolved only A records (`dns.resolve4`), which left the
 * delivery layer blind to AAAA: an IPv6-only internal target was merely
 * fail-closed and legitimate IPv6 endpoints were unreachable. Validating with
 * the shared `isIpBlocked` also keeps this block-list from drifting out of sync
 * with the input-side one (root cause of GHSA-66m2-4wfr-c45p / DnsBleed).
 *
 * @param {string} hostname
 * @returns {Promise<string>}  The validated IP address to dial
 */
async function resolveAndPin(hostname) {
  // Raw IP literal in the URL — validate directly, no DNS. IPv6 literals arrive
  // bracketed from URL.hostname (e.g. "[::1]"), so strip brackets before the
  // net.isIP() check. For a real hostname this is a no-op.
  const cleanHost = hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(cleanHost)) {
    if (isIpBlocked(cleanHost)) {
      throw new Error(`SSRF_GUARD: Blocked IP in URL: ${cleanHost}`);
    }
    return cleanHost;
  }

  // Resolve both address families once, then check every returned address.
  let results;
  try {
    results = await dnsPromises.lookup(cleanHost, { all: true });
  } catch (e) {
    throw new Error(`SSRF_GUARD: DNS resolution failed for: ${cleanHost}`);
  }

  const addresses = (results || []).map(r => r.address);
  if (addresses.length === 0) {
    throw new Error(`SSRF_GUARD: No DNS records returned for: ${hostname}`);
  }

  for (const addr of addresses) {
    if (isIpBlocked(addr)) {
      throw new Error(`SSRF_GUARD: Blocked IP ${addr} resolved for ${hostname}`);
    }
  }

  // Prefer an IPv4 address to pin/dial (widest compatibility); fall back to the
  // first validated address for IPv6-only endpoints.
  return addresses.find(a => net.isIPv4(a)) || addresses[0];
}

// ─── Public API ───────────────────────────────────────────────────────────────

// The certificate(s) WeKan should trust for outgoing webhooks, from
// WEBHOOK_TLS_CA_CERT: either the PEM itself or a path to a file holding it.
// Read once - an operator changing it restarts WeKan anyway - and never fatal: a
// bad path leaves the default trust store in place rather than stopping webhooks.
let webhookCaCache;
export function webhookCaCert(env = process.env, readFile = fs.readFileSync) {
  if (webhookCaCache !== undefined) return webhookCaCache;

  const value = (env.WEBHOOK_TLS_CA_CERT || '').trim();
  if (!value) {
    webhookCaCache = null;
    return webhookCaCache;
  }

  if (value.includes('-----BEGIN CERTIFICATE-----')) {
    webhookCaCache = value;
    return webhookCaCache;
  }

  try {
    webhookCaCache = readFile(value, 'utf8');
  } catch (error) {
    console.error(
      `WEBHOOK_TLS_CA_CERT: cannot read ${value} (${error.message}). Outgoing ` +
      'webhooks keep the system trust store, so a server with a private ' +
      'certificate will still be refused.',
    );
    webhookCaCache = null;
  }

  return webhookCaCache;
}

/**
 * Validate ONE URL — protocol allowlist, raw blocked IP, decimal-IP notation —
 * and resolve it to the single IP the connection will be pinned to.
 *
 * This is the whole guard for one hop. It is a function of its own because a
 * REDIRECT is a new hop to a new URL, and a hop that is not put through this is
 * not guarded at all (FollowBleed, below).
 *
 * @param {string} rawUrl
 * @returns {Promise<{parsed: URL, resolvedIp: string}>}
 */
async function validateAndResolve(rawUrl) {
  // Step 1 — parse and protocol allowlist
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('SSRF_GUARD: Invalid URL');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`SSRF_GUARD: Protocol not allowed: ${parsed.protocol}`);
  }

  const hostname = parsed.hostname;

  // Step 2 — reject raw private IPs directly in the URL
  // (resolveAndPin also checks, but doing it here gives a clearer error
  //  before we even attempt DNS). IPv6 literals arrive bracketed from
  //  URL.hostname, so strip brackets before the net.isIP() check.
  const cleanHost = hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(cleanHost) && isIpBlocked(cleanHost)) {
    throw new Error(`SSRF_GUARD: Blocked IP in URL: ${cleanHost}`);
  }

  // Step 3 — detect decimal integer IP notation, e.g. http://2130706433
  // (dns.lookup below can also decode this via getaddrinfo, but an explicit,
  //  deterministic reject here does not depend on resolver behaviour)
  if (/^\d+$/.test(hostname)) {
    const num = parseInt(hostname, 10);
    if (num >= 0 && num <= 0xffffffff) {
      const decoded = [
        (num >>> 24) & 0xff,
        (num >>> 16) & 0xff,
        (num >>> 8)  & 0xff,
        num          & 0xff,
      ].join('.');
      if (isIpBlocked(decoded)) {
        throw new Error(
          `SSRF_GUARD: Decimal IP ${hostname} decodes to blocked ${decoded}`,
        );
      }
    }
  }

  // Step 4 & 5 — resolve DNS once and pin the connection
  const resolvedIp = await resolveAndPin(hostname);

  console.info(`SSRF_GUARD: ${hostname} resolved and pinned to ${resolvedIp}`);

  return { parsed, resolvedIp };
}

/**
 * Send one request to an already-validated URL, pinned to an already-validated
 * IP, and resolve with the raw Node response. The caller decides whether to
 * read the body or to follow a redirect.
 *
 * By setting hostname = resolvedIp we bypass the OS resolver entirely; no
 * second DNS lookup can ever occur (rebinding window = 0). The original
 * hostname is preserved in the Host header and as the TLS servername (SNI) so
 * virtual-hosting and certificate validation work.
 */
function requestOnce(parsed, resolvedIp, options) {
  return new Promise((resolve, reject) => {
    const isHttps = parsed.protocol === 'https:';
    const transport = isHttps ? https : http;
    const hostname = parsed.hostname;
    const port = parsed.port
      ? parseInt(parsed.port, 10)
      : (isHttps ? 443 : 80);

    const reqOptions = {
      method:   options.method   || 'GET',
      hostname: resolvedIp,                   // dial the pinned IP — no DNS
      port,
      path:     parsed.pathname + parsed.search,
      headers:  Object.assign({}, options.headers, {
        Host: parsed.host,                    // original Host header
      }),
    };

    if (isHttps) {
      // servername drives TLS SNI → certificate validates against the real host
      reqOptions.servername = hostname;

      // #6553: an outgoing webhook to a server with a self-signed certificate (an
      // internal Mattermost, a company CA) failed at the handshake with no way
      // around it.
      //
      // The answer is NOT to switch verification off. WEBHOOK_TLS_CA_CERT names
      // the certificate - or the CA - that WeKan should TRUST for these requests:
      // verification stays on, the chain is checked as always, and what changes is
      // only who counts as an issuer. A self-signed certificate is its own issuer,
      // so putting that certificate here is exactly what makes it valid.
      //
      // `rejectUnauthorized: false` was the first attempt and is gone: it accepts
      // ANY certificate, including one a man in the middle presents, which is the
      // attack the handshake exists to stop (CodeQL
      // js/disabling-certificate-validation, alert #430).
      const ca = webhookCaCert();
      if (ca) {
        reqOptions.ca = ca;
      }
    }

    const req = transport.request(reqOptions, (res) => {
      // The caller reads the body a microtask later (or destroys the response
      // and follows a redirect). Hold onto an error that arrives in between so
      // it is neither unhandled nor lost.
      res.once('error', (err) => {
        res.ssrfGuardEarlyError = err;
      });
      resolve(res);
    });

    req.on('error', reject);

    const timeoutMs = Number.isFinite(options.timeoutMs)
      ? Math.max(1000, Math.min(options.timeoutMs, 300000))
      : 30000;
    if (typeof req.setTimeout === 'function') {
      req.setTimeout(timeoutMs, () => {
        req.destroy(new Error(`outbound request timed out after ${timeoutMs}ms`));
      });
    }

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Read a response to the end and wrap it in the small WHATWG-fetch-shaped
// object callers expect. `ok` and `arrayBuffer()` are here so a caller that
// downloads a binary body (avatar localization, Trello attachment import) can
// use fetchSafe as a drop-in. `headers` stays the Node lowercased-object form
// (res.headers['content-type']) and also answers headers.get('content-type'),
// so code written against either shape works unchanged.
function readResponse(res, options = {}) {
  return new Promise((resolve, reject) => {
    if (res.ssrfGuardEarlyError) {
      reject(res.ssrfGuardEarlyError);
      return;
    }
    const chunks = [];
    const maxBytes = Number.isFinite(options.maxResponseBytes)
      ? Math.max(1024, Math.min(options.maxResponseBytes, 1024 * 1024 * 1024))
      : 10 * 1024 * 1024;
    let bytes = 0;
    res.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        res.destroy(new Error(`outbound response exceeds ${maxBytes} bytes`));
        return;
      }
      chunks.push(chunk);
    });
    res.on('error', reject);
    res.on('end', () => {
      const body = Buffer.concat(chunks);
      const headers = Object.assign({}, res.headers);
      Object.defineProperty(headers, 'get', {
        enumerable: false,
        value: name => {
          const value = headers[String(name).toLowerCase()];
          return value === undefined ? null : value;
        },
      });
      resolve({
        status: res.statusCode,
        ok: res.statusCode >= 200 && res.statusCode < 300,
        headers,
        json: () => {
          try {
            return Promise.resolve(JSON.parse(body.toString('utf8')));
          } catch (e) {
            return Promise.reject(e);
          }
        },
        text: () => Promise.resolve(body.toString('utf8')),
        arrayBuffer: () => Promise.resolve(
          body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
        ),
      });
    });
  });
}

/**
 * Drop-in replacement for `fetch` with full SSRF + DNS-rebinding protection.
 *
 * Every hop — the URL the caller passed AND every URL a redirect points at — is
 * put through validateAndResolve() before a packet is sent to it, so the guard
 * cannot be walked around by an answer instead of a request.
 *
 * `options.maxRedirects` (default 0) is how many redirects a caller is willing
 * to follow. 0 keeps the original behaviour: any 3xx is refused outright, which
 * is what an outgoing webhook and an avatar download want, because a legitimate
 * one never redirects. A caller that MUST follow redirects to work at all — the
 * live Trello import, whose attachment URLs 302 to signed S3 URLs — passes a
 * small number, and each hop is validated exactly like the first.
 *
 * @param {string} rawUrl           User-supplied URL
 * @param {RequestInit} [options]   Standard fetch options, plus maxRedirects
 * @returns {Promise<Response>}
 */
export async function fetchSafe(rawUrl, options = {}) {
  const maxRedirects = Number.isInteger(options.maxRedirects)
    ? Math.max(0, options.maxRedirects)
    : 0;

  let currentUrl = rawUrl;
  let currentOptions = Object.assign({}, options, {
    headers: Object.assign({}, options.headers),
  });
  let origin = null;

  for (let hop = 0; ; hop += 1) {
    const { parsed, resolvedIp } = await validateAndResolve(currentUrl);
    if (origin === null) {
      origin = parsed.origin;
    }

    const res = await requestOnce(parsed, resolvedIp, currentOptions);

    const isRedirect = res.statusCode >= 300 && res.statusCode < 400;
    if (!isRedirect) {
      return readResponse(res, currentOptions);
    }

    // A redirect is never followed silently.
    res.destroy();
    if (maxRedirects === 0) {
      throw new Error('SSRF_GUARD: Redirects are not allowed');
    }
    if (hop >= maxRedirects) {
      throw new Error(`SSRF_GUARD: Too many redirects (limit ${maxRedirects})`);
    }
    const location = res.headers && res.headers.location;
    if (!location) {
      throw new Error('SSRF_GUARD: Redirect without a Location header');
    }

    // Resolve a relative Location against the URL that answered, then loop:
    // the next pass re-validates protocol, IP and DNS for the new URL.
    let next;
    try {
      next = new URL(location, parsed.href).href;
    } catch {
      throw new Error('SSRF_GUARD: Invalid redirect Location');
    }

    const nextOrigin = new URL(next).origin;
    const headers = Object.assign({}, currentOptions.headers);
    if (nextOrigin !== origin) {
      // Credentials belong to the host they were issued for. Following a
      // cross-origin redirect with them attached hands them to whoever the
      // redirect names — which is the attacker, when the redirect is the
      // attack. Native fetch drops them here too.
      Object.keys(headers).forEach(name => {
        if (/^(authorization|cookie|proxy-authorization)$/i.test(name)) {
          delete headers[name];
        }
      });
      origin = nextOrigin;
    }

    // 303, and 301/302 on a non-GET/HEAD, continue as a bodyless GET; 307/308
    // keep the method and body. This is what RFC 9110 and every HTTP client do.
    const method = (currentOptions.method || 'GET').toUpperCase();
    const downgrade =
      res.statusCode === 303 ||
      ((res.statusCode === 301 || res.statusCode === 302) &&
        method !== 'GET' && method !== 'HEAD');

    currentOptions = Object.assign({}, currentOptions, { headers });
    if (downgrade) {
      currentOptions.method = 'GET';
      delete currentOptions.body;
    }
    currentUrl = next;
  }
}
