'use strict';

// List sync, "Comments, labels, state and files" (syncSource.issueDetails):
// what a GitHub / GitLab / Gitea / Forgejo sync brings beyond the title and
// description - so a board synced from a repository is that repository's
// issue tracker in Board View / Version Control. Off by default; turned on per
// list in the Sync popup.
//
// The approach is git-bug's (bridge/github, bridge/gitlab) and Gitea's
// migrations (services/migrations/github.go, gitlab.go, gitea_downloader.go):
// list the issues with every state, then their comments - repository-wide in
// one paged call where the API has one (GitHub's and Gitea's
// /issues/comments), per issue where it does not (GitLab's notes) - and key
// everything by the tracker's own id, so a second run changes only what
// changed upstream.
//
// What sync OWNS is what it wrote, and only that is ever changed or removed:
//   labels      the board labels named like the issue's labels (made when
//               missing); a label sync added and the issue no longer has is
//               taken off (card.syncLabelIds), a label added in WeKan is kept
//   state       card.syncIssueState, 'open' or 'closed' - the card stays in its
//               list, the Version Control view reads the state from it
//   comments    one card comment per upstream comment (syncCommentId), its
//               text updated when edited upstream; comments written in WeKan
//               are never touched
//   files       each issue file once (meta.syncUrl), downloaded through the
//               SSRF guard into Admin Panel / Attachments / Default Storage
//
// Pure, no Meteor: tests/listSyncIssueDetails.test.cjs. The server side is
// server/lib/listSyncIssueDetails.js.

const ISSUE_DETAIL_SOURCES = ['github', 'gitlab', 'gitea', 'forgejo'];

// Tags the parsers add that are not the issue's labels.
const NOT_LABELS = /^(assignee|state_reason|type):/i;

// Downloads per run, so one sync of a large repository can not hold the
// server for hours; the rest come on the next run.
const MAX_DOWNLOADS_PER_RUN = 100;

const LABEL_COLORS = ['green', 'yellow', 'orange', 'red', 'purple', 'blue', 'sky', 'lime', 'pink', 'black',
  'silver', 'peachpuff', 'crimson', 'plum', 'darkgreen', 'slateblue', 'magenta', 'gold', 'navy', 'gray',
  'saddlebrown', 'paleturquoise', 'mistyrose', 'indigo'];

/** The issue's own labels, from a parsed task's tags (milestones included). */
function issueLabelNames(task) {
  const seen = new Set();
  return (Array.isArray(task && task.tags) ? task.tags : [])
    .map(t => String(typeof t === 'string' ? t : (t && t.name) || '').trim())
    .filter(name => name && !NOT_LABELS.test(name) && !seen.has(name) && seen.add(name));
}

/** A stable colour for a label sync has to create, the same every run. */
function labelColor(name) {
  let hash = 0;
  for (const ch of String(name)) hash = ((hash * 31) + ch.codePointAt(0)) >>> 0;
  return LABEL_COLORS[hash % LABEL_COLORS.length];
}

function issueStateOf(task) {
  return task && task.column_name === 'Closed' ? 'closed' : 'open';
}

/** A comment's text as the card shows it: the upstream author leads it. */
function commentText(comment) {
  const body = String((comment && comment.text) || '').trim();
  const author = String((comment && (comment.authorName || comment.author)) || '').trim();
  return author ? `${author}: ${body}` : body;
}

/**
 * The changes for one card.
 *   card            { _id, labelIds, syncLabelIds, syncIssueState }
 *   task            the parsed issue: { tags, column_name, comments, attachments }
 *   labelIdByName   Map name -> board label id (after missing ones were made)
 *   comments        the card's synced comments: [{ _id, syncCommentId, text }]
 *   fileUrls        Set of the urls already attached (meta.syncUrl)
 * Returns { set, insertComments, updateComments, files }.
 */
function planIssueDetails({ card, task, labelIdByName, comments = [], fileUrls = new Set() }) {
  const set = {};
  const wanted = issueLabelNames(task).map(name => labelIdByName.get(name)).filter(Boolean);
  const owned = Array.isArray(card.syncLabelIds) ? card.syncLabelIds : [];
  const current = Array.isArray(card.labelIds) ? card.labelIds : [];
  // Keep every label WeKan added; replace only what sync owns.
  const local = current.filter(id => !owned.includes(id));
  const labelIds = [...new Set([...local, ...wanted])];
  if (labelIds.length !== current.length || labelIds.some(id => !current.includes(id))) set.labelIds = labelIds;
  if (wanted.length !== owned.length || wanted.some(id => !owned.includes(id))) set.syncLabelIds = wanted;
  const state = issueStateOf(task);
  if (card.syncIssueState !== state) set.syncIssueState = state;

  const byId = new Map(comments.filter(c => c && c.syncCommentId).map(c => [String(c.syncCommentId), c]));
  const insertComments = [];
  const updateComments = [];
  for (const comment of Array.isArray(task.comments) ? task.comments : []) {
    if (!comment || comment.externalId === undefined || comment.externalId === null) continue;
    const text = commentText(comment);
    if (!text) continue;
    const existing = byId.get(String(comment.externalId));
    if (!existing) insertComments.push({ syncCommentId: String(comment.externalId), text, date: comment.date });
    else if (existing.text !== text) updateComments.push({ _id: existing._id, text });
  }

  const files = (Array.isArray(task.attachments) ? task.attachments : [])
    .filter(f => f && typeof f.url === 'string' && !fileUrls.has(f.url));
  return { set, insertComments, updateComments, files };
}

// --- Fetch helpers --------------------------------------------------------

/**
 * Give each issue its comments, from one repository-wide comment list
 * (GitHub and Gitea: each comment names its issue by `issue_url`).
 */
function attachRepositoryComments(issues, comments) {
  const byNumber = new Map();
  for (const c of Array.isArray(comments) ? comments : []) {
    const m = c && typeof c.issue_url === 'string' && /\/issues\/(\d+)$/.exec(c.issue_url);
    if (!m) continue;
    if (!byNumber.has(m[1])) byNumber.set(m[1], []);
    byNumber.get(m[1]).push(c);
  }
  return (Array.isArray(issues) ? issues : []).map(issue => (issue && issue.number != null
    ? { ...issue, comments_data: byNumber.get(String(issue.number)) || [] } : issue));
}

/**
 * How long to wait before asking again after an API refused for its rate
 * limit, in ms, or null when the answer was not a rate limit. GitHub answers
 * 403 or 429 with x-ratelimit-remaining: 0 and x-ratelimit-reset (epoch
 * seconds), or Retry-After (seconds) for its secondary limit; GitLab and
 * Gitea answer 429 with Retry-After or RateLimit-Reset.
 */
function rateLimitWait(status, headers, nowMs = Date.now()) {
  if (status !== 403 && status !== 429) return null;
  const get = name => (headers && typeof headers.get === 'function' ? headers.get(name) : headers && headers[name]);
  const retryAfter = get('retry-after');
  if (retryAfter != null && /^\d+$/.test(String(retryAfter).trim())) return Number(retryAfter) * 1000;
  const remaining = get('x-ratelimit-remaining');
  const reset = get('x-ratelimit-reset') || get('ratelimit-reset');
  if ((status === 429 || String(remaining) === '0') && reset != null && /^\d+$/.test(String(reset).trim())) {
    const n = Number(reset);
    // Epoch seconds (GitHub) or seconds from now (the RateLimit-Reset draft).
    const at = n > 1e9 ? n * 1000 : nowMs + n * 1000;
    return Math.max(0, at - nowMs);
  }
  return status === 429 ? 60 * 1000 : null;
}

module.exports = {
  ISSUE_DETAIL_SOURCES,
  MAX_DOWNLOADS_PER_RUN,
  issueLabelNames,
  labelColor,
  issueStateOf,
  commentText,
  planIssueDetails,
  attachRepositoryComments,
  rateLimitWait,
};
