import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import Org from '/models/org';

// Multitenancy option D — the Meteor glue around models/lib/tenants.js
// (docs/Design/Multitenancy/Multitenancy.md, D.2 and D.3).
//
// The DECISIONS all live in the pure module; this file only supplies it with the
// org documents and puts the answer where Meteor can use it:
//   * tenantForHeaders()   — the org an HTTP request or a DDP connection is for;
//   * currentTenantOrg()   — the same, inside a publication or method;
//   * tenantRootUrlFor()   — the per-tenant value for Meteor.absoluteUrl({rootUrl});
//   * a runtime-config hook so the client bundle a tenant host serves points its
//     DDP connection back at that host instead of at the one ROOT_URL.
//
// Everything is inert unless MULTITENANCY=true: an instance that has never heard of
// tenants must answer exactly as it does today, whatever is in its org documents.

import * as tenants from '/models/lib/tenants';

const enabled = () => tenants.isTenancyEnabled(process.env);
const trustProxy = () => tenants.trustsProxyHost(process.env);

// ── the host → org cache ─────────────────────────────────────────────────────
//
// Resolving a tenant happens on EVERY request and on every DDP connection, so it
// must not be a database round trip. The org collection is small and changes
// rarely, so it is cached and refreshed by an observer on the fields that matter.
let tenantOrgs = [];
let observing = false;

// The fields a tenant decision needs: the hosts, the active flag and the branding.
const TENANT_FIELDS = { orgDomains: 1, orgIsActive: 1, orgDisplayName: 1 };
tenants.brandingOrgFields().forEach(field => {
  TENANT_FIELDS[field] = 1;
});

async function refreshTenantOrgs() {
  if (!enabled()) {
    tenantOrgs = [];
    return tenantOrgs;
  }
  try {
    tenantOrgs = await Org.find(
      { orgDomains: { $exists: true, $ne: '' } },
      { fields: TENANT_FIELDS },
    ).fetchAsync();
  } catch (e) {
    // A tenant lookup must never take the server down: an unreachable database is
    // already being reported elsewhere, and answering "no tenant" degrades to the
    // instance's own branding rather than to an error page.
    console.error('[multitenancy] could not read organizations:', e && e.message ? e.message : e);
  }
  return tenantOrgs;
}

async function startObserving() {
  if (observing || !enabled()) return;
  observing = true;
  await refreshTenantOrgs();
  try {
    // Any change to an org may add, move or remove a tenant host, so the cache is
    // rebuilt wholesale - it is a handful of documents.
    const cursor = Org.find({}, { fields: TENANT_FIELDS });
    await cursor.observeChanges({
      added: () => { refreshTenantOrgs(); },
      changed: () => { refreshTenantOrgs(); },
      removed: () => { refreshTenantOrgs(); },
    });
  } catch (e) {
    console.error('[multitenancy] org observer failed, falling back to a one-shot read:', e && e.message ? e.message : e);
  }
}

// ── resolving ────────────────────────────────────────────────────────────────

// The org a set of request headers belongs to, or null. `headers` is Node's
// `req.headers` for HTTP, or `connection.httpHeaders` for DDP - `host` is in the
// whitelist Meteor passes through.
function tenantForHeaders(headers) {
  if (!enabled()) return null;
  const host = tenants.requestHost(headers, { trustProxy: trustProxy() });
  if (!host) return null;
  return tenants.findTenantOrg(tenantOrgs, host);
}

// Inside a publication or a method: `this.connection` carries the headers. A
// server-side call has no connection, and belongs to no tenant.
function tenantForConnection(connection) {
  return connection ? tenantForHeaders(connection.httpHeaders) : null;
}

// The absolute root URL to answer a request with: the tenant's host when there is
// one, the instance's ROOT_URL otherwise. Pass it as
// Meteor.absoluteUrl(path, { rootUrl: tenantRootUrlFor(headers) }).
function tenantRootUrlFor(headers) {
  const rootUrl = process.env.ROOT_URL || '';
  if (!enabled()) return rootUrl;
  const host = tenants.requestHost(headers, { trustProxy: trustProxy() });
  const org = host ? tenants.findTenantOrg(tenantOrgs, host) : null;
  return org ? tenants.tenantRootUrl(host, rootUrl) : rootUrl;
}

// The cached tenant orgs, for callers that need the whole list (the host-conflict
// check when saving, and the tests).
function cachedTenantOrgs() {
  return tenantOrgs.slice();
}

// ── problem 2: the client bundle carries ROOT_URL ────────────────────────────
//
// Meteor bakes __meteor_runtime_config__ into the HTML it serves, so one process
// serving two domains would hand both clients the same ROOT_URL - and the client
// loaded from b.example.com would open its DDP connection to a.example.com.
// addRuntimeConfigHook exists for exactly this case. It was broken in Meteor
// 3.0-alpha/beta/rc (meteor#13156) and is fixed in the Meteor 3 release WeKan runs.
//
// The hook returns a falsy value for every host it does not recognise, which leaves
// Meteor's own encoded config untouched - so an instance with no tenants, or a
// request to the instance's own ROOT_URL, is byte-for-byte what it was.
function installRuntimeConfigHook() {
  if (!enabled()) return false;
  if (typeof WebApp.addRuntimeConfigHook !== 'function'
    || typeof WebApp.decodeRuntimeConfig !== 'function'
    || typeof WebApp.encodeRuntimeConfig !== 'function') {
    // Without the hook (or its encoding helpers) every client would be handed the
    // one ROOT_URL. Say so once and leave the config alone rather than hand-rolling
    // an encoding the runtime may not accept.
    console.warn('[multitenancy] this Meteor has no WebApp.addRuntimeConfigHook; per-host ROOT_URL is not applied');
    return false;
  }
  WebApp.addRuntimeConfigHook(({ request, encodedCurrentConfig }) => {
    try {
      const headers = request && request.headers;
      const host = tenants.requestHost(headers, { trustProxy: trustProxy() });
      if (!host) return null;
      const org = tenants.findTenantOrg(tenantOrgs, host);
      if (!org) return null;
      const rootUrl = tenants.tenantRootUrl(host, process.env.ROOT_URL || '');
      // The docs are explicit that the hook does not check what it is given, so the
      // config is decoded, changed and encoded with Meteor's own helpers.
      const config = WebApp.decodeRuntimeConfig(encodedCurrentConfig);
      config.ROOT_URL = rootUrl;
      config.DDP_DEFAULT_CONNECTION_URL = rootUrl;
      return WebApp.encodeRuntimeConfig(config);
    } catch (e) {
      // Returning null keeps the untouched config, so a bug here cannot blank the
      // page the way meteor#12939 did.
      console.error('[multitenancy] runtime config hook failed:', e && e.message ? e.message : e);
      return null;
    }
  });
  return true;
}

Meteor.startup(async () => {
  if (!enabled()) return;
  await startObserving();
  installRuntimeConfigHook();
  console.log('[multitenancy] Organizations as tenants is ON' +
    (trustProxy() ? ' (trusting X-Forwarded-Host)' : ' (using the Host header)'));
});

export {
  cachedTenantOrgs,
  enabled as tenancyEnabled,
  installRuntimeConfigHook,
  refreshTenantOrgs,
  tenantForConnection,
  tenantForHeaders,
  tenantRootUrlFor,
  trustProxy as tenancyTrustsProxyHost,
};
