'use strict';

// The OAuth2 / OIDC scope string, cleaned up before it is sent to the provider.
//
// #6545: a Keycloak login opened the popup and closed it again immediately,
// because the snap's default for OAUTH2_REQUEST_PERMISSIONS was
//
//     "'openid profile email'"
//
// - the single quotes are part of the VALUE. The scope reaching the provider was
// therefore `'openid` … `email'`, which is not a scope any provider knows, and a
// strict one (Keycloak) refuses the whole authorization request.
//
// The snap default no longer has them, but every install configured from the old
// default or from a wiki example still carries them, and nothing on the WeKan
// side should depend on an operator noticing. So the value is normalised here:
// surrounding quotes are removed, commas count as separators (a list written the
// JSON way), whitespace is collapsed, and duplicates are dropped. The result is
// the space-separated string OAuth2 defines.
//
// An empty or missing value gives the documented default, `openid profile email`,
// which is what the OIDC client fell back to anyway.

const DEFAULT_SCOPES = 'openid profile email';

// Strip ONE layer of matching surrounding quotes, whatever kind.
function unquote(value) {
  const text = String(value).trim();

  if (text.length >= 2) {
    const first = text[0];
    const last = text[text.length - 1];

    if ((first === "'" || first === '"' || first === '`') && first === last) {
      return text.slice(1, -1).trim();
    }
  }

  return text;
}

// The scopes as an array, in the order given, without empties or duplicates.
function parseScopes(value) {
  if (value === undefined || value === null) return DEFAULT_SCOPES.split(' ');

  // An array is already a list; a string may be space- or comma-separated.
  const parts = Array.isArray(value)
    ? value.map(part => unquote(part))
    : unquote(value).split(/[\s,]+/);

  const seen = new Set();
  const scopes = [];

  for (const part of parts) {
    // A single quote left inside is not part of a scope name: it is what a
    // half-quoted value ("'openid profile email") leaves behind.
    const scope = String(part).replace(/^['"`]+|['"`]+$/g, '').trim();

    if (scope === '' || seen.has(scope)) continue;

    seen.add(scope);
    scopes.push(scope);
  }

  return scopes.length ? scopes : DEFAULT_SCOPES.split(' ');
}

// The value to hand to the OIDC client: the space-separated scope string.
function requestPermissions(value) {
  return parseScopes(value).join(' ');
}

module.exports = { parseScopes, requestPermissions, DEFAULT_SCOPES, unquote };
