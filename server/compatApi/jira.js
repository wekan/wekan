// The optional Jira-compatible API: Jira's REST API v2 at
// /api/compat/jira/rest/api/2, translated to WeKan's REST API
// (server/compatApi/core.js: no rights of its own). Shapes:
// models/lib/jiraCompatApi.js.
//
// A client sets its Jira URL to https://<wekan>/api/compat/jira and signs in
// with a WeKan API token: as the password of Basic authentication (any user
// name), or as a Bearer token.
import { registerCompatApi, id, CompatError } from '/server/compatApi/core';

const j = require('/models/lib/jiraCompatApi');
const { parseCardKey } = require('/models/lib/boardKey');

const MAX_CARDS = 2000;
const MAX_RESULTS = 100;

async function inBatches(items, size, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    // eslint-disable-next-line no-await-in-loop
    out.push(...await Promise.all(items.slice(i, i + size).map(fn)));
  }
  return out;
}

async function myBoards(ctx) {
  const me = await ctx.wekan('GET', '/api/user');
  const boards = await inBatches((me.boards || []).map(b => b.boardId).filter(Boolean), 8,
    boardId => ctx.wekan('GET', `/api/boards/${id(boardId)}`).catch(() => null));
  return { me, boards: boards.filter(b => b && !b.archived) };
}

async function boardFor(ctx, idOrKey) {
  const { boards } = await myBoards(ctx);
  const wanted = String(idOrKey || '');
  const board = boards.find(b => b._id === wanted || j.projectKey(b).toUpperCase() === wanted.toUpperCase());
  if (!board) throw new CompatError(404, 'No project could be found with key or id.');
  return board;
}

// A board's lists and full cards, once per request.
async function load(ctx, board) {
  ctx.cache = ctx.cache || new Map();
  if (ctx.cache.has(board._id)) return ctx.cache.get(board._id);
  const lists = await ctx.wekan('GET', `/api/boards/${id(board._id)}/lists`);
  const ids = [];
  for (const list of lists) {
    // eslint-disable-next-line no-await-in-loop
    for (const c of await ctx.wekan('GET', `/api/boards/${id(board._id)}/lists/${id(list._id)}/cards`)) ids.push(c._id);
    if (ids.length >= MAX_CARDS) break;
  }
  const cards = (await inBatches(ids.slice(0, MAX_CARDS), 8, cardId => ctx.wekan('GET', `/api/cards/${id(cardId)}`).catch(() => null))).filter(Boolean);
  const data = { board, lists, cards, listById: new Map(lists.map(l => [l._id, l])) };
  ctx.cache.set(board._id, data);
  return data;
}

const toIssue = (data, card) => j.issue(card, { board: data.board, list: data.listById.get(card.listId) });

async function findIssue(ctx, idOrKey) {
  const parsed = parseCardKey(idOrKey);
  if (parsed) {
    const data = await load(ctx, await boardFor(ctx, parsed.key));
    const card = data.cards.find(c => c.cardNumber === parsed.number);
    if (card) return { data, card };
  } else {
    const card = await ctx.wekan('GET', `/api/cards/${id(idOrKey)}`).catch(() => null);
    if (card) {
      const data = await load(ctx, await boardFor(ctx, card.boardId));
      return { data, card };
    }
  }
  throw new CompatError(404, 'Issue does not exist or you do not have permission to see it.');
}

async function search(ctx, jql, startAt, maxResults) {
  let q;
  try { q = j.parseJql(jql); } catch (e) { throw new CompatError(400, e.message); }
  const { me, boards } = await myBoards(ctx);
  const projects = q.projects.length ? boards.filter(b => q.projects.some(p => p === b._id || p.toUpperCase() === j.projectKey(b).toUpperCase())) : boards;
  let issues = [];
  for (const board of projects) {
    // eslint-disable-next-line no-await-in-loop
    const data = await load(ctx, board);
    issues.push(...data.cards.filter(c => !c.archived).map(c => toIssue(data, c)));
  }
  issues = j.sortIssues(issues.filter(i => j.matchesJql(i, q, me._id)), q.order);
  const start = Math.max(0, Number(startAt) || 0);
  const max = Math.min(MAX_RESULTS, Math.max(0, Number(maxResults) || 50));
  return { startAt: start, maxResults: max, total: issues.length, issues: issues.slice(start, start + max) };
}

async function applyChange(ctx, data, card, change, { listId } = {}) {
  if (change.error) throw new CompatError(400, change.error);
  const body = { ...change.body };
  if (change.labelNames) {
    body.labelIds = change.labelNames.map(name => ((data.board.labels || []).find(l => l.name === name) || {})._id).filter(Boolean);
  }
  if (listId && listId !== card.listId) body.listId = id(listId);
  if (Object.keys(body).length) await ctx.wekan('PUT', `/api/boards/${id(card.boardId)}/lists/${id(card.listId)}/cards/${id(card._id)}`, body);
}

const routes = [
  { method: 'GET', path: /^\/myself\/?$/, run: async ctx => j.user(await ctx.wekan('GET', '/api/user')) },
  { method: 'GET', path: /^\/project\/?$/, run: async ctx => (await myBoards(ctx)).boards.map(b => j.project(b)) },
  { method: 'GET', path: /^\/project\/([^/]+)\/?$/, run: async (ctx, m) => j.project(await boardFor(ctx, decodeURIComponent(m[1]))) },
  { method: 'GET', path: /^\/project\/([^/]+)\/statuses\/?$/, run: async (ctx, m) => {
    const data = await load(ctx, await boardFor(ctx, decodeURIComponent(m[1])));
    return [{ name: 'Task', statuses: data.lists.map(l => ({ id: l._id, name: l.title })) }];
  } },
  { method: 'GET', path: /^\/search\/?$/, run: async ctx => search(ctx, ctx.query.jql, ctx.query.startAt, ctx.query.maxResults) },
  { method: 'POST', path: /^\/search\/?$/, run: async ctx => search(ctx, ctx.body.jql, ctx.body.startAt, ctx.body.maxResults) },
  { method: 'GET', path: /^\/issue\/([^/]+)\/?$/, run: async (ctx, m) => { const { data, card } = await findIssue(ctx, decodeURIComponent(m[1])); return toIssue(data, card); } },
  {
    method: 'POST', path: /^\/issue\/?$/,
    run: async (ctx) => {
      const fields = (ctx.body && ctx.body.fields) || {};
      const projectRef = fields.project && (fields.project.key || fields.project.id);
      const board = await boardFor(ctx, projectRef);
      const change = j.issueChange({ summary: '', ...fields });
      if (change.error) throw new CompatError(400, change.error);
      const data = await load(ctx, board);
      const list = data.lists[0];
      if (!list) throw new CompatError(400, 'project has no list for a new issue');
      const swimlanes = await ctx.wekan('GET', `/api/boards/${id(board._id)}/swimlanes`);
      const made = await ctx.wekan('POST', `/api/boards/${id(board._id)}/lists/${id(list._id)}/cards`, {
        title: change.body.title, description: change.body.description || '', swimlaneId: (swimlanes[0] || {})._id,
        ...(change.body.dueAt ? { dueAt: change.body.dueAt } : {}),
      });
      const card = await ctx.wekan('GET', `/api/cards/${id(made._id)}`);
      if (change.labelNames) await applyChange(ctx, data, card, { body: {}, labelNames: change.labelNames });
      const issue = j.issue(card, { board, list });
      return { status: 201, body: { id: issue.id, key: issue.key, self: issue.self } };
    },
  },
  {
    method: 'PUT', path: /^\/issue\/([^/]+)\/?$/,
    run: async (ctx, m) => {
      const { data, card } = await findIssue(ctx, decodeURIComponent(m[1]));
      await applyChange(ctx, data, card, j.issueChange((ctx.body && ctx.body.fields) || {}));
      return { status: 204 };
    },
  },
  // Jira deletes; WeKan archives (restorable), as WeKan's REST API allows.
  {
    method: 'DELETE', path: /^\/issue\/([^/]+)\/?$/,
    run: async (ctx, m) => {
      const { card } = await findIssue(ctx, decodeURIComponent(m[1]));
      await ctx.wekan('POST', `/api/boards/${id(card.boardId)}/lists/${id(card.listId)}/cards/${id(card._id)}/archive`, {});
      return { status: 204 };
    },
  },
  {
    method: 'GET', path: /^\/issue\/([^/]+)\/comment\/?$/,
    run: async (ctx, m) => {
      const { card } = await findIssue(ctx, decodeURIComponent(m[1]));
      const comments = (await ctx.wekan('GET', `/api/boards/${id(card.boardId)}/cards/${id(card._id)}/comments`)).map(c => j.comment(c));
      return { startAt: 0, maxResults: comments.length, total: comments.length, comments };
    },
  },
  {
    method: 'POST', path: /^\/issue\/([^/]+)\/comment\/?$/,
    run: async (ctx, m) => {
      const { card } = await findIssue(ctx, decodeURIComponent(m[1]));
      const body = String((ctx.body && ctx.body.body) || '').slice(0, 65536);
      if (!body.trim()) throw new CompatError(400, 'Comment body can not be empty!');
      const made = await ctx.wekan('POST', `/api/boards/${id(card.boardId)}/cards/${id(card._id)}/comments`, { comment: body });
      return { status: 201, body: j.comment({ _id: made._id, comment: body, authorId: '', createdAt: new Date() }) };
    },
  },
  { method: 'GET', path: /^\/issue\/([^/]+)\/transitions\/?$/, run: async (ctx, m) => { const { data } = await findIssue(ctx, decodeURIComponent(m[1])); return j.transitions(data.lists); } },
  {
    method: 'POST', path: /^\/issue\/([^/]+)\/transitions\/?$/,
    run: async (ctx, m) => {
      const { data, card } = await findIssue(ctx, decodeURIComponent(m[1]));
      const target = ctx.body && ctx.body.transition && String(ctx.body.transition.id || '');
      if (!data.listById.has(target)) throw new CompatError(400, 'Transition id is not valid for this issue.');
      await applyChange(ctx, data, card, { body: {} }, { listId: target });
      return { status: 204 };
    },
  },
];

registerCompatApi('jira', routes, { errorBody: (status, message) => ({ errorMessages: [message], errors: {} }) });
