// Multitenancy, option D of docs/Design/Multitenancy/Multitenancy.md:
// ORGANIZATIONS ARE TENANTS.
//
// One WeKan process serves many domains. An Organization may claim one or more
// hostnames (`org.orgDomains`); the request's host picks the Organization, and that
// Organization's branding replaces the instance branding for that request. Nothing
// is partitioned: boards are still only visible to their members, which is the
// separation option D relies on (and its documented limit - this is SOFT tenancy,
// one database and one user namespace).
//
// Everything here is pure and dependency-free so the decisions can be unit-tested
// without a Meteor/Mongo runtime (tests/tenants.test.cjs). The Meteor glue lives in
// server/lib/tenantResolver.js.
//
// THE HOST IS A SECURITY DECISION. A tenant chosen from a header the client can
// forge is a cross-tenant branding lie, so `requestHost` believes
// `X-Forwarded-Host` ONLY when the deployment says the proxy sets it
// (MULTITENANCY_TRUST_PROXY_HOST=true). Off by default.

// ── hosts ────────────────────────────────────────────────────────────────────

// Normalise one hostname for comparison: trim, lower-case, drop a scheme, a path,
// any userinfo, the port and a trailing root dot. Returns '' when there is nothing
// usable left.
function normalizeHost(host) {
  if (typeof host !== 'string') return '';
  let h = host.trim().toLowerCase();
  if (!h) return '';
  // A whole URL is accepted so an admin may paste "https://a.example.com/".
  const scheme = h.indexOf('://');
  if (scheme !== -1) h = h.slice(scheme + 3);
  const at = h.lastIndexOf('@');
  if (at !== -1) h = h.slice(at + 1);
  const slash = h.indexOf('/');
  if (slash !== -1) h = h.slice(0, slash);
  // IPv6 literals keep their brackets; the port is what follows the closing one.
  if (h.startsWith('[')) {
    const end = h.indexOf(']');
    if (end !== -1) h = h.slice(0, end + 1);
  } else {
    const colon = h.indexOf(':');
    if (colon !== -1) h = h.slice(0, colon);
  }
  while (h.endsWith('.')) h = h.slice(0, -1);
  return h.trim();
}

// An org's `orgDomains` is free text, the way every other org field is: one or more
// hostnames separated by commas, semicolons, whitespace or newlines. Returns the
// normalised, de-duplicated list.
function parseHostList(text) {
  if (Array.isArray(text)) {
    return parseHostList(text.join(','));
  }
  if (typeof text !== 'string') return [];
  const out = [];
  const seen = new Set();
  text.split(/[\s,;]+/).forEach(part => {
    const host = normalizeHost(part);
    if (!host || seen.has(host)) return;
    seen.add(host);
    out.push(host);
  });
  return out;
}

// The hostnames one org claims.
function hostsOfOrg(org) {
  return org ? parseHostList(org.orgDomains) : [];
}

// The host this request is for. `headers` is a plain object (Node's
// `req.headers`, or a DDP connection's `httpHeaders`) - both are lower-cased by
// Node, but a mixed-case key is tolerated here so a caller cannot get it wrong.
//
// X-Forwarded-Host is only believed when the deployment says so: behind Caddy it
// is the honest header, but a client can send it too, and picking a tenant from a
// forged header would hand one customer another customer's branding.
function requestHost(headers, { trustProxy = false } = {}) {
  if (!headers || typeof headers !== 'object') return '';
  const get = name => {
    if (headers[name] !== undefined) return headers[name];
    const key = Object.keys(headers).find(k => k.toLowerCase() === name);
    return key === undefined ? undefined : headers[key];
  };
  const pick = value => {
    if (Array.isArray(value)) return pick(value[0]);
    if (typeof value !== 'string') return '';
    // A proxy chain sends "client, proxy1, proxy2" - the first is the client's.
    return normalizeHost(value.split(',')[0]);
  };
  if (trustProxy) {
    const forwarded = pick(get('x-forwarded-host'));
    if (forwarded) return forwarded;
  }
  return pick(get('host'));
}

// ── which org is this host? ──────────────────────────────────────────────────

// The first ACTIVE org that claims `host`. Inactive orgs are skipped on purpose:
// deactivating an org is how an admin takes a tenant off the air without losing
// its configuration. Returns null when nothing claims the host, which is the
// normal case for the instance's own ROOT_URL.
function findTenantOrg(orgs, host) {
  const wanted = normalizeHost(host);
  if (!wanted || !Array.isArray(orgs)) return null;
  for (const org of orgs) {
    if (!org || org.orgIsActive !== true) continue;
    if (hostsOfOrg(org).includes(wanted)) return org;
  }
  return null;
}

// Hosts claimed by more than one org, as { host: [orgId, …] }. Two orgs claiming
// one host is a configuration mistake that would silently give one of them the
// other's brand, so the save path refuses it and the admin sees which.
function duplicateTenantHosts(orgs) {
  const byHost = new Map();
  (Array.isArray(orgs) ? orgs : []).forEach(org => {
    if (!org) return;
    hostsOfOrg(org).forEach(host => {
      const ids = byHost.get(host) || [];
      if (!ids.includes(org._id)) ids.push(org._id);
      byHost.set(host, ids);
    });
  });
  const out = {};
  byHost.forEach((ids, host) => {
    if (ids.length > 1) out[host] = ids;
  });
  return out;
}

// Would saving `hosts` onto org `orgId` collide with another org? Returns the
// offending hosts (empty array = free to save).
function conflictingHosts(orgs, orgId, hosts) {
  const wanted = new Set(parseHostList(hosts));
  const clashes = [];
  (Array.isArray(orgs) ? orgs : []).forEach(org => {
    if (!org || org._id === orgId) return;
    hostsOfOrg(org).forEach(host => {
      if (wanted.has(host) && !clashes.includes(host)) clashes.push(host);
    });
  });
  return clashes;
}

// ── branding ─────────────────────────────────────────────────────────────────

// Per-org branding reuses the fields the Admin Panel already has (Admin Panel /
// Settings / Visibility): the org document carries an `org`-prefixed copy of each,
// and a non-empty one replaces the instance value for that tenant's requests. No
// new rendering code - the client reads the same `currentSetting` fields it always
// did, and only the published document differs per host.
const BRANDING_FIELDS = [
  { org: 'orgProductName', setting: 'productName' },
  // The site theme, layered between WeKan's default theme and a user's own
  // override (docs/Theme/Theme.md): whoever opens this tenant's host gets this
  // colour unless they picked one of their own. `list: true` marks the companion
  // array of custom colours, which a flat/clear theme uses.
  { org: 'orgThemeColor', setting: 'themeColor' },
  { org: 'orgThemeCustomColors', setting: 'themeCustomColors', list: true },
  { org: 'orgCustomLoginLogoImageUrl', setting: 'customLoginLogoImageUrl' },
  { org: 'orgCustomLoginLogoLinkUrl', setting: 'customLoginLogoLinkUrl' },
  { org: 'orgTextBelowCustomLoginLogo', setting: 'textBelowCustomLoginLogo' },
  { org: 'orgCustomTopLeftCornerLogoImageUrl', setting: 'customTopLeftCornerLogoImageUrl' },
  { org: 'orgCustomTopLeftCornerLogoLinkUrl', setting: 'customTopLeftCornerLogoLinkUrl' },
  { org: 'orgCustomHelpLinkUrl', setting: 'customHelpLinkUrl' },
  { org: 'orgLegalNotice', setting: 'legalNotice' },
];

// The org fields a tenant's branding is written into, for schemas and whitelists.
function brandingOrgFields() {
  return BRANDING_FIELDS.map(f => f.org);
}

// The settings document as this tenant should see it: the instance document with
// every non-empty org branding field written over it. A missing/blank org value
// leaves the instance value alone, so a tenant overrides only what it sets, and no
// tenant means the instance document unchanged.
// Does this org actually set that branding field? A blank string or an empty list
// is "not set", so a tenant overrides only what it really chose.
function brandingValue(org, field) {
  const value = org ? org[field.org] : undefined;
  if (field.list) {
    return Array.isArray(value) && value.length ? value.slice() : undefined;
  }
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function tenantBranding(org, setting) {
  const base = setting && typeof setting === 'object' ? setting : {};
  if (!org) return { ...base };
  const merged = { ...base };
  BRANDING_FIELDS.forEach(field => {
    const value = brandingValue(org, field);
    if (value !== undefined) merged[field.setting] = value;
  });
  return merged;
}

// The overridden fields only, for a client that just wants to know what changed.
function tenantBrandingOverrides(org) {
  const out = {};
  if (!org) return out;
  BRANDING_FIELDS.forEach(field => {
    const value = brandingValue(org, field);
    if (value !== undefined) out[field.setting] = value;
  });
  return out;
}

// ── root URL ─────────────────────────────────────────────────────────────────

// The absolute root URL to answer with for `host`, keeping the scheme (and any
// sub-path) of the instance's own ROOT_URL. Server-side absolute URLs - board
// links, invitation mails - have to be built for the tenant that asked, not for
// the one ROOT_URL the process was started with (problem 3 of the design).
function tenantRootUrl(host, defaultRootUrl) {
  const cleanHost = normalizeHost(host);
  const fallback = typeof defaultRootUrl === 'string' ? defaultRootUrl : '';
  if (!cleanHost) return fallback;
  let scheme = 'https://';
  let suffix = '';
  const match = /^([a-z][a-z0-9+.-]*:\/\/)([^/]*)(\/.*)?$/i.exec(fallback.trim());
  if (match) {
    scheme = match[1].toLowerCase();
    suffix = match[3] || '';
  }
  // A sub-path deployment keeps its sub-path; the trailing slash is kept the way
  // Meteor's own ROOT_URL is written.
  if (suffix && !suffix.endsWith('/')) suffix += '/';
  if (!suffix) suffix = '/';
  return `${scheme}${cleanHost}${suffix}`;
}

// ── environment ──────────────────────────────────────────────────────────────

function isTruthyEnv(value) {
  return typeof value === 'string' && ['true', 'yes', '1', 'on'].includes(value.trim().toLowerCase());
}

// Tenancy is OFF unless the deployment turns it on: an instance that has never
// heard of tenants must keep answering exactly as it does today, whatever is in
// its org documents.
function isTenancyEnabled(env) {
  return isTruthyEnv((env || {}).MULTITENANCY);
}

function trustsProxyHost(env) {
  return isTruthyEnv((env || {}).MULTITENANCY_TRUST_PROXY_HOST);
}

// ESM exports: every app file is an ES module in Meteor, so a `module.exports`
// assignment throws the moment the CLIENT bundle loads it. The .cjs unit tests read
// this file with a dynamic `import()`, the way the other pure modules are tested.
export {
  BRANDING_FIELDS,
  brandingOrgFields,
  brandingValue,
  conflictingHosts,
  duplicateTenantHosts,
  findTenantOrg,
  hostsOfOrg,
  isTenancyEnabled,
  normalizeHost,
  parseHostList,
  requestHost,
  tenantBranding,
  tenantBrandingOverrides,
  tenantRootUrl,
  trustsProxyHost,
};
