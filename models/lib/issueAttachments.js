'use strict';

// The files of an issue exported from GitHub, GitLab, Gitea or Forgejo, so the
// import brings them along as card attachments - stored like every upload, in
// Admin Panel / Attachments / Default Storage (models/kanboardCreator.js,
// Attachments.writeAsync, whose after-upload hook moves the file there).
//
// No tracker puts a file list in its issue JSON except Gitea and Forgejo
// (`assets`). The others link the file from the Markdown body - and so do
// Gitea and Forgejo, for a file pasted into a comment - so both are read:
//
//   Gitea / Forgejo  issue.assets[] and comment.assets[]: { name, browser_download_url }
//   GitHub           https://github.com/user-attachments/assets/<uuid>
//                    https://github.com/user-attachments/files/<id>/<name>
//                    https://user-images.githubusercontent.com/...
//   GitLab           /uploads/<hash>/<name>, relative to the project, whose
//                    address is issue.web_url up to "/-/issues/"
//   Gitea / Forgejo  <instance>/attachments/<uuid>
//
// Only these hosts and paths are taken: an issue body links to anything, and a
// link to a web page is a link, not a file. The download itself is the import's
// SSRF-guarded fetchImportedAttachment, which validates every hop.
//
// Pure, no Meteor: tests/issueAttachments.test.cjs.

const MAX_ATTACHMENTS_PER_ISSUE = 50;

const GITHUB_FILE = /^https:\/\/(?:github\.com\/user-attachments\/(?:assets|files)\/|(?:private-)?user-images\.githubusercontent\.com\/)/i;
const GITEA_FILE = /^https?:\/\/[^/\s]+(?:\/[^\s]*)?\/attachments\/[0-9a-f-]{36}$/i;

// [text](url) and ![alt](url), and <img src="url"> as GitHub writes a pasted image.
const MARKDOWN_LINK = /!?\[([^\]]*)\]\((\S+?)(?:\s+"[^"]*")?\)|<img\b[^>]*\bsrc="([^"]+)"[^>]*>/gi;

function nameFromUrl(url, fallback) {
  try {
    const last = decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).pop() || '');
    // A GitHub asset URL ends in a bare uuid; the link text names it better.
    if (fallback && /^[0-9a-f-]{36}$/i.test(last)) return fallback;
    return last || fallback || 'attachment';
  } catch (e) {
    return fallback || 'attachment';
  }
}

function gitlabProjectUrl(issue) {
  const web = issue && (issue.web_url || issue.webUrl);
  if (typeof web !== 'string') return null;
  const at = web.indexOf('/-/issues/');
  return at > 0 && /^https?:\/\//i.test(web) ? web.slice(0, at) : null;
}

function linkedFiles(text, issue) {
  const found = [];
  const body = String(text || '');
  const project = gitlabProjectUrl(issue);
  let m;
  MARKDOWN_LINK.lastIndex = 0;
  while ((m = MARKDOWN_LINK.exec(body))) {
    const label = (m[1] || '').trim();
    let url = (m[2] || m[3] || '').replace(/^<|>$/g, '');
    if (project && /^\/uploads\/[0-9a-f]{32}\/[^\s]+$/i.test(url)) url = `${project}${url}`;
    if (!/^https?:\/\//i.test(url)) continue;
    const isGitlab = project && url.startsWith(`${project}/uploads/`);
    if (!GITHUB_FILE.test(url) && !GITEA_FILE.test(url) && !isGitlab) continue;
    found.push({ name: nameFromUrl(url, label), url });
  }
  return found;
}

function assetFiles(assets) {
  return (Array.isArray(assets) ? assets : [])
    .filter(a => a && typeof a.browser_download_url === 'string' && /^https?:\/\//i.test(a.browser_download_url))
    .map(a => ({
      name: String(a.name || nameFromUrl(a.browser_download_url)),
      url: a.browser_download_url,
      ...(Number.isFinite(a.size) ? { size: a.size } : {}),
    }));
}

/**
 * The files of one issue, from its body, its comments and its assets:
 * [{ name, url, size? }], each url once, at most MAX_ATTACHMENTS_PER_ISSUE.
 */
function issueAttachments(issue) {
  if (!issue || typeof issue !== 'object') return [];
  const comments = Array.isArray(issue.comments_data) ? issue.comments_data
    : Array.isArray(issue.comments) ? issue.comments
      : Array.isArray(issue.notes) ? issue.notes : [];
  const all = [
    ...assetFiles(issue.assets),
    ...linkedFiles(issue.body || issue.description, issue),
    ...comments.flatMap(c => (c && typeof c === 'object'
      ? [...assetFiles(c.assets), ...linkedFiles(c.body, issue)] : [])),
  ];
  const seen = new Set();
  return all.filter((file) => {
    if (seen.has(file.url)) return false;
    seen.add(file.url);
    return true;
  }).slice(0, MAX_ATTACHMENTS_PER_ISSUE);
}

module.exports = { issueAttachments, MAX_ATTACHMENTS_PER_ISSUE };
