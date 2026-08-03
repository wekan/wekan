import { Meteor } from 'meteor/meteor';

let dnsPromises;
let netModule;

if (Meteor.isServer) {
  dnsPromises = require('dns').promises;
  netModule = require('net');
}

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
  '0',
  '0.0.0.0',
]);

const IPV4_RANGES = [
  ['0.0.0.0', '0.255.255.255'],
  ['10.0.0.0', '10.255.255.255'],
  ['100.64.0.0', '100.127.255.255'],
  ['127.0.0.0', '127.255.255.255'],
  ['169.254.0.0', '169.254.255.255'],
  ['172.16.0.0', '172.31.255.255'],
  ['192.0.0.0', '192.0.0.255'],
  ['192.0.2.0', '192.0.2.255'],
  ['192.168.0.0', '192.168.255.255'],
  ['198.18.0.0', '198.19.255.255'],
  ['198.51.100.0', '198.51.100.255'],
  ['203.0.113.0', '203.0.113.255'],
  ['224.0.0.0', '239.255.255.255'],
  ['240.0.0.0', '255.255.255.255'],
].map(([start, end]) => ({
  start: ipv4ToInt(start),
  end: ipv4ToInt(end),
}));

function ipv4ToInt(ip) {
  const parts = ip.split('.').map(part => parseInt(part, 10));
  if (parts.length !== 4 || parts.some(part => Number.isNaN(part))) {
    return null;
  }
  return parts.reduce((acc, part) => (acc << 8) + part, 0) >>> 0;
}

function isIpv4Blocked(ip) {
  const value = ipv4ToInt(ip);
  if (value === null) {
    return true;
  }
  return IPV4_RANGES.some(range => value >= range.start && value <= range.end);
}

// ─── IPv6 ────────────────────────────────────────────────────────────────────
//
// TransitBleed (GHSA-c5xr-mg26-vq5w, reported by tonghuaroot): the previous
// implementation classified an IPv6 address by looking at its SPELLING — a
// `startsWith('::ffff:')` for IPv4-mapped, `startsWith('2001:db8')`, and the
// first hextet parsed out of the string for fc00::/7, fe80::/10 and ff00::/8.
// Every notation that carries an IPv4 destination somewhere OTHER than a literal
// `::ffff:` prefix therefore passed straight through, and the transition
// mechanisms exist precisely to carry one:
//
//   http://[2002:a9fe:a9fe::]/    6to4 (RFC 3056)  → 169.254.169.254
//   http://[64:ff9b::c0a8:101]/   NAT64 (RFC 6052) → 192.168.1.1
//   http://[2001:0:...]/          Teredo (RFC 4380), IPv4 as the complement
//                                 of the low 32 bits
//
// On a host with a 6to4 relay or a NAT64 gateway — normal in cloud and
// Kubernetes networks — the packet really does arrive at the embedded IPv4
// address, so those URLs read internal services and cloud metadata through the
// guard that exists to stop exactly that. Even a plain IPv4-mapped address
// written out in full, `0:0:0:0:0:ffff:7f00:1`, missed the string check.
//
// The address is now EXPANDED to its 16 bytes once and every check reads those
// bytes, so notation cannot change the answer, and every form that embeds an
// IPv4 address has it extracted and re-checked with isIpv4Blocked: if the
// embedded IPv4 is blocked, its IPv6 spelling is blocked too. Unparseable input
// is blocked (fail closed), as before.

// Expand any IPv6 notation — `::` compression, a trailing dotted-quad, an
// interface zone — into 16 bytes. Returns null when the input is not an IPv6
// address, which every caller treats as blocked.
function ipv6ToBytes(ip) {
  let text = String(ip).split('%')[0].toLowerCase();

  // A trailing dotted-quad ("::ffff:127.0.0.1") IS the low 32 bits; rewrite it
  // as two hextets so the rest of the parser only ever sees hex groups.
  if (text.includes('.')) {
    const lastColon = text.lastIndexOf(':');
    if (lastColon < 0) {
      return null;
    }
    const quad = text.slice(lastColon + 1).split('.');
    if (quad.length !== 4) {
      return null;
    }
    const octets = quad.map(part => (/^\d{1,3}$/.test(part) ? parseInt(part, 10) : NaN));
    if (octets.some(octet => Number.isNaN(octet) || octet > 255)) {
      return null;
    }
    text =
      `${text.slice(0, lastColon + 1)}` +
      `${((octets[0] << 8) | octets[1]).toString(16)}:` +
      `${((octets[2] << 8) | octets[3]).toString(16)}`;
  }

  const halves = text.split('::');
  if (halves.length > 2) {
    return null;
  }
  const split = part => (part === '' ? [] : part.split(':'));
  const head = split(halves[0]);
  const tail = halves.length === 2 ? split(halves[1]) : [];
  const missing = 8 - head.length - tail.length;
  const groups =
    halves.length === 2
      ? (missing < 1 ? null : head.concat(new Array(missing).fill('0'), tail))
      : head;
  if (!groups || groups.length !== 8) {
    return null;
  }

  const bytes = [];
  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(group)) {
      return null;
    }
    const value = parseInt(group, 16);
    bytes.push((value >> 8) & 0xff, value & 0xff);
  }
  return bytes;
}

function bytesToIpv4(bytes, offset) {
  return bytes.slice(offset, offset + 4).join('.');
}

// RFC 6052 §2.2 puts the embedded IPv4 at a different place for each NAT64
// prefix length, and byte 8 is always the reserved `u` octet. Used only for a
// NAT64 prefix, where taking every candidate and blocking if ANY of them is
// blocked is the safe reading.
const RFC6052_POSITIONS = [
  [4, 5, 6, 7], // /32
  [5, 6, 7, 9], // /40
  [6, 7, 9, 10], // /48
  [7, 9, 10, 11], // /56
  [9, 10, 11, 12], // /64
  [12, 13, 14, 15], // /96
];

// Every IPv4 address this IPv6 address can deliver a packet to.
function embeddedIpv4Addresses(bytes) {
  const found = [];
  const allZero = (from, to) => bytes.slice(from, to).every(byte => byte === 0);

  // ::ffff:a.b.c.d — IPv4-mapped (RFC 4291), the form the old string check
  // caught only when it was spelled with the `::` compression.
  if (allZero(0, 10) && bytes[10] === 0xff && bytes[11] === 0xff) {
    found.push(bytesToIpv4(bytes, 12));
  }
  // ::a.b.c.d — deprecated IPv4-compatible (RFC 4291); also how `::` and `::1`
  // reach isIpv4Blocked as 0.0.0.0 and 0.0.0.1, both inside 0.0.0.0/8.
  if (allZero(0, 12)) {
    found.push(bytesToIpv4(bytes, 12));
  }
  // ::ffff:0:a.b.c.d — IPv4-translated (RFC 2765).
  if (allZero(0, 8) && bytes[8] === 0xff && bytes[9] === 0xff && allZero(10, 12)) {
    found.push(bytesToIpv4(bytes, 12));
  }
  // 2002::/16 — 6to4 (RFC 3056): the IPv4 address is bytes 2-5.
  if (bytes[0] === 0x20 && bytes[1] === 0x02) {
    found.push(bytesToIpv4(bytes, 2));
  }
  // 64:ff9b::/96 well-known prefix and 64:ff9b:1::/48 local-use prefix — NAT64
  // (RFC 6052, RFC 8215). A conformant well-known-prefix address keeps the
  // IPv4 in the low 32 bits; anything else in 64:ff9b::/32 is checked at every
  // RFC 6052 position, since only the gateway knows which one it uses.
  if (bytes[0] === 0x00 && bytes[1] === 0x64 && bytes[2] === 0xff && bytes[3] === 0x9b) {
    if (allZero(4, 12)) {
      found.push(bytesToIpv4(bytes, 12));
    } else {
      RFC6052_POSITIONS.forEach(position => {
        found.push(position.map(index => bytes[index]).join('.'));
      });
    }
  }
  // 2001:0000::/32 — Teredo (RFC 4380): bytes 4-7 are the Teredo server and the
  // low 32 bits are the client's IPv4 address, stored as its complement.
  if (bytes[0] === 0x20 && bytes[1] === 0x01 && bytes[2] === 0x00 && bytes[3] === 0x00) {
    found.push(bytesToIpv4(bytes, 4));
    found.push([12, 13, 14, 15].map(index => (~bytes[index]) & 0xff).join('.'));
  }
  // ISATAP (RFC 5214): the interface identifier 0:5efe / 200:5efe carries the
  // IPv4 address under ANY routing prefix, not just the link-local one.
  if (
    (bytes[8] === 0x00 || bytes[8] === 0x02) &&
    bytes[9] === 0x00 &&
    bytes[10] === 0x5e &&
    bytes[11] === 0xfe
  ) {
    found.push(bytesToIpv4(bytes, 12));
  }

  return found;
}

function isIpv6Blocked(ip) {
  const bytes = ipv6ToBytes(ip);
  if (!bytes) {
    return true;
  }

  // A packet that ends up at a blocked IPv4 address is blocked however it is
  // addressed. This also covers :: and ::1 (0.0.0.0/8).
  if (embeddedIpv4Addresses(bytes).some(address => isIpv4Blocked(address))) {
    return true;
  }

  // 2001:db8::/32 documentation
  if (bytes[0] === 0x20 && bytes[1] === 0x01 && bytes[2] === 0x0d && bytes[3] === 0xb8) {
    return true;
  }
  // fc00::/7 unique-local
  if (bytes[0] === 0xfc || bytes[0] === 0xfd) {
    return true;
  }
  // fe80::/10 link-local, and the deprecated fec0::/10 site-local
  if (bytes[0] === 0xfe && (bytes[1] & 0xc0) === 0x80) {
    return true;
  }
  if (bytes[0] === 0xfe && (bytes[1] & 0xc0) === 0xc0) {
    return true;
  }
  // ff00::/8 multicast
  if (bytes[0] === 0xff) {
    return true;
  }
  return false;
}

export function isIpBlocked(ip) {
  if (!netModule) {
    return false;
  }
  const version = netModule.isIP(ip);
  if (version === 4) {
    return isIpv4Blocked(ip);
  }
  if (version === 6) {
    return isIpv6Blocked(ip);
  }
  return true;
}

async function resolveHostname(hostname) {
  if (!dnsPromises) {
    return [];
  }
  try {
    const results = await dnsPromises.lookup(hostname, { all: true });
    if (Array.isArray(results)) {
      return results.map(result => result.address);
    }
    if (results && results.address) {
      return [results.address];
    }
    return [];
  } catch (error) {
    return null;
  }
}

export async function validateAttachmentUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') {
    return { valid: false, reason: 'Empty URL' };
  }

  let parsed;
  try {
    parsed = new URL(urlString);
  } catch (error) {
    return { valid: false, reason: 'Invalid URL format' };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { valid: false, reason: 'Only HTTP and HTTPS protocols are allowed' };
  }

  const hostname = parsed.hostname;
  if (!hostname) {
    return { valid: false, reason: 'Missing hostname' };
  }

  const lowerHostname = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(lowerHostname) || lowerHostname.endsWith('.localhost')) {
    return { valid: false, reason: 'Localhost is not allowed' };
  }

  if (!Meteor.isServer || !netModule) {
    return { valid: true };
  }

  if (netModule.isIP(lowerHostname)) {
    return isIpBlocked(lowerHostname)
      ? { valid: false, reason: 'IP address is not allowed' }
      : { valid: true };
  }

  const addresses = await resolveHostname(lowerHostname);
  if (!addresses || addresses.length === 0) {
    return { valid: false, reason: 'Hostname did not resolve' };
  }

  const blockedAddress = addresses.find(address => isIpBlocked(address));
  if (blockedAddress) {
    return { valid: false, reason: 'Resolved IP address is not allowed' };
  }

  return { valid: true };
}
