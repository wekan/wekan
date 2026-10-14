'use strict';

// Admin Panel / Settings / Global Webhooks / Internal destinations: the hosts
// on WeKan's own network that outgoing webhooks may reach - a Node-RED, a
// chat server or a Matrix hookshot beside WeKan - which the SSRF guard refuses
// otherwise. Empty by default: nothing internal is reachable until a site
// administrator lists it. Only a site administrator can change it, so no board
// member can point a webhook inward. See docs/Features/Webhooks/Proxy.md and
// #2017's how-to. Pure: tests/internalWebhookHosts.test.cjs.

const MAX_HOSTS = 50;
// A host name, an IPv4 address, or a bracketed IPv6 address, optionally with
// a port. Never a scheme, path, user or wildcard: an entry names ONE host.
const HOST = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*|\[[0-9a-f:.]+\])(?::\d{1,5})?$/;

/** The list as stored: one entry per line or comma, lower case, unique, valid only. */
function cleanInternalHosts(input) {
  const items = Array.isArray(input) ? input : String(input || '').split(/[\s,]+/);
  const out = [];
  const rejected = [];
  for (const raw of items) {
    const host = String(raw || '').trim().toLowerCase();
    if (!host) continue;
    if (!HOST.test(host) || (host.includes(':') && !host.startsWith('[') && Number(host.split(':')[1]) > 65535)) {
      rejected.push(String(raw).trim());
      continue;
    }
    if (!out.includes(host)) out.push(host);
  }
  return { hosts: out.slice(0, MAX_HOSTS), rejected };
}

/** Whether a webhook URL names a listed host (host, or host:port as listed). */
function isInternalHostAllowed(url, hosts) {
  if (!Array.isArray(hosts) || !hosts.length) return false;
  let u;
  try { u = new URL(url); } catch (e) { return false; }
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) return false;
  const name = u.hostname.toLowerCase();
  const withPort = u.port ? `${name}:${u.port}` : name;
  // An entry without a port allows the host on any port; with one, only it.
  return hosts.includes(withPort) || hosts.includes(name);
}

module.exports = { MAX_HOSTS, cleanInternalHosts, isInternalHostAllowed };
