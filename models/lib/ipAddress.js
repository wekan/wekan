'use strict';

// Which address family an attempt came from, so every Admin Panel → Problems
// report can show IPv4 and IPv6 in their own columns.
//
// One request arrives from ONE address, so a row has one or the other - never
// both. Two columns rather than one is still the right shape: an admin scanning
// for "the 10.0.0.0/8 range" and one scanning for "everything from that /64" are
// looking for different-shaped things, and a single mixed column makes both
// harder. A row simply leaves the other column empty.
//
// THE TRAP THIS EXISTS FOR is the IPv4-mapped IPv6 address. A dual-stack socket
// reports an IPv4 client as `::ffff:203.0.113.9`, so without unwrapping:
//
//   * the same client counts as two different actors depending on whether it
//     reached a v4 or a dual-stack listener;
//   * it lands in the IPv6 column, where somebody looking for IPv4 will not
//     find it;
//   * and an admin blocking `203.0.113.9` does not match what is recorded.
//
// So a mapped address is unwrapped to the IPv4 it is, and only a genuine IPv6
// address is recorded as one.

// ::ffff:203.0.113.9 and the deprecated ::203.0.113.9 form.
const MAPPED = /^::(?:ffff:)?((?:\d{1,3}\.){3}\d{1,3})$/i;
const IPV4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;

// Everything an IPv4 octet may be. `010` is not 10 here - a leading zero is how
// an address is disguised, and Node does not produce one, so it is not accepted.
function isIpv4(value) {
  if (!IPV4.test(value)) return false;
  return value.split('.').every(part => {
    if (part.length > 1 && part[0] === '0') return false;
    const n = Number(part);
    return n >= 0 && n <= 255;
  });
}

// An IPv6 address as Node writes one: hex groups and colons, optionally with a
// zone (`fe80::1%eth0`) and optionally a trailing IPv4 part. Deliberately not a
// full validator - this classifies what the socket layer produced, and anything
// unrecognised is returned untouched rather than guessed at.
function isIpv6(value) {
  const bare = String(value).split('%')[0];
  return bare.includes(':') && /^[0-9a-f:.]+$/i.test(bare);
}

// Split one address into the two columns.
//   '203.0.113.9'        -> { ipv4: '203.0.113.9', ipv6: '' }
//   '::ffff:203.0.113.9' -> { ipv4: '203.0.113.9', ipv6: '' }   (unwrapped)
//   '2001:db8::1'        -> { ipv4: '',            ipv6: '2001:db8::1' }
//   'unknown' / ''       -> { ipv4: '',            ipv6: '' }
function classifyAddress(address) {
  const value = String(address == null ? '' : address).trim();
  if (!value || value === 'unknown') return { ipv4: '', ipv6: '' };

  const mapped = MAPPED.exec(value);
  if (mapped && isIpv4(mapped[1])) return { ipv4: mapped[1], ipv6: '' };
  if (isIpv4(value)) return { ipv4: value, ipv6: '' };
  if (isIpv6(value)) return { ipv4: '', ipv6: value };
  return { ipv4: '', ipv6: '' };
}

// The address as it should be STORED and counted: a mapped IPv4 becomes the
// IPv4 it is, so one client is one actor however it reached the server.
function normaliseAddress(address) {
  const { ipv4, ipv6 } = classifyAddress(address);
  return ipv4 || ipv6 || (address == null ? '' : String(address));
}

module.exports = { classifyAddress, normaliseAddress, isIpv4, isIpv6 };
