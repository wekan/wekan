'use strict';

// The optional GitHub- and Gitea-compatible APIs: their REST issue APIs'
// shapes for WeKan boards (server/compatApi/githubLike.js, which has no
// rights of its own: it calls WeKan's REST API as the caller). A board looks
// through these APIs exactly as it does in Board View / Version Control,
// because both use models/lib/versionControlView.js. Pure:
// tests/githubCompatApi.test.cjs.
//
//   a repository   a board: owner/<board key or id>
//   an issue       a card (not a release or wiki page), its number the
//                  upstream or card number, open or closed as that view says
//   labels         the board's labels; milestones: labels with a due date

const vcs = require('./versionControlView');
const { isValidKey } = require('./boardKey');

// WeKan's label colours as the hex GitHub and Gitea need.
const HEX = {
  white: 'ffffff', green: '3cb500', yellow: 'fad900', orange: 'ff9f19', red: 'eb4646', purple: 'a632db', blue: '0079bf',
  sky: '00c2e0', lime: '51e898', pink: 'ff78cb', black: '4d4d4d', silver: 'c0c0c0', peachpuff: 'ffdab9', crimson: 'dc143c',
  plum: 'dda0dd', darkgreen: '006400', slateblue: '6a5acd', magenta: 'ff00ff', gold: 'ffd700', navy: '000080', gray: '808080',
  saddlebrown: '8b4513', paleturquoise: 'afeeee', mistyrose: 'ffe4e1', indigo: '4b0082',
};
const hex = color => (/^#?[0-9a-f]{6}$/i.test(color || '') ? String(color).replace('#', '').toLowerCase() : HEX[color] || 'ededed');

const iso = d => (d ? new Date(d).toISOString().replace(/\.\d{3}Z$/, 'Z') : null);

function repoName(board) {
  return isValidKey(board && board.key) ? board.key : board._id;
}

function repo(board, owner, { openIssues = 0, baseUrl = '' } = {}) {
  const name = repoName(board);
  return {
    id: board._id,
    name,
    full_name: `${owner}/${name}`,
    description: board.title || '',
    owner: { login: owner, id: owner },
    private: board.permission !== 'public',
    html_url: `${baseUrl}/b/${board._id}/${board.slug || 'board'}`,
    has_issues: true,
    has_wiki: true,
    archived: !!board.archived,
    open_issues_count: openIssues,
    default_branch: 'main',
    created_at: iso(board.createdAt),
    updated_at: iso(board.modifiedAt || board.createdAt),
  };
}

function label(l) {
  return { id: l._id, name: l.name || l.color || '', color: hex(l.color), description: '' };
}

function milestone(m, issues = []) {
  const [p] = vcs.milestoneProgress([m], issues);
  return { id: m._id, number: m._id, title: m.title, state: p.open ? 'open' : 'closed', open_issues: p.open, closed_issues: p.closed,
    due_on: iso(m.dueAt) };
}

/** A card as an issue. `listTitle` decides open / closed (versionControlView). */
function issue(card, { board, listTitle, usernames = new Map(), comments = 0, baseUrl = '' } = {}) {
  const labels = (board.labels || []).filter(l => (card.labelIds || []).includes(l._id));
  const milestones = vcs.boardMilestones(board.labels || []);
  const ms = milestones.find(m => (card.labelIds || []).includes(m._id));
  const state = vcs.issueState(card, listTitle);
  const login = uid => ({ login: usernames.get(uid) || uid, id: uid });
  const assignees = [...new Set([...(card.assignees || []), ...(card.members || [])])];
  return {
    id: card._id,
    number: vcs.issueNumber(card) || 0,
    title: card.title || '',
    body: vcs.issueBody(card.description),
    state,
    labels: labels.filter(l => !ms || l._id !== ms._id).map(label),
    milestone: ms ? milestone(ms) : null,
    assignee: assignees[0] ? login(assignees[0]) : null,
    assignees: assignees.map(login),
    user: card.userId ? login(card.userId) : null,
    comments,
    created_at: iso(card.createdAt),
    updated_at: iso(card.modifiedAt || card.dateLastActivity || card.createdAt),
    closed_at: state === 'closed' ? iso(card.archivedAt || card.modifiedAt) : null,
    due_date: card.dueAt ? iso(card.dueAt) : null,
    html_url: `${baseUrl}/b/${board._id}/${board.slug || 'board'}/${card._id}`,
    pull_request: undefined,
  };
}

function comment(c, { usernames = new Map() } = {}) {
  const uid = c.authorId || c.userId;
  return { id: c._id, body: c.comment || c.text || '', user: uid ? { login: usernames.get(uid) || uid, id: uid } : null,
    created_at: iso(c.createdAt), updated_at: iso(c.modifiedAt || c.createdAt) };
}

/** The issues of a list request (?state=open|closed|all, ?labels=a,b), paged. */
function listIssues(issues, { state = 'open', labels = '', page = 1, perPage = 30 } = {}) {
  const wanted = String(labels || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const rows = issues
    .filter(i => state === 'all' || i.state === state)
    .filter(i => wanted.every(w => i.labels.some(l => l.name.toLowerCase() === w)))
    .sort((a, b) => (b.number || 0) - (a.number || 0));
  const size = Math.min(100, Math.max(1, Number(perPage) || 30));
  const p = Math.max(1, Number(page) || 1);
  return { rows: rows.slice((p - 1) * size, p * size), total: rows.length, page: p, perPage: size, last: Math.max(1, Math.ceil(rows.length / size)) };
}

/** The Link header of a page, as GitHub and Gitea send it: `path` is the
 * request's own path and query, so every link stays on this server. */
function linkHeader(path, page, last) {
  const [pathname, query = ''] = String(path).split('?');
  const at = (n) => { const q = new URLSearchParams(query); q.set('page', String(n)); return `<${pathname}?${q.toString()}>`; };
  const parts = [];
  if (page < last) parts.push(`${at(page + 1)}; rel="next"`, `${at(last)}; rel="last"`);
  if (page > 1) parts.push(`${at(1)}; rel="first"`, `${at(page - 1)}; rel="prev"`);
  return parts.join(', ');
}

/** A WeKan card change from an issue edit: { body, labelNames, state, error }. */
function issueChange(input) {
  const f = input || {};
  const body = {};
  if (f.title !== undefined) {
    const title = String(f.title).replace(/\s+/g, ' ').trim().slice(0, 1000);
    if (!title) return { error: 'title is required' };
    body.title = title;
  }
  if (f.body !== undefined) body.description = f.body === null ? '' : String(f.body).slice(0, 65536);
  if (f.state !== undefined && !['open', 'closed'].includes(f.state)) return { error: 'state must be open or closed' };
  const labelNames = Array.isArray(f.labels) ? f.labels.map(l => String(typeof l === 'object' && l ? l.name : l)) : undefined;
  return { body, labelNames, state: f.state };
}

module.exports = { HEX, hex, repo, repoName, label, milestone, issue, comment, listIssues, linkHeader, issueChange };
