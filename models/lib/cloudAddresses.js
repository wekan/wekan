'use strict';

// Cloud Panel (docs/Features/Admin-Panel/Cloud-Panel.md): Admin Panel / Cloud /
// Allowed addresses - the IPv4 and IPv6 addresses, and CIDR ranges of them,
// from which a Cloud Admin may sign in as a Cloud Admin. An empty list is any
// address.
//
// Pure - no Meteor, no node:net - so the same rules run in the browser (the
// lockout warning before saving) and on the server (the login refusal), and
// tests/cloudAddresses.test.cjs reads them as data.

const MAX_ENTRIES = 200;

function fail(message) { throw new Error(message); }

// "203.0.113.7" -> 32-bit BigInt, or null.
function parseIpv4(text) {
  const parts = text.split('.');
  if (parts.length !== 4) return null;
  let value = 0n;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part) || (part.length > 1 && part[0] === '0')) return null;
    const n = Number(part);
    if (n > 255) return null;
    value = (value << 8n) | BigInt(n);
  }
  return value;
}

// "2001:db8::1" (also "::ffff:203.0.113.7") -> 128-bit BigInt, or null.
function parseIpv6(text) {
  if (!/^[0-9a-f:.]+$/i.test(text) || !text.includes(':')) return null;
  const halves = text.split('::');
  if (halves.length > 2) return null;
  const groupsOf = half => (half === '' ? [] : half.split(':'));
  const head = groupsOf(halves[0]);
  const tail = halves.length === 2 ? groupsOf(halves[1]) : [];
  // An IPv4 address may close it, standing for the last two groups.
  const closing = halves.length === 2 ? tail : head;
  let v4 = null;
  if (closing.length && closing[closing.length - 1].includes('.')) {
    v4 = parseIpv4(closing.pop());
    if (v4 === null) return null;
  }
  const explicit = head.length + tail.length + (v4 === null ? 0 : 2);
  if (halves.length === 2 ? explicit > 7 : explicit !== 8) return null;
  const zeros = halves.length === 2 ? 8 - explicit : 0;
  const words = [];
  for (const g of [...head, ...Array(zeros).fill('0'), ...tail]) {
    if (!/^[0-9a-f]{1,4}$/i.test(g)) return null;
    words.push(BigInt(parseInt(g, 16)));
  }
  if (v4 !== null) words.push(v4 >> 16n, v4 & 0xffffn);
  if (words.length !== 8) return null;
  return words.reduce((acc, w) => (acc << 16n) | w, 0n);
}

/**
 * An address as the server sees it: IPv4, IPv6, an IPv6 in brackets or with a
 * zone, and an IPv4-mapped IPv6 ("::ffff:203.0.113.7", how a dual-stack socket
 * reports an IPv4 client) - which is the IPv4 address it carries, so a list of
 * IPv4 addresses works whichever way the socket listens.
 * Returns { version: 4 | 6, value: BigInt } or null.
 */
function parseAddress(value) {
  if (typeof value !== 'string') return null;
  let text = value.trim();
  if (text.startsWith('[') && text.endsWith(']')) text = text.slice(1, -1);
  text = text.split('%')[0];
  if (!text || text.length > 64) return null;
  const v4 = parseIpv4(text);
  if (v4 !== null) return { version: 4, value: v4 };
  const v6 = parseIpv6(text);
  if (v6 === null) return null;
  if ((v6 >> 32n) === 0xffffn) return { version: 4, value: v6 & 0xffffffffn };
  return { version: 6, value: v6 };
}

function formatAddress({ version, value }) {
  if (version === 4) return [24n, 16n, 8n, 0n].map(s => String((value >> s) & 255n)).join('.');
  const words = [];
  for (let i = 7; i >= 0; i -= 1) words.push(((value >> BigInt(i * 16)) & 0xffffn).toString(16));
  // The longest run of two or more zero groups becomes "::" (RFC 5952).
  let best = -1; let bestLen = 1;
  for (let i = 0; i < 8;) {
    if (words[i] !== '0') { i += 1; continue; }
    let j = i;
    while (j < 8 && words[j] === '0') j += 1;
    if (j - i > bestLen) { best = i; bestLen = j - i; }
    i = j;
  }
  if (best === -1) return words.join(':');
  return `${words.slice(0, best).join(':')}::${words.slice(best + bestLen).join(':')}`;
}

/**
 * One entry of the list: an address or a CIDR range. A range is kept with
 * its host bits cleared, so "203.0.113.7/24" is saved as "203.0.113.0/24" and
 * reads as what it allows. Returns { version, value, bits, text } or throws.
 */
function parseEntry(entry) {
  const text = String(entry || '').trim();
  const [addressPart, prefix, extra] = text.split('/');
  if (extra !== undefined) fail(`Not an address or a range: ${text}`);
  const address = parseAddress(addressPart);
  if (!address || (address.version === 4 && addressPart.includes(':') && prefix !== undefined)) {
    fail(`Not an address or a range: ${text}`);
  }
  const max = address.version === 4 ? 32 : 128;
  let bits = max;
  if (prefix !== undefined) {
    if (!/^\d{1,3}$/.test(prefix) || Number(prefix) > max) fail(`Not an address or a range: ${text}`);
    bits = Number(prefix);
  }
  const mask = bits === 0 ? 0n : (((1n << BigInt(bits)) - 1n) << BigInt(max - bits));
  const value = address.value & mask;
  const shown = formatAddress({ version: address.version, value });
  return { version: address.version, value, bits, mask, text: bits === max ? shown : `${shown}/${bits}` };
}

/**
 * The list as the Cloud Admin typed it - one per line, or separated by commas
 * or spaces - as canonical entries without duplicates. Throws on the first
 * entry that is not an address or a range.
 */
function normalizeAllowedAddresses(value) {
  if (value === undefined || value === null || value === '') return [];
  const raw = Array.isArray(value) ? value : String(value).split(/[\s,;]+/);
  if (raw.some(v => typeof v !== 'string' && typeof v !== 'number')) fail('Expected addresses');
  const out = [];
  for (const item of raw.map(v => String(v).trim()).filter(Boolean)) {
    const { text } = parseEntry(item);
    if (!out.includes(text)) out.push(text);
  }
  if (out.length > MAX_ENTRIES) fail(`At most ${MAX_ENTRIES} addresses`);
  return out;
}

/**
 * May a Cloud Admin sign in from this address? Always, when the list is
 * empty. Otherwise only when the address is one of the entries or inside one
 * of the ranges - and never when the address cannot be read, which is a
 * refusal, not an exception.
 */
function addressAllowed(address, list) {
  const entries = Array.isArray(list) ? list.filter(e => typeof e === 'string' && e.trim()) : [];
  if (!entries.length) return true;
  const parsed = parseAddress(address);
  if (!parsed) return false;
  return entries.some(entry => {
    let range;
    try { range = parseEntry(entry); } catch (e) { return false; }
    return range.version === parsed.version && (parsed.value & range.mask) === range.value;
  });
}

module.exports = { MAX_ENTRIES, parseAddress, formatAddress, parseEntry, normalizeAllowedAddresses, addressAllowed };
