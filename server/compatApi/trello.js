// The optional Trello-compatible API (#4930): Trello's REST API at
// /api/compat/trello/1, translated to WeKan's REST API (server/compatApi/core.js:
// no rights of its own). The shapes are models/lib/trelloCompatApi.js.
//
// A client sets its server to https://<wekan>/api/compat/trello and its token
// to a WeKan API token (?token=, or Authorization: Bearer / OAuth
// oauth_token=); Trello's ?key= is accepted and ignored.
import { registerCompatApi, id, CompatError } from '/server/compatApi/core';

const t = require('/models/lib/trelloCompatApi');

const MAX_CARDS = 2000;

async function inBatches(items, size, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    // eslint-disable-next-line no-await-in-loop
    out.push(...await Promise.all(items.slice(i, i + size).map(fn)));
  }
  return out;
}

const me = async ctx => ctx.wekan('GET', '/api/user');
const board = async (ctx, boardId) => ctx.wekan('GET', `/api/boards/${id(boardId)}`);
const fullCard = async (ctx, cardId) => ctx.wekan('GET', `/api/cards/${id(cardId)}`);

async function cardsOf(ctx, boardId, listIds) {
  const b = await board(ctx, boardId);
  const lists = listIds || (await ctx.wekan('GET', `/api/boards/${id(boardId)}/lists`)).map(l => l._id);
  const ids = [];
  for (const listId of lists) {
    // eslint-disable-next-line no-await-in-loop
    for (const c of await ctx.wekan('GET', `/api/boards/${id(boardId)}/lists/${id(listId)}/cards`)) ids.push(c._id);
    if (ids.length >= MAX_CARDS) break;
  }
  const cards = await inBatches(ids.slice(0, MAX_CARDS), 8, cardId => fullCard(ctx, cardId));
  return cards.filter(c => c && !c.archived).map(c => t.card(c, { board: b }));
}

// The fields WeKan's card PUT reads, from a Trello card change.
function wekanCardFields(change) {
  const body = {};
  if (change.set.title !== undefined) body.title = change.set.title;
  if (change.set.description !== undefined) body.description = change.set.description;
  for (const f of ['dueAt', 'startAt']) {
    if (change.set[f]) body[f] = change.set[f].toISOString();
    if (change.unset[f] !== undefined) body[f] = '';
  }
  if (change.set.dueComplete !== undefined) body.dueComplete = change.set.dueComplete;
  if (change.idLabels) body.labelIds = change.idLabels;
  if (change.idMembers) body.members = change.idMembers;
  if (typeof change.pos === 'number') body.sort = change.pos;
  return body;
}

async function updateCard(ctx, card, change) {
  if (change.error) throw new CompatError(400, change.error);
  const path = `/api/boards/${id(card.boardId)}/lists/${id(card.listId)}/cards/${id(card._id)}`;
  const body = wekanCardFields(change);
  if (change.idList && change.idList !== card.listId) body.listId = id(change.idList);
  if (Object.keys(body).length) await ctx.wekan('PUT', path, body);
  const listId = body.listId || card.listId;
  if (change.set.archived === true) await ctx.wekan('POST', `/api/boards/${id(card.boardId)}/lists/${id(listId)}/cards/${id(card._id)}/archive`, {});
  if (change.set.archived === false && card.archived) await ctx.wekan('POST', `/api/boards/${id(card.boardId)}/lists/${id(listId)}/cards/${id(card._id)}/unarchive`, {});
  const b = await board(ctx, card.boardId);
  return t.card(await fullCard(ctx, card._id), { board: b });
}

const fields = ctx => ({ ...ctx.query, ...ctx.body });

const routes = [
  { method: 'GET', path: /^\/members\/me\/?$/, run: async ctx => t.member(await me(ctx)) },
  {
    method: 'GET', path: /^\/members\/me\/boards\/?$/,
    run: async (ctx) => {
      const user = await me(ctx);
      const ids = (user.boards || []).map(b => b.boardId).filter(Boolean);
      const boards = await inBatches(ids, 8, async boardId => board(ctx, boardId).catch(() => null));
      return boards.filter(Boolean).map(b => t.board(b));
    },
  },
  { method: 'GET', path: /^\/boards\/([^/]+)\/?$/, run: async (ctx, m) => t.board(await board(ctx, m[1])) },
  {
    method: 'GET', path: /^\/boards\/([^/]+)\/lists\/?$/,
    run: async (ctx, m) => (await ctx.wekan('GET', `/api/boards/${id(m[1])}/lists`))
      .map((l, i) => t.list({ ...l, boardId: m[1], sort: i })),
  },
  { method: 'GET', path: /^\/boards\/([^/]+)\/cards\/?$/, run: async (ctx, m) => cardsOf(ctx, m[1]) },
  { method: 'GET', path: /^\/boards\/([^/]+)\/labels\/?$/, run: async (ctx, m) => ((await board(ctx, m[1])).labels || []).map(l => t.label(l, m[1])) },
  {
    method: 'GET', path: /^\/boards\/([^/]+)\/members\/?$/,
    run: async (ctx, m) => {
      const b = await board(ctx, m[1]);
      return (b.members || []).filter(x => x.isActive !== false).map(x => ({ id: x.userId, username: x.username || '', fullName: x.fullname || '' }));
    },
  },
  {
    method: 'POST', path: /^\/boards\/([^/]+)\/labels\/?$/,
    run: async (ctx, m) => {
      const f = fields(ctx);
      const name = String(f.name || '').slice(0, 200);
      await ctx.wekan('PUT', `/api/boards/${id(m[1])}/labels`, { label: { name, color: t.wekanColor(f.color) } });
      const labels = (await board(ctx, m[1])).labels || [];
      const made = [...labels].reverse().find(l => l.name === name);
      return made ? t.label(made, m[1]) : { status: 400, body: { message: 'label not created' } };
    },
  },
  {
    method: 'GET', path: /^\/lists\/([^/]+)\/cards\/?$/,
    run: async (ctx, m) => {
      const boardId = id(ctx.query.idBoard || '');
      return cardsOf(ctx, boardId, [id(m[1])]);
    },
  },
  {
    method: 'POST', path: /^\/lists\/?$/,
    run: async (ctx) => {
      const f = fields(ctx);
      const created = await ctx.wekan('POST', `/api/boards/${id(f.idBoard)}/lists`, { title: String(f.name || '').slice(0, 1000) });
      return t.list({ _id: created._id, title: f.name, boardId: f.idBoard, sort: 0 });
    },
  },
  {
    method: 'PUT', path: /^\/lists\/([^/]+)\/?$/,
    run: async (ctx, m) => {
      const f = fields(ctx);
      const boardId = id(f.idBoard || ctx.query.idBoard || '');
      if (f.name !== undefined) await ctx.wekan('PUT', `/api/boards/${boardId}/lists/${id(m[1])}`, { title: String(f.name).slice(0, 1000) });
      const closed = t.bool(f.closed);
      if (closed !== undefined) await ctx.wekan('POST', `/api/boards/${boardId}/lists/${id(m[1])}/${closed ? 'archive' : 'unarchive'}`, {});
      const list = await ctx.wekan('GET', `/api/boards/${boardId}/lists/${id(m[1])}`);
      return t.list({ ...list, boardId });
    },
  },
  {
    method: 'GET', path: /^\/cards\/([^/]+)\/?$/,
    run: async (ctx, m) => {
      const c = await fullCard(ctx, m[1]);
      return t.card(c, { board: await board(ctx, c.boardId) });
    },
  },
  {
    method: 'POST', path: /^\/cards\/?$/,
    run: async (ctx) => {
      const f = fields(ctx);
      const change = t.cardChange({ name: f.name || '', ...f });
      if (change.error) throw new CompatError(400, change.error);
      const listId = id(f.idList);
      const list = await ctx.wekan('GET', `/api/boards/${id(f.idBoard || ctx.query.idBoard || (await findBoardOfList(ctx, listId)))}/lists/${listId}`);
      const boardId = list.boardId;
      const b = await board(ctx, boardId);
      const swimlanes = await ctx.wekan('GET', `/api/boards/${id(boardId)}/swimlanes`);
      const created = await ctx.wekan('POST', `/api/boards/${id(boardId)}/lists/${listId}/cards`, {
        title: change.set.title, description: change.set.description || '', swimlaneId: (swimlanes[0] || {})._id,
        ...(change.set.dueAt ? { dueAt: change.set.dueAt.toISOString() } : {}),
        ...(change.idMembers ? { members: change.idMembers } : {}),
      });
      const card = await fullCard(ctx, created._id);
      if (change.idLabels) return updateCard(ctx, card, { set: {}, unset: {}, idLabels: change.idLabels });
      return t.card(card, { board: b });
    },
  },
  { method: 'PUT', path: /^\/cards\/([^/]+)\/?$/, run: async (ctx, m) => updateCard(ctx, await fullCard(ctx, m[1]), t.cardChange(fields(ctx))) },
  // Trello deletes; WeKan archives - an archived card is restorable, and
  // WeKan's REST API decides whether the caller may archive it.
  { method: 'DELETE', path: /^\/cards\/([^/]+)\/?$/, run: async (ctx, m) => { await updateCard(ctx, await fullCard(ctx, m[1]), { set: { archived: true }, unset: {} }); return {}; } },
  {
    method: 'GET', path: /^\/cards\/([^/]+)\/actions\/?$/,
    run: async (ctx, m) => {
      const c = await fullCard(ctx, m[1]);
      const comments = await ctx.wekan('GET', `/api/boards/${id(c.boardId)}/cards/${id(c._id)}/comments`);
      return comments.map(x => t.commentAction({ _id: x._id, text: x.comment || x.text, userId: x.authorId || x.userId,
        createdAt: x.createdAt, cardId: c._id, boardId: c.boardId }));
    },
  },
  {
    method: 'POST', path: /^\/cards\/([^/]+)\/actions\/comments\/?$/,
    run: async (ctx, m) => {
      const c = await fullCard(ctx, m[1]);
      const text = String(fields(ctx).text || '').slice(0, 65536);
      if (!text.trim()) throw new CompatError(400, 'invalid value for text');
      const made = await ctx.wekan('POST', `/api/boards/${id(c.boardId)}/cards/${id(c._id)}/comments`, { comment: text });
      return t.commentAction({ _id: made._id, text, cardId: c._id, boardId: c.boardId, createdAt: new Date() });
    },
  },
  {
    method: 'POST', path: /^\/cards\/([^/]+)\/idLabels\/?$/,
    run: async (ctx, m) => {
      const c = await fullCard(ctx, m[1]);
      const value = id(fields(ctx).value);
      await updateCard(ctx, c, { set: {}, unset: {}, idLabels: [...new Set([...(c.labelIds || []), value])] });
      return [value];
    },
  },
  {
    method: 'DELETE', path: /^\/cards\/([^/]+)\/idLabels\/([^/]+)\/?$/,
    run: async (ctx, m) => {
      const c = await fullCard(ctx, m[1]);
      await updateCard(ctx, c, { set: {}, unset: {}, idLabels: (c.labelIds || []).filter(x => x !== m[2]) });
      return {};
    },
  },
  {
    method: 'GET', path: /^\/cards\/([^/]+)\/checklists\/?$/,
    run: async (ctx, m) => {
      const c = await fullCard(ctx, m[1]);
      return (c.checklists || []).map(cl => t.checklist({ ...cl, cardId: c._id, boardId: c.boardId }, cl.items || []));
    },
  },
  {
    method: 'POST', path: /^\/checklists\/?$/,
    run: async (ctx) => {
      const f = fields(ctx);
      const c = await fullCard(ctx, f.idCard);
      const made = await ctx.wekan('POST', `/api/boards/${id(c.boardId)}/cards/${id(c._id)}/checklists`, { title: String(f.name || 'Checklist').slice(0, 1000) });
      return t.checklist({ _id: made._id, title: f.name || 'Checklist', cardId: c._id, boardId: c.boardId }, []);
    },
  },
];

// A list's board, for a client that names only the list (POST /1/cards).
async function findBoardOfList(ctx, listId) {
  const user = await me(ctx);
  for (const b of (user.boards || [])) {
    const { boardId } = b;
    // eslint-disable-next-line no-await-in-loop
    const lists = await ctx.wekan('GET', `/api/boards/${id(boardId)}/lists`).catch(() => []);
    if (lists.some(l => l._id === listId)) return boardId;
  }
  throw new CompatError(404, 'list not found');
}

registerCompatApi('trello', routes, { errorBody: (status, message) => ({ message, error: message }) });
