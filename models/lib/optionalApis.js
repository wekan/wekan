'use strict';

// Optional APIs (Admin Panel / Settings / Visibility / Optional APIs): REST
// APIs in the shape of other trackers', so a client written for Trello, Jira,
// GitHub or Gitea can use WeKan as its backend. What such a client saves is
// stored in WeKan's own database, on WeKan boards, under WeKan's permissions:
// each API sees only the boards its caller may see, and writes only where the
// caller may write.
//
// Every one is OFF until an administrator ticks it, and every one lives under
// WeKan's own /api, so the WITH_API switch turns them all off with the rest
// of the REST API. A client is pointed at the base path as its server address.
//
// One catalog, read by the Admin Panel and by the routes: an API that is not
// ticked answers 404, as if it were not there.

const OPTIONAL_APIS = [
  { key: 'trello', name: 'Trello', base: '/api/compat/trello/1', labelKey: 'optional-api-trello', descKey: 'optional-api-trello-desc' },
  { key: 'jira', name: 'Jira', base: '/api/compat/jira/rest/api/2', labelKey: 'optional-api-jira', descKey: 'optional-api-jira-desc' },
  { key: 'github', name: 'GitHub', base: '/api/compat/github', labelKey: 'optional-api-github', descKey: 'optional-api-github-desc' },
  { key: 'gitea', name: 'Gitea', base: '/api/compat/gitea/api/v1', labelKey: 'optional-api-gitea', descKey: 'optional-api-gitea-desc' },
];

const OPTIONAL_API_KEYS = OPTIONAL_APIS.map(api => api.key);

/** Whether an optional API is on: only when an administrator ticked it. */
function isOptionalApiEnabled(setting, key) {
  return !!(setting && setting.optionalApis && setting.optionalApis[key] === true) && OPTIONAL_API_KEYS.includes(key);
}

/** The stored value for the Admin Panel's ticks: known keys only, booleans only. */
function cleanOptionalApis(input) {
  const out = {};
  for (const key of OPTIONAL_API_KEYS) out[key] = !!(input && input[key] === true);
  return out;
}

/**
 * The WeKan token a compatible client sends in its tracker's own way, or ''.
 *   Trello  ?token=<t> (and ?key=, which is ignored), or Authorization: OAuth oauth_token="<t>"
 *   Jira    Authorization: Basic base64(<user>:<t>), or Bearer <t>
 *   GitHub  Authorization: token <t>, or Bearer <t>
 *   Gitea   Authorization: token <t>, or ?token= / ?access_token=
 * WeKan's own Bearer header is read by the API middleware before this.
 */
function compatToken(api, { authorization = '', query = {} } = {}) {
  const auth = String(authorization || '');
  let m = /^(?:token|bearer)\s+(\S+)$/i.exec(auth);
  if (m) return m[1];
  if (api === 'trello') {
    m = /oauth_token="([^"]+)"/i.exec(auth);
    if (m) return m[1];
    return typeof query.token === 'string' ? query.token : '';
  }
  if (api === 'jira') {
    m = /^basic\s+(\S+)$/i.exec(auth);
    if (m) {
      const decoded = Buffer.from(m[1], 'base64').toString('utf8');
      const at = decoded.indexOf(':');
      return at >= 0 ? decoded.slice(at + 1) : '';
    }
    return '';
  }
  if (api === 'gitea') return typeof query.token === 'string' ? query.token : (typeof query.access_token === 'string' ? query.access_token : '');
  return '';
}

module.exports = { OPTIONAL_APIS, OPTIONAL_API_KEYS, isOptionalApiEnabled, cleanOptionalApis, compatToken };
