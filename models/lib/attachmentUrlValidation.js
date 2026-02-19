import { Meteor } from 'meteor/meteor';

let dnsModule;
let netModule;
let lookupSync;

if (Meteor.isServer) {
  dnsModule = require('dns');
  netModule = require('net');
  lookupSync = Meteor.wrapAsync(dnsModule.lookup);
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

function isIpv6Blocked(ip) {
  const normalized = ip.split('%')[0].toLowerCase();
  if (normalized === '::' || normalized === '::1' || /^0(:0){1,7}$/.test(normalized)) {
    return true;
  }
  if (normalized.startsWith('::ffff:')) {
    const ipv4 = normalized.replace('::ffff:', '');
    return isIpv4Blocked(ipv4);
  }
  if (normalized.startsWith('2001:db8')) {
    return true;
  }
  const firstGroupRaw = normalized.split(':')[0];
  const firstGroup = firstGroupRaw === '' ? '0' : firstGroupRaw;
  const firstValue = parseInt(firstGroup, 16);
  if (Number.isNaN(firstValue)) {
    return true;
  }
  if (firstValue >= 0xfc00 && firstValue <= 0xfdff) {
    return true;
  }
  if (firstValue >= 0xfe80 && firstValue <= 0xfebf) {
    return true;
  }
  if (firstValue >= 0xff00) {
    return true;
  }
  return false;
}

function isIpBlocked(ip) {
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

function resolveHostname(hostname) {
  if (!lookupSync) {
    return [];
  }
  try {
    const results = lookupSync(hostname, { all: true });
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

export function validateAttachmentUrl(urlString) {
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

  const addresses = resolveHostname(lowerHostname);
  if (!addresses || addresses.length === 0) {
    return { valid: false, reason: 'Hostname did not resolve' };
  }

  const blockedAddress = addresses.find(address => isIpBlocked(address));
  if (blockedAddress) {
    return { valid: false, reason: 'Resolved IP address is not allowed' };
  }

  return { valid: true };
}
