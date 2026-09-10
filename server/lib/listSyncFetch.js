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

async function fetchJson(url, headers) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      const error = new Error(
        `${url} responded ${response.status} ${response.statusText}${body ? `: ${body.slice(0, 200)}` : ''}`,
      );
      error.status = response.status;
      throw error;
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

// Jira Cloud/Server REST search API. `credential.username` + `.token` are
// Basic-auth'd (Jira Cloud: account email + API token). `list.syncSource.url`
// is the Jira base URL (e.g. https://org.atlassian.net),
// `list.syncSource.projectKey` the project key.
export async function fetchJiraIssues(syncSource, credential) {
  const base = String(syncSource.url || '').replace(/\/+$/, '');
  const jql = encodeURIComponent(`project=${syncSource.projectKey}`);
  const url = `${base}/rest/api/2/search?jql=${jql}&maxResults=200`;
  const auth = Buffer.from(`${credential.username || ''}:${credential.token}`).toString('base64');
  return fetchJson(url, { Authorization: `Basic ${auth}`, Accept: 'application/json' });
}

// GET /repos/{owner}/{repo}/issues?state=all
export async function fetchGithubIssues(syncSource, credential) {
  const url = `https://api.github.com/repos/${syncSource.projectKey}/issues?state=all&per_page=100`;
  return fetchJson(url, {
    Authorization: `token ${credential.token}`,
    Accept: 'application/vnd.github+json',
  });
}

// GET /projects/{id-or-path}/issues?state=all - Gitea shares GitHub's issue shape.
export async function fetchGiteaIssues(syncSource, credential) {
  const base = String(syncSource.url || '').replace(/\/+$/, '');
  const url = `${base}/api/v1/repos/${syncSource.projectKey}/issues?state=all&limit=100`;
  return fetchJson(url, { Authorization: `token ${credential.token}` });
}

// GET /projects/{id}/issues - GitLab, project id or URL-encoded path.
export async function fetchGitlabIssues(syncSource, credential) {
  const base = String(syncSource.url || 'https://gitlab.com').replace(/\/+$/, '');
  const project = encodeURIComponent(syncSource.projectKey);
  const url = `${base}/api/v4/projects/${project}/issues?per_page=100`;
  return fetchJson(url, { 'PRIVATE-TOKEN': credential.token });
}

export const LIST_SYNC_FETCHERS = {
  jira: fetchJiraIssues,
  github: fetchGithubIssues,
  gitea: fetchGiteaIssues,
  forgejo: fetchGiteaIssues,
  gitlab: fetchGitlabIssues,
};
