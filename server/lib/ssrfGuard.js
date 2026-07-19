/**
 * server/lib/ssrfGuard.js — SSRF + DNS-Rebinding hardened fetch
 *
 * Prevents Server-Side Request Forgery by:
 *   1. Blocking private / loopback IP ranges in the URL string.
 *   2. Resolving the hostname exactly once and validating every returned IP.
 *   3. Pinning the TCP connection to the resolved IP — no second DNS lookup
 *      can occur, eliminating the DNS-rebinding window entirely.
 *   4. Blocking all HTTP redirects (a redirect could point to internal IPs).
 *
 * Uses only Node.js built-in modules (http, https, dns, net) so there is no
 * external-package version dependency.
 *
 * Usage:
 *   import { fetchSafe } from '/server/lib/ssrfGuard';
 *   const response = await fetchSafe(url, { method: 'POST', body: '…' });
 */

import dns from 'dns';
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

/**
 * Drop-in replacement for `fetch` with full SSRF + DNS-rebinding protection.
 *
 * Protection flow:
 *   1. Parse the URL; reject invalid or non-HTTP(S) protocols.
 *   2. Reject raw private / loopback IPs supplied directly in the URL.
 *   3. Detect decimal / octal / hex integer IP notation, e.g. http://2130706433
 *   4. Resolve the hostname once, reject blocked resolved IPs.
 *   5. Pin the TCP connection to the resolved IP (zero rebinding window).
 *   6. Block all redirects — a redirect could silently point to 127.0.0.1.
 *
 * @param {string} rawUrl           User-supplied URL
 * @param {RequestInit} [options]   Standard fetch options (method, headers, body…)
 * @returns {Promise<Response>}
 */
export async function fetchSafe(rawUrl, options = {}) {
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

  // Step 6 — make the request via Node.js built-in http/https.
  // By setting hostname = resolvedIp we bypass the OS resolver entirely;
  // no second DNS lookup can ever occur (rebinding window = 0).
  // The original hostname is preserved in the Host header and as the TLS
  // servername (SNI) so virtual-hosting and certificate validation work.
  return new Promise((resolve, reject) => {
    const isHttps = parsed.protocol === 'https:';
    const transport = isHttps ? https : http;
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
    }

    const req = transport.request(reqOptions, (res) => {
      // Block all redirects — they could silently point to internal IPs
      if (res.statusCode >= 300 && res.statusCode < 400) {
        res.destroy();
        reject(new Error('SSRF_GUARD: Redirects are not allowed'));
        return;
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        resolve({
          status: res.statusCode,
          // `ok` and `arrayBuffer()` mirror the WHATWG fetch Response so callers
          // that download binary bodies (avatar localization, Trello attachment
          // import) can use fetchSafe as a drop-in. `headers` stays the Node
          // lowercased-object form (read as res.headers['content-type']).
          ok: res.statusCode >= 200 && res.statusCode < 300,
          headers: res.headers,
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
      res.on('error', reject);
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}
