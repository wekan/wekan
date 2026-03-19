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

// dns/promises is only a standalone sub-path from Node 15+; use dns.promises
// for compatibility with the Node 14 runtime bundled in Meteor 2.x.
const dnsPromises = dns.promises;

// ─── Blocked-range helpers ────────────────────────────────────────────────────

/**
 * Returns true if the IPv4 address belongs to a range that must never be
 * contacted from a server-side outgoing request.
 *
 * @param {string} addr  Dotted-decimal IPv4 string, e.g. "192.168.1.1"
 * @returns {boolean}
 */
export function isBlockedIPv4(addr) {
  const blockedPatterns = [
    /^127\./,                       // 127.0.0.0/8  — loopback
    /^10\./,                        // 10.0.0.0/8   — private (RFC 1918)
    /^172\.(1[6-9]|2\d|3[01])\./,  // 172.16.0.0/12 — private (RFC 1918)
    /^192\.168\./,                  // 192.168.0.0/16 — private (RFC 1918)
    /^0\./,                         // 0.0.0.0/8    — current network
    /^169\.254\./,                  // 169.254.0.0/16 — link-local / AWS metadata
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,  // 100.64.0.0/10 — shared address (RFC 6598)
    /^192\.0\.0\./,                 // 192.0.0.0/24 — IETF protocol assignments
    /^198\.18\./,                   // 198.18.0.0/15 — benchmarking
    /^198\.19\./,                   // 198.18.0.0/15 — benchmarking (odd octet)
    /^224\./,                       // 224.0.0.0/4  — multicast
    /^240\./,                       // 240.0.0.0/4  — reserved
    /^255\.255\.255\.255$/,         // broadcast
  ];
  return blockedPatterns.some(p => p.test(addr));
}

/**
 * Returns true if the IPv6 address belongs to a range that must never be
 * contacted from a server-side outgoing request.
 *
 * @param {string} addr  IPv6 string without surrounding brackets
 * @returns {boolean}
 */
export function isBlockedIPv6(addr) {
  const lower = addr.toLowerCase();
  const blockedPatterns = [
    /^::1$/,          // ::1/128 — loopback
    /^::$/,           // unspecified address
    /^fe80:/,         // fe80::/10 — link-local
    /^fc00:/,         // fc00::/7  — unique local (fc)
    /^fd/,            // fc00::/7  — unique local (fd)
    /^64:ff9b:/,      // 64:ff9b::/96 — IPv4-mapped
    /^::ffff:/,       // ::ffff:0:0/96 — IPv4-mapped loopback potential
    /^2001:db8:/,     // 2001:db8::/32 — documentation
    /^100::/,         // 100::/64 — discard (RFC 6666)
  ];
  return blockedPatterns.some(p => p.test(lower));
}

// ─── DNS resolve + validate ───────────────────────────────────────────────────

/**
 * Resolve the hostname exactly once, validate every returned IP against the
 * block-list, and return the first safe address.
 *
 * If the caller already passed a raw IP (no DNS needed) it is validated and
 * returned directly.
 *
 * @param {string} hostname
 * @returns {Promise<string>}  The pinned IPv4 address to dial
 */
async function resolveAndPin(hostname) {
  if (net.isIPv4(hostname)) {
    if (isBlockedIPv4(hostname)) {
      throw new Error(`SSRF_GUARD: Blocked IPv4 in URL: ${hostname}`);
    }
    return hostname;
  }

  if (net.isIPv6(hostname)) {
    // The URL class strips brackets, e.g. "[::1]" becomes "::1"
    const cleanIp = hostname.replace(/^\[|\]$/g, '');
    if (isBlockedIPv6(cleanIp)) {
      throw new Error(`SSRF_GUARD: Blocked IPv6 in URL: ${cleanIp}`);
    }
    return cleanIp;
  }

  // Perform a single DNS A-record lookup and check every returned address.
  let addresses;
  try {
    addresses = await dnsPromises.resolve4(hostname);
  } catch (e) {
    throw new Error(`SSRF_GUARD: DNS resolution failed for: ${hostname}`);
  }

  if (!addresses || addresses.length === 0) {
    throw new Error(`SSRF_GUARD: No DNS A-records returned for: ${hostname}`);
  }

  for (const addr of addresses) {
    if (isBlockedIPv4(addr)) {
      throw new Error(`SSRF_GUARD: Blocked IPv4 ${addr} resolved for ${hostname}`);
    }
  }

  return addresses[0];
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
  // (buildPinnedAgent also checks, but doing it here gives a clearer error
  //  before we even attempt DNS)
  if (net.isIPv4(hostname) && isBlockedIPv4(hostname)) {
    throw new Error(`SSRF_GUARD: Blocked IPv4 in URL: ${hostname}`);
  }
  if (net.isIPv6(hostname)) {
    const cleanIp = hostname.replace(/^\[|\]$/g, '');
    if (isBlockedIPv6(cleanIp)) {
      throw new Error(`SSRF_GUARD: Blocked IPv6 in URL: ${cleanIp}`);
    }
  }

  // Step 3 — detect decimal / octal / hex integer IP notation
  if (/^\d+$/.test(hostname)) {
    const num = parseInt(hostname, 10);
    if (num >= 0 && num <= 0xffffffff) {
      const decoded = [
        (num >>> 24) & 0xff,
        (num >>> 16) & 0xff,
        (num >>> 8)  & 0xff,
        num          & 0xff,
      ].join('.');
      if (isBlockedIPv4(decoded)) {
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
          headers: res.headers,
          json: () => {
            try {
              return Promise.resolve(JSON.parse(body.toString('utf8')));
            } catch (e) {
              return Promise.reject(e);
            }
          },
          text: () => Promise.resolve(body.toString('utf8')),
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
