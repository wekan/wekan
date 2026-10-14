'use strict';

// The optional Jira-compatible API: Jira's REST API v2 shapes for WeKan
// boards (server/compatApi/jira.js, which has no rights of its own: it calls
// WeKan's REST API as the caller). Pure: tests/jiraCompatApi.test.cjs.
//
//   a project   a board; its key is the board key (DEV), else the board id
//   an issue    a card; its key is DEV-7 (the board key and the card number)
//   a status    a list; a transition is a move to another list
//   labels      board label names; assignee / reporter: WeKan users

const { formatCardKey, parseCardKey, isValidKey } = require('./boardKey');

const iso = d => (d ? new Date(d).toISOString().replace('Z', '+0000') : null);
const ymd = d => (d ? new Date(d).toISOString().slice(0, 10) : null);

function projectKey(board) {
  return isValidKey(board && board.key) ? board.key : board._id;
}

function project(board, { baseUrl = '' } = {}) {
  return {
    id: board._id,
    key: projectKey(board),
    name: board.title || '',
    description: board.description || '',
    projectTypeKey: 'software',
    self: `${baseUrl}/rest/api/2/project/${board._id}`,
  };
}

function issueKey(board, card) {
  const key = formatCardKey(isValidKey(board && board.key) ? board.key : '', card.cardNumber);
  return key && !key.startsWith('#') ? key : card._id;
}

function user(u) {
  if (!u) return null;
  return { accountId: u._id, name: u.username || '', key: u.username || '', displayName: (u.profile && u.profile.fullname) || u.username || '', active: true };
}

function issue(card, { board, list, users = new Map(), baseUrl = '' } = {}) {
  const labels = ((board && board.labels) || []).filter(l => (card.labelIds || []).includes(l._id)).map(l => l.name || l.color);
  const assigneeId = (card.assignees && card.assignees[0]) || (card.members && card.members[0]);
  const key = issueKey(board, card);
  return {
    id: card._id,
    key,
    self: `${baseUrl}/rest/api/2/issue/${card._id}`,
    fields: {
      summary: card.title || '',
      description: card.description || null,
      project: board ? { id: board._id, key: projectKey(board), name: board.title || '' } : null,
      issuetype: { name: 'Task' },
      status: list ? { id: list._id, name: list.title || '' } : null,
      labels,
      assignee: assigneeId ? user(users.get(assigneeId)) || { accountId: assigneeId } : null,
      reporter: card.userId ? user(users.get(card.userId)) || { accountId: card.userId } : null,
      created: iso(card.createdAt),
      updated: iso(card.modifiedAt || card.dateLastActivity || card.createdAt),
      duedate: ymd(card.dueAt),
      resolution: card.archived ? { name: 'Done' } : null,
    },
  };
}

function transitions(lists) {
  return { transitions: (lists || []).map(l => ({ id: l._id, name: l.title || '', to: { id: l._id, name: l.title || '' } })) };
}

function comment(c, u) {
  return { id: c._id, body: c.comment || c.text || '', author: user(u) || { accountId: c.authorId || c.userId }, created: iso(c.createdAt) };
}

/**
 * The part of JQL WeKan answers: `project = X`, `project in (X, Y)`,
 * `status = "Name"`, `assignee = currentUser()`, `text ~ "word"`, `key = DEV-7`,
 * joined by AND, and ORDER BY created|updated|key [ASC|DESC]. Anything else
 * is an error naming it, rather than an answer to a different question.
 */
function parseJql(jql) {
  const q = { projects: [], statuses: [], assigneeMe: false, text: [], keys: [], order: { field: 'created', dir: 'DESC' } };
  let rest = String(jql || '').trim();
  const ob = /\s*ORDER\s+BY\s+(created|updated|key)(?:\s+(ASC|DESC))?\s*$/i.exec(rest);
  if (ob) {
    q.order = { field: ob[1].toLowerCase(), dir: (ob[2] || 'ASC').toUpperCase() };
    rest = rest.slice(0, ob.index);
  }
  if (!rest.trim()) return q;
  const value = v => v.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  for (const clause of rest.split(/\s+AND\s+/i)) {
    let m;
    if ((m = /^\s*project\s*=\s*("[^"]+"|'[^']+'|\S+)\s*$/i.exec(clause))) q.projects.push(value(m[1]));
    else if ((m = /^\s*project\s+in\s*\(([^)]*)\)\s*$/i.exec(clause))) q.projects.push(...m[1].split(',').map(value).filter(Boolean));
    else if ((m = /^\s*status\s*=\s*("[^"]+"|'[^']+'|\S+)\s*$/i.exec(clause))) q.statuses.push(value(m[1]).toLowerCase());
    else if (/^\s*assignee\s*=\s*currentUser\(\)\s*$/i.test(clause)) q.assigneeMe = true;
    else if ((m = /^\s*(?:text|summary)\s*~\s*("[^"]+"|'[^']+'|\S+)\s*$/i.exec(clause))) q.text.push(value(m[1]).toLowerCase());
    else if ((m = /^\s*(?:key|issuekey)\s*=\s*(\S+)\s*$/i.exec(clause))) q.keys.push(value(m[1]).toUpperCase());
    else throw new Error(`JQL not supported: ${clause.trim().slice(0, 100)}`);
  }
  return q;
}

/** Whether an issue (as issue() makes it) matches a parsed query. */
function matchesJql(i, q, meId) {
  const f = i.fields;
  if (q.statuses.length && !q.statuses.includes(String(f.status && f.status.name).toLowerCase())) return false;
  if (q.assigneeMe && !(f.assignee && f.assignee.accountId === meId)) return false;
  if (q.keys.length && !q.keys.includes(i.key.toUpperCase())) return false;
  const hay = `${f.summary} ${f.description || ''}`.toLowerCase();
  return q.text.every(w => hay.includes(w));
}

function sortIssues(issues, order) {
  const val = i => (order.field === 'key' ? (parseCardKey(i.key) || { number: 0 }).number : Date.parse(i.fields[order.field] ? i.fields[order.field].replace('+0000', 'Z') : 0) || 0);
  return [...issues].sort((a, b) => (order.dir === 'DESC' ? val(b) - val(a) : val(a) - val(b)));
}

/** A WeKan card change from Jira `fields` (POST / PUT /issue): { body, labelNames, error }. */
function issueChange(fields) {
  const f = fields || {};
  const body = {};
  if (f.summary !== undefined) {
    const summary = String(f.summary).replace(/\s+/g, ' ').trim().slice(0, 1000);
    if (!summary) return { error: 'summary: Field is required.' };
    body.title = summary;
  }
  if (f.description !== undefined) body.description = f.description === null ? '' : String(f.description).slice(0, 65536);
  if (f.duedate !== undefined) {
    if (f.duedate === null || f.duedate === '') body.dueAt = '';
    else if (Number.isNaN(Date.parse(f.duedate))) return { error: 'duedate: invalid date' };
    else body.dueAt = new Date(f.duedate).toISOString();
  }
  const labelNames = Array.isArray(f.labels) ? f.labels.map(String) : undefined;
  return { body, labelNames };
}

module.exports = { project, projectKey, issue, issueKey, transitions, comment, user, parseJql, matchesJql, sortIssues, issueChange };
