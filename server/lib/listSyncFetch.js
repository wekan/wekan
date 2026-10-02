// Fetchers for the periodic list-sync job (server/listSync.js). Each one
// calls the external tracker's REST API and returns the RAW JSON in exactly
// the shape models/lib/externalParsers.js already parses for one-time import
// (Jira's `{ issues: [...] }` search result, a GitHub/Gitea issues array, a
// GitLab issues array) - so the sync job hands that JSON to the SAME parser
// the import path uses (parseJira/parseGithub/parseGitlab/parseGitea) instead
// of a second, sync-only parsing implementation.
//
// SyncBleed (GHSA-5q84-p3vr-f3xv): the server URL is chosen by any board
// member with write access, so every request goes through the SSRF guard like
// every other outbound request WeKan makes for a user: private, loopback and
// link-local addresses are refused, DNS is resolved once and pinned, and a
// redirect is refused. What a member sees of a failure is the origin and the
// HTTP status, never the response, because the error text is returned by the
// preview and stored in syncSource.lastSyncError for the board to read.
import { fetchSafe } from '/server/lib/ssrfGuard';
import { validateAttachmentUrl } from '/models/lib/attachmentUrlValidation';

const FETCH_TIMEOUT_MS = 20000;
const MAX_RESPONSE_BYTES = 32 * 1024 * 1024;
const MAX_SYNC_PAGES = 1000;
const MAX_SYNC_ITEMS = 100000;
export const SYNC_URL_BLOCKED_MESSAGE =
  'The Sync server address is not allowed: private, loopback and link-local addresses are refused.';

// What a caller may show for a request that failed. A refusal by the guard is
// one message whatever it named - which address a name resolved to is itself
// internal information - and is marked so the caller can record the attempt.
export function syncFetchError(error) {
  if (/^SSRF_GUARD:/.test(error && error.message)) {
    const blocked = new Error(SYNC_URL_BLOCKED_MESSAGE);
    blocked.ssrfBlocked = true;
    blocked.ssrfDetail = String(error.message).slice(0, 200);
    return blocked;
  }
  return error;
}

// Record a refused Sync address in Admin Panel -> Problems. Nobody can save
// or sync one in the ordinary course, so each refusal is an attempt.
export function recordSyncUrlBlocked({ source, userId, detail }) {
  try {
    // eslint-disable-next-line global-require
    require('/server/lib/securityLog').record({
      key: 'ssrf.list-sync', action: 'blocked', source, userId, detail: String(detail || '').slice(0, 200),
    });
  } catch (e) { /* logging must never break the guard */ }
}

// The same check when Sync settings are SAVED, so a refused address is never
// stored. An address that does not resolve now is left to the fetch, which
// checks again on every request (a name can change what it resolves to).
const BLOCKING_REASONS = new Set(['Localhost is not allowed', 'IP address is not allowed',
  'Resolved IP address is not allowed', 'Only HTTP and HTTPS protocols are allowed']);
export async function assertSyncUrlAllowed(url, { userId } = {}) {
  if (operatorAllowedHost(url)) return;
  const verdict = await validateAttachmentUrl(url);
  if (verdict.valid || !BLOCKING_REASONS.has(verdict.reason)) return;
  recordSyncUrlBlocked({ source: 'setListSyncSource', userId, detail: `${new URL(url).host}: ${verdict.reason}` });
  const error = new Error(SYNC_URL_BLOCKED_MESSAGE);
  error.ssrfBlocked = true;
  throw error;
}

// A self-hosted tracker on the server's own network is a legitimate source,
// and only the server's ADMINISTRATOR may say so: LIST_SYNC_ALLOWED_PRIVATE_HOSTS
// is a comma-separated list of exact host names or addresses, compared with
// the URL's host as written. No board member can change it, so the guard still
// holds against them; an empty or unset value allows nothing.
export function operatorAllowedHost(url, env = process.env) {
  const allowed = String(env.LIST_SYNC_ALLOWED_PRIVATE_HOSTS || '').split(',')
    .map(host => host.trim().toLowerCase()).filter(Boolean);
  return allowed.length > 0 && allowed.includes(new URL(url).hostname.toLowerCase());
}

// The administrator's own host is fetched directly, still without redirects,
// bounded in time and size like any other request.
async function fetchOperatorHost(url, headers) {
  const response = await fetch(url, { headers, redirect: 'error', signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  const length = Number(response.headers.get('content-length'));
  if (Number.isFinite(length) && length > MAX_RESPONSE_BYTES) throw new Error(`${new URL(url).origin} answer is too large`);
  return response;
}

async function fetchJson(url, headers) {
  const origin = new URL(url).origin;
  let response;
  try {
    response = operatorAllowedHost(url) ? await fetchOperatorHost(url, headers) : await fetchSafe(url, {
      headers, timeoutMs: FETCH_TIMEOUT_MS, totalTimeoutMs: FETCH_TIMEOUT_MS,
      maxRedirects: 0, maxResponseBytes: MAX_RESPONSE_BYTES,
    });
  } catch (error) {
    throw syncFetchError(error);
  }
  if (!response.ok) {
    const error = new Error(`${origin} responded with HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  let body;
  // A parse error quotes the start of the response; say only that it was not JSON.
  try { body = await response.json(); } catch (error) { throw new Error(`${origin} did not answer with JSON`); }
  return { body, headers: response.headers };
}

// Follow provider pagination only within the configured origin. No partial
// collection escapes: failures or bounds abort before reconciliation starts.
async function fetchArrayPages(initial, headers) {
  const rows = [], seen = new Set();
  let url = initial, total;
  while (url) {
    if (seen.has(url) || seen.size >= MAX_SYNC_PAGES) throw new Error('Sync pagination did not finish');
    seen.add(url);
    const { body, headers: responseHeaders } = await fetchJson(url, headers);
    if (!Array.isArray(body)) throw new Error('Invalid sync issue page');
    const advertised = responseHeaders.get('x-total-count') ?? responseHeaders.get('x-total');
    if (advertised !== null) {
      const count = Number(advertised);
      if (!/^[0-9]+$/.test(advertised) || !Number.isSafeInteger(count) || (total !== undefined && total !== count)) throw new Error('Invalid or changing sync total');
      total = count;
      if (total > MAX_SYNC_ITEMS) throw new Error('Sync item limit exceeded');
    }
    rows.push(...body);
    if (rows.length > MAX_SYNC_ITEMS) throw new Error('Sync item limit exceeded');
    const link = responseHeaders.get('link') || '';
    const next = link.match(/<([^>]+)>;\s*rel="next"/);
    const nextPage = responseHeaders.get('x-next-page');
    if (next) {
      const target = new URL(next[1], url);
      if (target.origin !== new URL(initial).origin || target.username || target.password) throw new Error('Invalid sync pagination origin');
      url = target.href;
    } else if (nextPage) {
      if (!/^[1-9][0-9]*$/.test(nextPage)) throw new Error('Invalid sync next page');
      const target = new URL(url); target.searchParams.set('page', nextPage); url = target.href;
    } else url = null;
  }
  if (total !== undefined && rows.length !== total) throw new Error('Incomplete sync pagination');
  return rows;
}

// Jira Cloud/Server REST search API. `credential.username` + `.token` are
// Basic-auth'd (Jira Cloud: account email + API token). `list.syncSource.url`
// is the Jira base URL (e.g. https://org.atlassian.net),
// `list.syncSource.projectKey` the project key.
async function fetchJiraCloudIssues(base, jql, headers, estimateFieldId) {
  const issues = [], tokens = new Set();
  const url = new URL(`${base}/rest/api/3/search/jql`);
  url.searchParams.set('jql', jql);
  url.searchParams.set('maxResults', '200');
  // Enhanced search otherwise returns only issue IDs. Request the fields the
  // shared parser uses so synchronization cannot replace titles with defaults.
  const fields = ['summary', 'description', 'status', 'duedate', 'assignee', 'reporter', 'labels', 'timetracking', 'timespent', 'timeoriginalestimate', 'timeestimate'];
  if (estimateFieldId !== undefined) {
    if (!/^customfield_\d{1,20}$/.test(estimateFieldId)) throw new Error('Invalid Jira estimate field');
    fields.push(estimateFieldId);
  }
  url.searchParams.set('fields', fields.join(','));
  for (let page = 0; page < MAX_SYNC_PAGES; page += 1) {
    const { body } = await fetchJson(url.href, headers);
    if (!body || !Array.isArray(body.issues) || typeof body.isLast !== 'boolean') throw new Error('Invalid Jira Cloud pagination');
    issues.push(...body.issues);
    if (issues.length > MAX_SYNC_ITEMS) throw new Error('Sync item limit exceeded');
    if (body.isLast) return { issues };
    const token = body.nextPageToken;
    if (typeof token !== 'string' || !token || token.length > 10000 || tokens.has(token)) throw new Error('Incomplete or repeating Jira Cloud pagination');
    tokens.add(token);
    url.searchParams.set('nextPageToken', token);
  }
  throw new Error('Sync pagination did not finish');
}

export async function fetchJiraIssues(syncSource, credential) {
  const base = String(syncSource.url || '').replace(/\/+$/, '');
  const query = `project=${syncSource.projectKey}`;
  const jql = encodeURIComponent(query);
  const url = `${base}/rest/api/2/search?jql=${jql}&maxResults=200`;
  const auth = Buffer.from(`${credential.username || ''}:${credential.token}`).toString('base64');
  if (new URL(base).hostname.endsWith('.atlassian.net')) {
    return fetchJiraCloudIssues(base, query, { Authorization: `Basic ${auth}`, Accept: 'application/json' }, syncSource.estimateFieldId);
  }
  const issues = []; let total;
  for (let page = 0; page < MAX_SYNC_PAGES; page += 1) {
    const { body } = await fetchJson(`${url}&startAt=${issues.length}`, { Authorization: `Basic ${auth}`, Accept: 'application/json' });
    if (!body || !Array.isArray(body.issues) || !Number.isSafeInteger(body.total) || body.total < 0 || body.startAt !== issues.length) throw new Error('Invalid Jira pagination');
    if (total !== undefined && total !== body.total) throw new Error('Jira results changed during pagination; retry sync');
    total = body.total;
    if (total > MAX_SYNC_ITEMS) throw new Error('Sync item limit exceeded');
    if (!body.issues.length && issues.length < total) throw new Error('Incomplete Jira pagination');
    issues.push(...body.issues);
    if (issues.length > total) throw new Error('Invalid Jira result count');
    if (issues.length === total) return { ...body, startAt: 0, issues };
  }
  throw new Error('Sync pagination did not finish');
}

// GET /repos/{owner}/{repo}/issues?state=all
export async function fetchGithubIssues(syncSource, credential) {
  const url = `https://api.github.com/repos/${syncSource.projectKey}/issues?state=all&per_page=100`;
  return fetchArrayPages(url, {
    Authorization: `token ${credential.token}`,
    Accept: 'application/vnd.github+json',
  });
}

// GET /projects/{id-or-path}/issues?state=all - Gitea shares GitHub's issue shape.
export async function fetchGiteaIssues(syncSource, credential) {
  const base = String(syncSource.url || '').replace(/\/+$/, '');
  const url = `${base}/api/v1/repos/${syncSource.projectKey}/issues?state=all&limit=100`;
  return fetchArrayPages(url, { Authorization: `token ${credential.token}` });
}

// GET /projects/{id}/issues - GitLab, project id or URL-encoded path.
export async function fetchGitlabIssues(syncSource, credential) {
  const base = String(syncSource.url || 'https://gitlab.com').replace(/\/+$/, '');
  const project = encodeURIComponent(syncSource.projectKey);
  const url = `${base}/api/v4/projects/${project}/issues?per_page=100`;
  return fetchArrayPages(url, { 'PRIVATE-TOKEN': credential.token });
}

export const LIST_SYNC_FETCHERS = {
  jira: fetchJiraIssues,
  github: fetchGithubIssues,
  gitea: fetchGiteaIssues,
  forgejo: fetchGiteaIssues,
  gitlab: fetchGitlabIssues,
};
