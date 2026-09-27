// Fetchers for the periodic list-sync job (server/listSync.js). Each one
// calls the external tracker's REST API and returns the RAW JSON in exactly
// the shape models/lib/externalParsers.js already parses for one-time import
// (Jira's `{ issues: [...] }` search result, a GitHub/Gitea issues array, a
// GitLab issues array) - so the sync job hands that JSON to the SAME parser
// the import path uses (parseJira/parseGithub/parseGitlab/parseGitea) instead
// of a second, sync-only parsing implementation.
//
// Meteor 3 runs on a Node.js new enough to have the global `fetch` (Node 18+),
// so no HTTP client dependency is added for this.

const FETCH_TIMEOUT_MS = 20000;
const MAX_SYNC_PAGES = 1000;
const MAX_SYNC_ITEMS = 100000;

async function fetchJson(url, headers) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { headers, signal: controller.signal, redirect: 'error' });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      const error = new Error(
        `${url} responded ${response.status} ${response.statusText}${body ? `: ${body.slice(0, 200)}` : ''}`,
      );
      error.status = response.status;
      throw error;
    }
    return { body: await response.json(), headers: response.headers };
  } finally {
    clearTimeout(timer);
  }
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
async function fetchJiraCloudIssues(base, jql, headers) {
  const issues = [], tokens = new Set();
  const url = new URL(`${base}/rest/api/3/search/jql`);
  url.searchParams.set('jql', jql);
  url.searchParams.set('maxResults', '200');
  // Enhanced search otherwise returns only issue IDs. Request the fields the
  // shared parser uses so synchronization cannot replace titles with defaults.
  url.searchParams.set('fields', 'summary,description,status,duedate,assignee,reporter,labels,timetracking,timespent');
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
    return fetchJiraCloudIssues(base, query, { Authorization: `Basic ${auth}`, Accept: 'application/json' });
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
