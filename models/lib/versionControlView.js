'use strict';

// Board View / Version Control: the board as a GitHub / Gitea repository's
// issue tracker, drawn in the board's own theme
// (client/components/boards/versionControlView.*, design:
// docs/Features/Board/Version-Control-View.md).
//
// Nothing here is a second copy of anything. A card is an issue, the board's
// labels are the labels, a label with a due date (#2802) is a milestone, the
// card's comments are the conversation, its attachments are the files, and
// the board's change history (models/changeHistory.js) is the git log, with
// its undo. An issue is CLOSED when its card is archived or is in a list
// named like GitHub's / Gitea's closed column; everything else is OPEN.
//
// Pure CommonJS, no Meteor: the client, the server methods and
// tests/versionControlView.test.cjs load the same rules.

const TABS = ['issues', 'milestones', 'labels', 'releases', 'wiki', 'files', 'history'];
// The lists the GitHub organization import fills (models/lib/githubOrgImport.js,
// models/lib/githubWiki.js): their cards are releases and wiki pages, not issues.
const RELEASES_LIST_TITLE = 'Releases';
const WIKI_LIST_TITLE = 'Wiki';

// A list with one of these names holds closed issues. The GitHub, GitLab,
// Gitea and Forgejo importers create "Open" and "Closed"
// (models/lib/externalParsers.js); "Done" is WeKan's own default board.
const CLOSED_LIST_NAMES = ['closed', 'done', 'resolved', 'merged', 'wontfix'];
const OPEN_LIST_NAME = 'Open';
const CLOSED_LIST_NAME = 'Closed';

// The importers keep a milestone as the label `milestone:<title>`.
const MILESTONE_PREFIX = 'milestone:';

const SORTS = ['created-desc', 'created-asc', 'updated-desc', 'comments-desc'];

const norm = s => String(s == null ? '' : s).trim().toLowerCase();

function isClosedListTitle(title) {
  return CLOSED_LIST_NAMES.includes(norm(title));
}

/** 'open' or 'closed', from the card and the title of its list. */
function issueState(card, listTitle) {
  if (!card) return 'open';
  if (card.archived) return 'closed';
  // A synced issue's state is the tracker's (list sync's "Comments, labels,
  // state and files", models/lib/listSyncIssueDetails.js): the card stays in
  // its synced list either way.
  if (card.syncIssueState === 'open' || card.syncIssueState === 'closed') return card.syncIssueState;
  return isClosedListTitle(listTitle) ? 'closed' : 'open';
}

/** A card kept by list sync: its state is changed in the tracker, not here. */
function isSyncedIssue(card) {
  return !!(card && card.syncExternalId && card.syncSourceKey);
}

/**
 * The issue number: the upstream one for an imported issue (the importers
 * end the description with `Source: #<n>`, GitLab's `Source: group/project#<n>`),
 * else the card's own number.
 */
function issueNumber(card) {
  if (!card) return null;
  const match = /(?:^|\n)Source: [^\s#]*#(\d{1,9})\b/.exec(String(card.description || ''));
  if (match) return Number(match[1]);
  return Number.isInteger(card.cardNumber) && card.cardNumber > 0 ? card.cardNumber : null;
}

/** The description without the importer's `Source: #n <url>` footer. */
function issueBody(description) {
  return String(description || '').replace(/\n*Source: [^\s#]*#\d{1,9}(?: \S+)?\s*$/, '').trim();
}

/**
 * The milestones of a board: every label with a due date (#2802), and every
 * label the importers named `milestone:<title>`. Labels that are milestones
 * are not listed again as labels.
 */
function boardMilestones(labels) {
  return (Array.isArray(labels) ? labels : [])
    .filter(l => l && l._id && (l.dueAt || norm(l.name).startsWith(MILESTONE_PREFIX)))
    .map(l => ({
      _id: l._id,
      title: norm(l.name).startsWith(MILESTONE_PREFIX) ? String(l.name).slice(MILESTONE_PREFIX.length).trim() : String(l.name || l.color || ''),
      color: l.color,
      dueAt: l.dueAt ? new Date(l.dueAt) : null,
    }));
}

function boardPlainLabels(labels) {
  const milestoneIds = new Set(boardMilestones(labels).map(m => m._id));
  return (Array.isArray(labels) ? labels : []).filter(l => l && l._id && !milestoneIds.has(l._id));
}

// --- The search box: GitHub's query language, the parts WeKan has -----------
//
//   is:open  is:closed  label:"needs review"  milestone:v2  author:alice
//   assignee:bob  no:label  no:milestone  no:assignee  sort:created-asc
//   and any other words, searched in the number, title and body.

function tokenize(query) {
  const tokens = [];
  const re = /(-?)([a-z]+):(?:"([^"]*)"|(\S+))|"([^"]*)"|(\S+)/gi;
  let m;
  while ((m = re.exec(String(query || '')))) {
    if (m[2]) tokens.push({ negate: m[1] === '-', key: m[2].toLowerCase(), value: m[3] != null ? m[3] : m[4] });
    else tokens.push({ word: m[5] != null ? m[5] : m[6] });
  }
  return tokens;
}

function parseQuery(query) {
  const q = { state: null, labels: [], notLabels: [], milestone: null, author: null, assignee: null,
    no: [], sort: 'created-desc', words: [] };
  for (const t of tokenize(query)) {
    if (t.word != null) { if (t.word) q.words.push(norm(t.word)); continue; }
    const value = t.value;
    switch (t.key) {
      case 'is':
      case 'state':
        if (['open', 'closed'].includes(norm(value))) q.state = norm(value);
        break;
      case 'label':
        (t.negate ? q.notLabels : q.labels).push(norm(value));
        break;
      case 'milestone': q.milestone = norm(value); break;
      case 'author': q.author = norm(value).replace(/^@/, ''); break;
      case 'assignee': q.assignee = norm(value).replace(/^@/, ''); break;
      case 'no':
        if (['label', 'milestone', 'assignee'].includes(norm(value))) q.no.push(norm(value));
        break;
      case 'sort':
        if (SORTS.includes(norm(value))) q.sort = norm(value);
        break;
      default:
        // An unknown qualifier is searched as the text it is.
        q.words.push(norm(`${t.key}:${value}`));
    }
  }
  return q;
}

/** The query with `key:value` set (or replaced), as clicking a label does. */
function withQualifier(query, key, value) {
  const quoted = /\s/.test(value) ? `"${value}"` : value;
  const kept = tokenize(query).filter(t => t.word != null || t.key !== key || key === 'label')
    .map(t => (t.word != null ? (/\s/.test(t.word) ? `"${t.word}"` : t.word)
      : `${t.negate ? '-' : ''}${t.key}:${/\s/.test(t.value) ? `"${t.value}"` : t.value}`));
  if (key === 'label' && kept.includes(`label:${quoted}`)) return kept.join(' ');
  return [...kept, `${key}:${quoted}`].join(' ').trim();
}

/**
 * The issues that match a parsed query, sorted. `issues` are plain rows:
 *   { _id, number, title, body, state, labelNames: [], milestoneTitles: [],
 *     author, assignees: [], comments, createdAt, updatedAt }
 * Names compare case-insensitively, as GitHub's do.
 */
function filterIssues(issues, query, { ignoreState = false } = {}) {
  const q = typeof query === 'string' ? parseQuery(query) : query;
  const rows = (Array.isArray(issues) ? issues : []).filter((issue) => {
    if (!ignoreState && q.state && issue.state !== q.state) return false;
    const labels = (issue.labelNames || []).map(norm);
    const milestones = (issue.milestoneTitles || []).map(norm);
    const assignees = (issue.assignees || []).map(norm);
    if (q.labels.some(l => !labels.includes(l))) return false;
    if (q.notLabels.some(l => labels.includes(l))) return false;
    if (q.milestone && !milestones.includes(q.milestone)) return false;
    if (q.author && norm(issue.author) !== q.author) return false;
    if (q.assignee && !assignees.includes(q.assignee)) return false;
    if (q.no.includes('label') && labels.length) return false;
    if (q.no.includes('milestone') && milestones.length) return false;
    if (q.no.includes('assignee') && assignees.length) return false;
    if (q.words.length) {
      const hay = norm(`#${issue.number || ''} ${issue.title || ''} ${issue.body || ''}`);
      if (!q.words.every(w => hay.includes(w))) return false;
    }
    return true;
  });
  const time = d => (d ? new Date(d).getTime() : 0);
  const by = {
    'created-desc': (a, b) => time(b.createdAt) - time(a.createdAt),
    'created-asc': (a, b) => time(a.createdAt) - time(b.createdAt),
    'updated-desc': (a, b) => time(b.updatedAt || b.createdAt) - time(a.updatedAt || a.createdAt),
    'comments-desc': (a, b) => (b.comments || 0) - (a.comments || 0),
  }[q.sort] || (() => 0);
  return rows.sort((a, b) => by(a, b) || (b.number || 0) - (a.number || 0));
}

/** Open and closed counts of the issues matching the query apart from its state. */
function stateCounts(issues, query) {
  const rows = filterIssues(issues, query, { ignoreState: true });
  return { open: rows.filter(i => i.state === 'open').length, closed: rows.filter(i => i.state === 'closed').length };
}

/** Each milestone with its open and closed issues and how far along it is. */
function milestoneProgress(milestones, issues, now = new Date()) {
  return (Array.isArray(milestones) ? milestones : []).map((m) => {
    const mine = (issues || []).filter(i => (i.milestoneIds || []).includes(m._id));
    const closed = mine.filter(i => i.state === 'closed').length;
    const open = mine.length - closed;
    return {
      ...m,
      open,
      closed,
      percent: mine.length ? Math.round((closed * 100) / mine.length) : 0,
      overdue: Boolean(m.dueAt && open > 0 && new Date(m.dueAt).getTime() < new Date(now).getTime()),
    };
  });
}

/** Each label with how many OPEN issues carry it, as GitHub's labels page. */
function labelUsage(labels, issues) {
  return boardPlainLabels(labels).map(l => ({
    _id: l._id,
    name: l.name || '',
    color: l.color,
    open: (issues || []).filter(i => i.state === 'open' && (i.labelIds || []).includes(l._id)).length,
  }));
}

/** New-issue input, trimmed and bounded, or throws with an i18n key. */
function cleanNewIssue(input) {
  const title = String((input && input.title) || '').replace(/\s+/g, ' ').trim();
  const body = String((input && input.body) || '').trim();
  if (!title) throw new Error('vcs-issue-title-required');
  if (title.length > 1000) throw new Error('vcs-issue-title-too-long');
  if (body.length > 65536) throw new Error('vcs-issue-body-too-long');
  const labelIds = Array.isArray(input && input.labelIds) ? input.labelIds.filter(id => typeof id === 'string').slice(0, 50) : [];
  return { title, body, labelIds };
}

/**
 * Where a card goes when its issue is closed or reopened: the list to move it
 * to, or `create` with the title of the list to make first.
 *   lists: the board's unarchived lists, in their order
 */
function stateTarget(lists, state) {
  const rows = (Array.isArray(lists) ? lists : []).filter(l => l && !l.archived);
  if (state === 'closed') {
    const closed = rows.find(l => norm(l.title) === 'closed') || rows.find(l => isClosedListTitle(l.title));
    return closed ? { listId: closed._id } : { create: CLOSED_LIST_NAME };
  }
  const open = rows.find(l => norm(l.title) === 'open') || rows.find(l => !isClosedListTitle(l.title));
  return open ? { listId: open._id } : { create: OPEN_LIST_NAME };
}

module.exports = {
  TABS,
  RELEASES_LIST_TITLE,
  WIKI_LIST_TITLE,
  SORTS,
  CLOSED_LIST_NAMES,
  MILESTONE_PREFIX,
  isClosedListTitle,
  issueState,
  isSyncedIssue,
  issueNumber,
  issueBody,
  boardMilestones,
  boardPlainLabels,
  parseQuery,
  withQualifier,
  filterIssues,
  stateCounts,
  milestoneProgress,
  labelUsage,
  cleanNewIssue,
  stateTarget,
};
