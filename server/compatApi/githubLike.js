// The optional GitHub- and Gitea-compatible APIs: their REST issue APIs at
// /api/compat/github and /api/compat/gitea/api/v1, translated to WeKan's REST
// API (server/compatApi/core.js: no rights of its own). Shapes:
// models/lib/githubCompatApi.js.
//
// A client sets its API base URL to one of those and its token to a WeKan
// API token (Authorization: token <t> or Bearer <t>; Gitea also ?token=).
// A repository is a board: owner/<board key or id>, any owner name.
import { registerCompatApi, id, CompatError } from '/server/compatApi/core';

const g = require('/models/lib/githubCompatApi');
const vcs = require('/models/lib/versionControlView');

const MAX_CARDS = 2000;
const OWNER = 'wekan';

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

async function boardFor(ctx, name) {
  const wanted = decodeURIComponent(String(name || '')).toLowerCase();
  const { boards } = await myBoards(ctx);
  const board = boards.find(b => b._id.toLowerCase() === wanted || g.repoName(b).toLowerCase() === wanted || (b.slug || '').toLowerCase() === wanted);
  if (!board) throw new CompatError(404, 'Not Found');
  return board;
}

// The board's lists and its issue cards (not releases or wiki pages), once.
async function load(ctx, board) {
  ctx.cache = ctx.cache || new Map();
  if (ctx.cache.has(board._id)) return ctx.cache.get(board._id);
  const lists = await ctx.wekan('GET', `/api/boards/${id(board._id)}/lists`);
  const issueLists = lists.filter(l => ![vcs.RELEASES_LIST_TITLE, vcs.WIKI_LIST_TITLE].includes(l.title));
  const ids = [];
  for (const list of issueLists) {
    // eslint-disable-next-line no-await-in-loop
    for (const c of await ctx.wekan('GET', `/api/boards/${id(board._id)}/lists/${id(list._id)}/cards`)) ids.push(c._id);
    if (ids.length >= MAX_CARDS) break;
  }
  const cards = (await inBatches(ids.slice(0, MAX_CARDS), 8, cardId => ctx.wekan('GET', `/api/cards/${id(cardId)}`).catch(() => null))).filter(Boolean);
  const listTitle = new Map(lists.map(l => [l._id, l.title]));
  const issues = cards.map(card => ({ card, issue: g.issue(card, { board, listTitle: listTitle.get(card.listId) }) }));
  const data = { board, lists, issues };
  ctx.cache.set(board._id, data);
  return data;
}

async function findIssue(ctx, board, number) {
  const data = await load(ctx, board);
  const found = data.issues.find(x => String(x.issue.number) === String(number));
  if (!found) throw new CompatError(404, 'Not Found');
  return { data, ...found };
}

const cardPath = card => `/api/boards/${id(card.boardId)}/lists/${id(card.listId)}/cards/${id(card._id)}`;

async function applyChange(ctx, data, card, change) {
  if (change.error) throw new CompatError(422, change.error);
  const body = { ...change.body };
  if (change.labelNames) {
    body.labelIds = change.labelNames.map(name => ((data.board.labels || []).find(l => (l.name || '').toLowerCase() === name.toLowerCase()) || {})._id).filter(Boolean);
  }
  if (change.state && change.state !== vcs.issueState(card, (data.lists.find(l => l._id === card.listId) || {}).title)) {
    // A synced issue is closed in its own tracker (as in Version Control).
    if (vcs.isSyncedIssue(card)) throw new CompatError(422, 'This issue is synced: open and close it in its tracker.');
    let target = vcs.stateTarget(data.lists, change.state);
    if (target.create) target = { listId: (await ctx.wekan('POST', `/api/boards/${id(card.boardId)}/lists`, { title: target.create }))._id };
    body.listId = id(target.listId);
    if (change.state === 'open' && card.archived) await ctx.wekan('POST', `${cardPath(card)}/unarchive`, {});
  }
  if (Object.keys(body).length) await ctx.wekan('PUT', cardPath(card), body);
}

function routesFor() {
  const R = '^\\/repos\\/[^/]+\\/([^/]+)';
  return [
    { method: 'GET', path: /^\/user\/?$/, run: async (ctx) => { const me = await ctx.wekan('GET', '/api/user'); return { login: me.username, id: me._id, name: (me.profile && me.profile.fullname) || me.username }; } },
    { method: 'GET', path: /^\/user\/repos\/?$/, run: async ctx => (await myBoards(ctx)).boards.map(b => g.repo(b, OWNER)) },
    { method: 'GET', path: new RegExp(`${R}\\/?$`), run: async (ctx, m) => g.repo(await boardFor(ctx, m[1]), OWNER) },
    {
      method: 'GET', path: new RegExp(`${R}\\/issues\\/?$`),
      run: async (ctx, m) => {
        const data = await load(ctx, await boardFor(ctx, m[1]));
        const page = g.listIssues(data.issues.map(x => x.issue), { state: ctx.query.state || 'open', labels: ctx.query.labels,
          page: ctx.query.page, perPage: ctx.query.per_page || ctx.query.limit });
        const link = g.linkHeader(ctx.req.originalUrl || ctx.req.url, page.page, page.last);
        return { status: 200, body: page.rows, headers: { ...(link ? { Link: link } : {}), 'X-Total-Count': String(page.total) } };
      },
    },
    {
      method: 'POST', path: new RegExp(`${R}\\/issues\\/?$`),
      run: async (ctx, m) => {
        const board = await boardFor(ctx, m[1]);
        const change = g.issueChange({ title: '', ...ctx.body });
        if (change.error) throw new CompatError(422, change.error);
        const data = await load(ctx, board);
        let target = vcs.stateTarget(data.lists, 'open');
        if (target.create) target = { listId: (await ctx.wekan('POST', `/api/boards/${id(board._id)}/lists`, { title: target.create }))._id };
        const swimlanes = await ctx.wekan('GET', `/api/boards/${id(board._id)}/swimlanes`);
        const made = await ctx.wekan('POST', `/api/boards/${id(board._id)}/lists/${id(target.listId)}/cards`, {
          title: change.body.title, description: change.body.description || '', swimlaneId: (swimlanes[0] || {})._id });
        const card = await ctx.wekan('GET', `/api/cards/${id(made._id)}`);
        if (change.labelNames) await applyChange(ctx, data, card, { body: {}, labelNames: change.labelNames });
        return { status: 201, body: g.issue(await ctx.wekan('GET', `/api/cards/${id(made._id)}`), { board, listTitle: 'Open' }) };
      },
    },
    { method: 'GET', path: new RegExp(`${R}\\/issues\\/(\\d+)\\/?$`), run: async (ctx, m) => (await findIssue(ctx, await boardFor(ctx, m[1]), m[2])).issue },
    {
      method: 'PATCH', path: new RegExp(`${R}\\/issues\\/(\\d+)\\/?$`),
      run: async (ctx, m) => {
        const board = await boardFor(ctx, m[1]);
        const { data, card } = await findIssue(ctx, board, m[2]);
        await applyChange(ctx, data, card, g.issueChange(ctx.body));
        const fresh = await ctx.wekan('GET', `/api/cards/${id(card._id)}`);
        const lists = await ctx.wekan('GET', `/api/boards/${id(board._id)}/lists`);
        return g.issue(fresh, { board, listTitle: (lists.find(l => l._id === fresh.listId) || {}).title });
      },
    },
    {
      method: 'GET', path: new RegExp(`${R}\\/issues\\/(\\d+)\\/comments\\/?$`),
      run: async (ctx, m) => {
        const { card } = await findIssue(ctx, await boardFor(ctx, m[1]), m[2]);
        return (await ctx.wekan('GET', `/api/boards/${id(card.boardId)}/cards/${id(card._id)}/comments`)).map(c => g.comment(c));
      },
    },
    {
      method: 'POST', path: new RegExp(`${R}\\/issues\\/(\\d+)\\/comments\\/?$`),
      run: async (ctx, m) => {
        const { card } = await findIssue(ctx, await boardFor(ctx, m[1]), m[2]);
        const body = String((ctx.body && ctx.body.body) || '').slice(0, 65536);
        if (!body.trim()) throw new CompatError(422, 'body is required');
        const made = await ctx.wekan('POST', `/api/boards/${id(card.boardId)}/cards/${id(card._id)}/comments`, { comment: body });
        return { status: 201, body: g.comment({ _id: made._id, comment: body, createdAt: new Date() }) };
      },
    },
    { method: 'GET', path: new RegExp(`${R}\\/labels\\/?$`), run: async (ctx, m) => vcs.boardPlainLabels((await boardFor(ctx, m[1])).labels || []).map(g.label) },
    {
      method: 'GET', path: new RegExp(`${R}\\/milestones\\/?$`),
      run: async (ctx, m) => {
        const data = await load(ctx, await boardFor(ctx, m[1]));
        const issues = data.issues.map(x => ({ state: x.issue.state, milestoneIds: (x.card.labelIds || []) }));
        return vcs.boardMilestones(data.board.labels || []).map(ms => g.milestone(ms, issues));
      },
    },
  ];
}

const errorBody = (status, message) => ({ message, documentation_url: '' });
registerCompatApi('github', routesFor(), { errorBody });
registerCompatApi('gitea', routesFor(), { errorBody });
