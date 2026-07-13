'use strict';

// Pure, dependency-light avatar-URL classification and SSRF address checks, split out of
// server/lib/localizeAvatar.js so they can be unit-tested in plain Node (tests/*.test.cjs)
// without a Meteor context. Only Node's `net` builtin is used.

const net = require('net');

// A local, already-WeKan-served avatar: /cdn/storage/avatars/<id> (universal short URL)
// or the legacy CollectionFS /cfs/files/avatars/…, with or without an origin/prefix.
const LOCAL_AVATAR_RE = /\/(?:cdn\/storage\/avatars|cfs\/files\/avatars)\//i;

// True when the URL is NOT already a local WeKan avatar and is something we can copy in:
// an http(s) URL or a self-contained data: URI. Local URLs and anything else → false.
function isExternalAvatarUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (LOCAL_AVATAR_RE.test(url)) return false;
  if (/^data:/i.test(url)) return true;
  return /^https?:\/\//i.test(url);
}

// SSRF guard: true when an IP literal must NOT be fetched (private, loopback, link-local,
// CGNAT, multicast/reserved, cloud metadata 169.254.169.254, unique-local IPv6, …).
function isBlockedIp(ip) {
  if (net.isIPv4(ip)) {
    const p = ip.split('.').map(Number);
    if (p[0] === 10) return true;                                  // 10.0.0.0/8
    if (p[0] === 127) return true;                                 // loopback
    if (p[0] === 0) return true;                                   // 0.0.0.0/8
    if (p[0] === 169 && p[1] === 254) return true;                 // link-local + cloud metadata
    if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true;     // 172.16.0.0/12
    if (p[0] === 192 && p[1] === 168) return true;                 // 192.168.0.0/16
    if (p[0] === 100 && p[1] >= 64 && p[1] <= 127) return true;    // 100.64.0.0/10 CGNAT
    if (p[0] >= 224) return true;                                  // multicast / reserved
    return false;
  }
  if (net.isIPv6(ip)) {
    const s = ip.toLowerCase();
    if (s === '::1' || s === '::') return true;                    // loopback / unspecified
    if (s.startsWith('fe80')) return true;                         // link-local
    if (s.startsWith('fc') || s.startsWith('fd')) return true;     // unique local fc00::/7
    if (s.startsWith('::ffff:')) return isBlockedIp(s.slice(7));   // IPv4-mapped
    return false;
  }
  return true; // not a recognisable IP → be safe and block
}

// Decode a data: URI into { buffer, type }. Throws on a malformed URI.
function decodeDataUri(url) {
  const m = /^data:([^;,]*)(;base64)?,(.*)$/is.exec(url);
  if (!m) throw new Error('invalid data URI');
  const type = m[1] || 'application/octet-stream';
  const buffer = m[2]
    ? Buffer.from(m[3], 'base64')
    : Buffer.from(decodeURIComponent(m[3]), 'utf8');
  return { buffer, type };
}

// Synchronous part of the SSRF guard: reject non-http(s) protocols and IP-literal hosts
// that resolve to a blocked range, plus localhost. Hostname DNS resolution (async) is done
// by the caller in localizeAvatar.js; this returns { ok, reason, needsDnsCheck, host }.
function checkUrlHostSync(url) {
  let u;
  try { u = new URL(url); } catch { return { ok: false, reason: 'invalid URL' }; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return { ok: false, reason: `blocked protocol ${u.protocol}` };
  }
  const host = u.hostname.replace(/^\[|\]$/g, ''); // strip IPv6 brackets
  if (net.isIP(host)) {
    return isBlockedIp(host)
      ? { ok: false, reason: `blocked address ${host}` }
      : { ok: true, needsDnsCheck: false, host };
  }
  if (host === 'localhost' || host.endsWith('.localhost')) {
    return { ok: false, reason: 'blocked host localhost' };
  }
  return { ok: true, needsDnsCheck: true, host };
}

module.exports = {
  LOCAL_AVATAR_RE,
  isExternalAvatarUrl,
  isBlockedIp,
  decodeDataUri,
  checkUrlHostSync,
};
