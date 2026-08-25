'use strict';

function resolveOidcEndpoint(serverUrl, endpoint) {
  const configuredEndpoint = String(endpoint || '').trim();
  if (/^https?:\/\//i.test(configuredEndpoint)) {
    return configuredEndpoint;
  }

  const base = String(serverUrl || '').trim().replace(/\/+$/, '');
  const relative = configuredEndpoint.replace(/^\/+/, '');
  if (!base) return relative ? `/${relative}` : '';
  return relative ? `${base}/${relative}` : base;
}

module.exports = { resolveOidcEndpoint };
