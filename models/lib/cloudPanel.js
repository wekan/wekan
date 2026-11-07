// The Cloud Panel - many WeKan domains from one Weddy binary
// (docs/Platforms/FOSS/Weddy/Cloud-Panel.md). The pure rules, shared by the client,
// which draws the menu and the panel, and the server, which asks them again and is
// the one that counts. No database, no DOM: tests/cloudPanel.test.cjs runs them.
//
// Weddy (wekan/caddy-wekan-plugin) runs a WeKan for every domain. The FIRST domain's
// WeKan gets WEDDY_CLOUD_DIR: it has Admin Panel / People / Cloud, where an admin
// names the Cloud Panel Domain and the SuperAdmin, and on the Cloud Panel Domain the
// SuperAdmin gets the Cloud Panel - the Domains table and the CloudFlare API key,
// written to WEDDY_CLOUD_DIR for Weddy. Every customer's WeKan gets
// WEDDY_TENANT=true and shows none of it.

// The Cloud feature exists in this WeKan: Weddy's first domain, not a customer's.
export function cloudEnabled(env) {
  return !!(env && env.WEDDY_CLOUD_DIR) && String(env.WEDDY_TENANT || '').toLowerCase() !== 'true';
}

// A host or domain as a lower-case name without port or final dot.
export function normalizeHost(host) {
  let h = String(host || '').trim().toLowerCase();
  const scheme = h.indexOf('://');
  if (scheme !== -1) h = h.slice(scheme + 3);
  h = h.split('/')[0];
  if (!h.startsWith('[')) h = h.split(':')[0];
  while (h.endsWith('.')) h = h.slice(0, -1);
  return h;
}

// The same rule as Weddy's ValidDomain: the name also becomes a directory name, so
// lower-case labels of letters, digits and hyphens only, at least two of them.
const HOSTNAME = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{0,62}$/;
export function validDomain(name) {
  return typeof name === 'string' && name.length <= 253 && HOSTNAME.test(name);
}

// The SuperAdmin: the user whose username - or one of whose e-mail addresses - is
// the SuperAdmin Username, compared without case. Nobody when it is empty.
export function isSuperAdmin(user, superAdminUsername) {
  const want = String(superAdminUsername || '').trim().toLowerCase();
  if (!want || !user) return false;
  if (String(user.username || '').trim().toLowerCase() === want) return true;
  return (user.emails || []).some(e => String((e && e.address) || '').trim().toLowerCase() === want);
}

// The Cloud Panel is shown, and its methods answer, only to the SuperAdmin, and only
// on the Cloud Panel Domain.
export function cloudPanelAllowed({ env, user, superAdminUsername, cloudPanelDomain, host }) {
  const panel = normalizeHost(cloudPanelDomain);
  return cloudEnabled(env) && validDomain(panel) && normalizeHost(host) === panel &&
    isSuperAdmin(user, superAdminUsername);
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validDate(s) {
  if (!DATE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export const DOMAIN_FIELDS = ['domain', 'customerName', 'customerEmail', 'billingEmail', 'startDate', 'endDate'];

// A Domains table row as it is stored, or { error } naming the field that is wrong.
// Dates are YYYY-MM-DD: the first and the last day of the paid hosting year.
export function cleanDomainRow(row) {
  const r = {};
  for (const f of DOMAIN_FIELDS) r[f] = String((row && row[f]) || '').trim();
  r.domain = normalizeHost(r.domain);
  if (!validDomain(r.domain)) return { error: 'domain' };
  for (const f of ['customerEmail', 'billingEmail']) {
    if (r[f] && !EMAIL.test(r[f])) return { error: f };
  }
  for (const f of ['startDate', 'endDate']) {
    if (r[f] && !validDate(r[f])) return { error: f };
  }
  if (r.startDate && r.endDate && r.endDate < r.startDate) return { error: 'endDate' };
  if (r.customerName.length > 200) return { error: 'customerName' };
  return { row: r };
}

// <WEDDY_CLOUD_DIR>/domains.json, as Weddy reads it.
export function domainsFile(cloudPanelDomain, rows) {
  return {
    cloudPanelDomain: normalizeHost(cloudPanelDomain),
    domains: (rows || []).map(r => {
      const out = {};
      for (const f of DOMAIN_FIELDS) if (r[f]) out[f] = r[f];
      return out;
    }).sort((a, b) => a.domain.localeCompare(b.domain)),
  };
}
