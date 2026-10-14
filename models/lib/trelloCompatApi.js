'use strict';

// The optional Trello-compatible API (#4930): a client written for Trello's
// REST API - Trellinator, a script, a mobile app - can use WeKan as its
// backend: what it saves is stored in WeKan's database, on WeKan boards,
// under WeKan's permissions. Off unless Admin Panel / Settings / Visibility /
// Optional APIs turns it on (models/lib/optionalApis.js).
//
// This module is the translation, both ways, and nothing else: WeKan
// documents as the JSON Trello's API answers with, and a Trello request's
// fields as a WeKan change. Pure: tests/trelloCompatApi.test.cjs. The routes
// are server/routes/trelloCompatApi.js, and every one of them checks the
// caller's WeKan rights on the board, as the WeKan REST API does.

// Trello's label colours, with or without _light / _dark. A WeKan colour
// Trello does not have is sent as null (Trello's "no colour").
const TRELLO_COLORS = ['green', 'yellow', 'orange', 'red', 'purple', 'blue', 'sky', 'lime', 'pink', 'black'];

const iso = d => (d ? new Date(d).toISOString() : null);

function trelloColor(color) {
  const base = String(color || '').replace(/_(light|dark)$/, '');
  return TRELLO_COLORS.includes(base) ? base : null;
}

function wekanColor(color) {
  const base = String(color || '').replace(/_(light|dark)$/, '');
  return TRELLO_COLORS.includes(base) ? base : 'black';
}

const shortLink = id => String(id || '').slice(0, 8);

function label(l, boardId) {
  return { id: l._id, idBoard: boardId, name: l.name || '', color: trelloColor(l.color) };
}

function board(b, { baseUrl = '' } = {}) {
  return {
    id: b._id,
    name: b.title || '',
    desc: b.description || '',
    closed: !!b.archived,
    idOrganization: null,
    pinned: false,
    url: `${baseUrl}/b/${b._id}/${b.slug || 'board'}`,
    shortLink: shortLink(b._id),
    shortUrl: `${baseUrl}/b/${b._id}/${b.slug || 'board'}`,
    // An instance board (every signed-in user) is Trello's organization level.
    prefs: { permissionLevel: b.permission === 'public' ? 'public' : (b.permission === 'instance' ? 'org' : 'private'), background: b.color || 'blue' },
    labelNames: Object.fromEntries((b.labels || []).filter(l => trelloColor(l.color)).map(l => [trelloColor(l.color), l.name || ''])),
    dateLastActivity: iso(b.modifiedAt || b.createdAt),
  };
}

function list(l) {
  return { id: l._id, name: l.title || '', closed: !!l.archived, idBoard: l.boardId, pos: Number(l.sort) || 0, subscribed: false };
}

function card(c, { board: b, baseUrl = '' } = {}) {
  const labels = ((b && b.labels) || []).filter(l => (c.labelIds || []).includes(l._id));
  const url = b ? `${baseUrl}/b/${b._id}/${b.slug || 'board'}/${c._id}` : '';
  return {
    id: c._id,
    name: c.title || '',
    desc: c.description || '',
    closed: !!c.archived,
    idBoard: c.boardId,
    idList: c.listId,
    idMembers: [...new Set([...(c.members || []), ...(c.assignees || [])])],
    idLabels: labels.map(l => l._id),
    labels: labels.map(l => label(l, c.boardId)),
    pos: Number(c.sort) || 0,
    due: iso(c.dueAt),
    dueComplete: !!c.dueComplete,
    start: iso(c.startAt),
    dateLastActivity: iso(c.dateLastActivity || c.modifiedAt || c.createdAt),
    idShort: Number.isInteger(c.cardNumber) ? c.cardNumber : 0,
    shortLink: shortLink(c._id),
    shortUrl: url,
    url,
  };
}

function member(u) {
  const profile = (u && u.profile) || {};
  return { id: u._id, username: u.username || '', fullName: profile.fullname || u.username || '', initials: profile.initials || '' };
}

function commentAction(comment, user) {
  return {
    id: comment._id,
    type: 'commentCard',
    date: iso(comment.createdAt),
    idMemberCreator: comment.userId,
    data: { text: comment.text || '', card: { id: comment.cardId }, board: { id: comment.boardId } },
    memberCreator: user ? member(user) : { id: comment.userId },
  };
}

function checklist(cl, items) {
  return {
    id: cl._id,
    name: cl.title || '',
    idCard: cl.cardId,
    idBoard: cl.boardId,
    pos: Number(cl.sort) || 0,
    checkItems: (items || []).map(i => ({ id: i._id, name: i.title || '', state: i.isFinished ? 'complete' : 'incomplete', idChecklist: cl._id, pos: Number(i.sort) || 0 })),
  };
}

// Trello sends booleans and numbers as strings in query parameters too.
function bool(v) {
  if (v === true || v === false) return v;
  if (v === undefined || v === null || v === '') return undefined;
  return String(v) === 'true';
}

function text(v, max) {
  if (v === undefined || v === null) return undefined;
  return String(v).slice(0, max);
}

/**
 * A card change from a Trello request's fields (POST /1/cards, PUT /1/cards/:id):
 * { set, unset, idList, pos, error }. Only fields Trello's API documents for
 * cards are read; anything else is ignored, as Trello ignores it.
 */
function cardChange(fields) {
  const f = fields || {};
  const set = {};
  const unset = {};
  const name = text(f.name, 1000);
  if (name !== undefined) {
    if (!name.trim()) return { error: 'invalid value for name' };
    set.title = name;
  }
  const desc = text(f.desc, 65536);
  if (desc !== undefined) set.description = desc;
  const closed = bool(f.closed);
  if (closed !== undefined) { set.archived = closed; if (closed) set.archivedAt = new Date(); }
  for (const [from, to] of [['due', 'dueAt'], ['start', 'startAt']]) {
    if (f[from] === undefined) continue;
    if (f[from] === null || f[from] === '' || f[from] === 'null') { unset[to] = ''; continue; }
    const d = new Date(f[from]);
    if (Number.isNaN(d.getTime())) return { error: `invalid value for ${from}` };
    set[to] = d;
  }
  const dueComplete = bool(f.dueComplete);
  if (dueComplete !== undefined) set.dueComplete = dueComplete;
  const idList = f.idList !== undefined ? String(f.idList) : undefined;
  let pos;
  if (f.pos !== undefined) {
    if (f.pos === 'top' || f.pos === 'bottom') pos = f.pos;
    else if (Number.isFinite(Number(f.pos))) pos = Number(f.pos);
    else return { error: 'invalid value for pos' };
  }
  const idLabels = f.idLabels === undefined ? undefined
    : (Array.isArray(f.idLabels) ? f.idLabels : String(f.idLabels).split(',')).map(s => String(s).trim()).filter(Boolean);
  const idMembers = f.idMembers === undefined ? undefined
    : (Array.isArray(f.idMembers) ? f.idMembers : String(f.idMembers).split(',')).map(s => String(s).trim()).filter(Boolean);
  return { set, unset, idList, pos, idLabels, idMembers };
}

module.exports = {
  TRELLO_COLORS, trelloColor, wekanColor, board, list, card, label, member, commentAction, checklist, cardChange, bool,
};
