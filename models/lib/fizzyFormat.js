// Fizzy (37signals, basecamp/fizzy on GitHub): its two exports read
// as a board, and a board written as the account export Fizzy imports. Plain
// JavaScript, so tests/fizzyFormat.test.cjs runs it in Node.
//
// Fizzy writes two .zip files, both read here (server/lib/fizzyArchive.js
// opens them):
//
//   Account export (Account settings -> Export; Account::Export,
//   app/models/account/data_transfer/*): a row of each table as
//   data/<table>/<id>.json with every column, data/account.json, the users as
//   data/users/<id>.json, rich text as data/action_text_rich_texts/<id>.json,
//   and the uploaded files as storage/<blob key>. Fizzy's own account import
//   reads this zip back, and it is what WeKan exports (formatFizzy).
//
//   Personal data export (User::DataExport, Card::Exportable): <number>.json
//   for every card the user can see - number, title, board, status,
//   creator { id, name, email }, description (HTML), created_at, updated_at,
//   comments [{ id, body, creator, created_at }] - and its files under
//   <number>/<blob key>_<filename>.
//
// A board maps as Fizzy shows it:
//   a Fizzy board                -> a swimlane (with "One board per project",
//                                   a board of its own)
//   its columns, by position     -> lists, after "Maybe?" - the cards not yet
//                                   triaged into a column - and before
//                                   "Not now" (postponed) and "Done" (closed),
//                                   the names Fizzy itself exports
//   a card                       -> a card: title, description, created,
//                                   due date (due_on)
//   tags                         -> labels
//   assignments                  -> the card's members, the first its owner
//   steps                        -> the "Steps" checklist
//   comments                     -> comments, by their author, at their time
//   golden                       -> the card's colour, gold
//   files in a description or comment, and the account export's card images
//                                -> the card's attachments
// Drafts (never published), reactions, watchers, pins, boosts, events and
// notifications are not imported; how many is reported.

import { vikunjaHtmlToText, vikunjaHtml } from './vikunjaFormat.js';

export const FIZZY_TRIAGE = 'Maybe?';
export const FIZZY_NOT_NOW = 'Not now';
export const FIZZY_DONE = 'Done';
const STEPS = 'Steps';
// Fizzy's card colours (app/models/color.rb); a column is written with the first.
export const FIZZY_DEFAULT_COLOR = 'var(--color-card-default)';
// The tables of an account export that are read; the rest are counted.
export const FIZZY_TABLES = ['boards', 'columns', 'cards', 'comments', 'steps', 'tags', 'taggings', 'assignments',
  'closures', 'card_not_nows', 'card_goldnesses', 'action_text_rich_texts', 'active_storage_blobs',
  'active_storage_attachments'];
const COUNTED = { reactions: 'reaction(s)', watches: 'watcher(s)', pins: 'pin(s)' };

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const list = value => (Array.isArray(value) ? value : []);
const str = value => (typeof value === 'string' ? value : value === undefined || value === null ? '' : String(value));
const html = value => vikunjaHtmlToText(str(value), { checklists: false }).text;

// ----- Import --------------------------------------------------------------

// data: an account export as { account, users, tables: { table: [rows] },
// files: { blob key: base64 } }; a personal data export as
// { cards: [card JSON], files: { path: base64 } }; or one card's JSON (its
// text, or parsed).
export function parseFizzyExport(data) {
  let value = data;
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch (error) { throw new Error('Not a Fizzy export: not JSON'); }
  }
  if (isObject(value) && isObject(value.tables)) return fizzyAccountBoard(value);
  if (isObject(value) && Array.isArray(value.cards)) return fizzyCardsBoard(value.cards, value.files);
  if (Array.isArray(value)) return fizzyCardsBoard(value, {});
  if (isObject(value) && value.number !== undefined && typeof value.title === 'string') return fizzyCardsBoard([value], {});
  throw new Error('Not a Fizzy export: no data/ tables and no card files');
}

function board(name, swimlanes, columns, tasks, unsupported) {
  return {
    board: { name: name || 'Imported Fizzy' },
    columns: columns.map(title => ({ title })),
    swimlanes: (swimlanes.length ? swimlanes : ['Default']).map(n => ({ name: n })),
    tasks,
    warnings: [],
    unsupported,
  };
}

// The lists in the order Fizzy shows them: Maybe? first, the columns, then
// Not now and Done.
function orderedColumns(columnNames, used) {
  const special = [FIZZY_TRIAGE, FIZZY_NOT_NOW, FIZZY_DONE];
  const middle = [];
  for (const name of [...columnNames, ...used]) if (name && !middle.includes(name) && !special.includes(name)) middle.push(name);
  return [...(used.has(FIZZY_TRIAGE) ? [FIZZY_TRIAGE] : []), ...middle, ...[FIZZY_NOT_NOW, FIZZY_DONE].filter(name => used.has(name))];
}

// The personal data export: each card names its board and status.
function fizzyCardsBoard(cards, files = {}) {
  const valid = list(cards).filter(card => isObject(card) && card.number !== undefined && typeof card.title === 'string');
  if (!valid.length) throw new Error('Not a Fizzy export: no cards');
  const swimlanes = [];
  const used = new Set();
  let attachmentsMissing = 0;
  const person = user => (isObject(user) ? str(user.id) || str(user.email) || str(user.name) : '');
  const name = user => (isObject(user) ? str(user.name) : '');
  const tasks = valid.sort((a, b) => Number(a.number) - Number(b.number)).map(card => {
    const swimlane = str(card.board) || 'Fizzy';
    if (!swimlanes.includes(swimlane)) swimlanes.push(swimlane);
    const column = str(card.status) || FIZZY_TRIAGE;
    used.add(column);
    // A file is named in the HTML by its path in the zip: <number>/<key>_<name>.
    const attachments = [];
    const seen = new Set();
    for (const source of [card.description, ...list(card.comments).map(c => c && c.body)]) {
      for (const match of str(source).matchAll(/(?:src|href)="([^"]+)"/g)) {
        const path = match[1];
        if (seen.has(path) || /^[a-z]+:/i.test(path) || !path.startsWith(`${card.number}/`)) continue;
        seen.add(path);
        if (files && typeof files[path] === 'string') {
          attachments.push({ name: path.slice(path.indexOf('/') + 1).replace(/^[^_]*_/, '') || 'attachment', file: files[path] });
        } else attachmentsMissing += 1;
      }
    }
    return {
      title: str(card.title) || `#${card.number}`,
      description: html(card.description),
      column_name: column,
      swimlane_name: swimlane,
      date_creation: card.created_at,
      ...(person(card.creator) ? { requested_by: name(card.creator) || person(card.creator) } : {}),
      comments: list(card.comments).filter(isObject).map(comment => ({
        text: html(comment.body), author: person(comment.creator), authorName: name(comment.creator), date: comment.created_at,
      })).filter(comment => comment.text),
      ...(column === FIZZY_DONE ? { due_complete: true } : {}),
      ...(attachments.length ? { attachments } : {}),
    };
  });
  const unsupported = [];
  if (attachmentsMissing) unsupported.push({ path: '/attachments', reason: `${attachmentsMissing} file(s) the export names are not in it` });
  return board('Imported Fizzy', swimlanes, orderedColumns([], used), tasks, unsupported);
}

// The account export: the rows of each table.
function fizzyAccountBoard({ account = {}, users = [], tables = {}, files = {}, counts = {} }) {
  const rows = table => list(tables[table]).filter(isObject);
  const byId = (table) => new Map(rows(table).map(row => [str(row.id), row]));
  const people = new Map(list(users).filter(isObject).map(user => [str(user.id), user]));
  const boards = byId('boards');
  const columns = byId('columns');
  const tags = byId('tags');
  const by = (table, key) => {
    const out = new Map();
    for (const row of rows(table)) {
      const id = str(row[key]);
      if (!out.has(id)) out.set(id, []);
      out.get(id).push(row);
    }
    return out;
  };
  const taggings = by('taggings', 'card_id');
  const assignments = by('assignments', 'card_id');
  const steps = by('steps', 'card_id');
  const comments = by('comments', 'card_id');
  const closed = new Set(rows('closures').map(row => str(row.card_id)));
  const notNow = new Set(rows('card_not_nows').map(row => str(row.card_id)));
  const golden = new Set(rows('card_goldnesses').map(row => str(row.card_id)));
  // Rich text: a card's description, a comment's body.
  const richText = new Map(rows('action_text_rich_texts').map(row => [`${row.record_type}:${row.record_id}:${row.name}`, row]));
  const blobs = byId('active_storage_blobs');
  // A file attached to a card, or embedded in its description or a comment.
  const fileRecords = new Map();
  for (const row of rows('active_storage_attachments')) {
    const key = `${row.record_type}:${row.record_id}`;
    if (!fileRecords.has(key)) fileRecords.set(key, []);
    fileRecords.get(key).push(row);
  }
  const filesOf = (type, id) => list(fileRecords.get(`${type}:${id}`)).map(row => blobs.get(str(row.blob_id))).filter(Boolean);
  const person = id => str(id);
  const personName = id => str(people.get(str(id)) && people.get(str(id)).name);

  const used = new Set();
  const swimlanes = [];
  const columnOrder = [...columns.values()].sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0)
    || str(a.created_at).localeCompare(str(b.created_at))).map(column => str(column.name));
  let drafts = 0;
  let missingFiles = 0;
  const cards = rows('cards').sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0));
  const tasks = [];
  for (const card of cards) {
    if (card.status === 'drafted') { drafts += 1; continue; }
    const id = str(card.id);
    const fizzyBoard = boards.get(str(card.board_id));
    const swimlane = str(fizzyBoard && fizzyBoard.name) || 'Fizzy';
    if (!swimlanes.includes(swimlane)) swimlanes.push(swimlane);
    // As Card::Exportable#export_status decides it.
    const column = closed.has(id) ? FIZZY_DONE : notNow.has(id) ? FIZZY_NOT_NOW
      : (columns.get(str(card.column_id)) ? str(columns.get(str(card.column_id)).name) : FIZZY_TRIAGE);
    used.add(column);
    const description = richText.get(`Card:${id}:description`);
    const cardComments = list(comments.get(id)).sort((a, b) => str(a.created_at).localeCompare(str(b.created_at)));
    const attachments = [];
    const blobsOf = [
      ...filesOf('Card', id),
      ...(description ? filesOf('ActionText::RichText', description.id) : []),
      ...cardComments.flatMap(comment => {
        const body = richText.get(`Comment:${comment.id}:body`);
        return body ? filesOf('ActionText::RichText', body.id) : [];
      }),
    ];
    const seenBlobs = new Set();
    for (const blob of blobsOf) {
      if (seenBlobs.has(blob.id)) continue;
      seenBlobs.add(blob.id);
      if (files && typeof files[str(blob.key)] === 'string') attachments.push({ name: str(blob.filename) || 'attachment', file: files[str(blob.key)] });
      else missingFiles += 1;
    }
    const assignees = list(assignments.get(id)).map(row => person(row.assignee_id)).filter(Boolean);
    const cardSteps = list(steps.get(id)).sort((a, b) => str(a.created_at).localeCompare(str(b.created_at)));
    tasks.push({
      title: str(card.title) || `#${card.number}`,
      description: html(description && description.body),
      column_name: column,
      swimlane_name: swimlane,
      date_creation: card.created_at,
      ...(card.due_on ? { date_due: card.due_on } : {}),
      ...(column === FIZZY_DONE && card.due_on ? { due_complete: true } : {}),
      ...(personName(card.creator_id) ? { requested_by: personName(card.creator_id) } : {}),
      ...(assignees.length ? { owner_id: assignees[0], assignees: assignees.slice(1) } : {}),
      tags: list(taggings.get(id)).map(row => tags.get(str(row.tag_id))).filter(Boolean).map(tag => str(tag.title)).filter(Boolean),
      ...(golden.has(id) ? { color: 'gold' } : {}),
      ...(cardSteps.length ? { checklists: [{ title: STEPS, items: cardSteps.map(step => ({ title: str(step.content), done: step.completed === true || step.completed === 1 })) }] } : {}),
      comments: cardComments.map(comment => {
        const body = richText.get(`Comment:${comment.id}:body`);
        return { text: html(body && body.body), author: person(comment.creator_id), authorName: personName(comment.creator_id), date: comment.created_at };
      }).filter(comment => comment.text),
      ...(attachments.length ? { attachments } : {}),
    });
  }
  if (!tasks.length && !drafts && !boards.size) throw new Error('Not a Fizzy export: no boards and no cards');
  const unsupported = [];
  if (drafts) unsupported.push({ path: '/cards', reason: `${drafts} draft card(s), never published, are not imported` });
  if (missingFiles) unsupported.push({ path: '/attachments', reason: `${missingFiles} file(s) the export names are not in it` });
  for (const [table, label] of Object.entries(COUNTED)) {
    if (Number(counts[table]) > 0) unsupported.push({ path: `/${table}`, reason: `${counts[table]} ${label} are not imported` });
  }
  for (const name of [...boards.values()].map(b => str(b.name))) if (name && !swimlanes.includes(name)) swimlanes.push(name);
  return board(str(account.name) || 'Imported Fizzy', swimlanes, orderedColumns(columnOrder, used), tasks, unsupported);
}

// ----- Export --------------------------------------------------------------

// Fizzy's ids are UUIDv7 written in base36, 25 characters
// (lib/rails_ext/active_record_uuid_type.rb). An id here is made from the
// record's time and a hash of what it is, so the same board writes the same
// ids, and two records never share one.
function hash32(text, seed) {
  let h = (0x811c9dc5 ^ seed) >>> 0;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}
export function fizzyId(key, at = 0) {
  const ms = BigInt(Math.max(0, Math.floor(Number(at) || 0)) % 2 ** 48);
  const r = [1, 2, 3].map(seed => BigInt(hash32(String(key), seed)));
  // 48 bits of time, version 7, 12 random bits, variant 10, 62 random bits.
  let value = (ms << 80n) | (7n << 76n) | ((r[0] & 0xfffn) << 64n) | (2n << 62n)
    | (((r[1] << 32n) | r[2]) & ((1n << 62n) - 1n));
  value &= (1n << 128n) - 1n;
  return value.toString(36).padStart(25, '0');
}

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
// A join code as Account::JoinCode writes one: 12 base58 characters in groups of four.
export function fizzyJoinCode(key) {
  let out = '';
  for (let i = 0; i < 12; i += 1) out += BASE58[hash32(`${key}:${i}`, 7) % 58];
  return out.match(/.{4}/g).join('-');
}

const time = (value, fallback) => {
  const t = Date.parse(value || '');
  return new Date(Number.isNaN(t) ? fallback : t).toISOString();
};
const day = value => {
  const t = Date.parse(value || '');
  return Number.isNaN(t) ? null : new Date(t).toISOString().slice(0, 10);
};

// The board as Fizzy's account export: { path: row }, every row with all the
// columns Fizzy's import requires (db/schema.rb). A swimlane is a Fizzy
// board, or the whole board one when it has only one swimlane; a list is a
// column, except Maybe?, Not now and Done, which are Fizzy's own places.
// `now` is when the export is made.
export function formatFizzy(collected = {}, { now = Date.now() } = {}) {
  const wekanBoard = collected.board || {};
  const items = list(collected.items);
  const nowIso = new Date(now).toISOString();
  const files = {};
  const put = (table, row) => { files[`data/${table}/${row.id}.json`] = row; };
  const stamp = at => ({ created_at: at, updated_at: at });

  const users = new Map();
  const user = name => {
    const key = str(name) || 'wekan';
    if (!users.has(key)) {
      const id = fizzyId(`user:${key}`, 0);
      users.set(key, id);
      // No address: a user an account export brings is a person of the new
      // account, and WeKan does not write members' addresses into a file.
      files[`data/users/${id}.json`] = { id, email_address: null, name: key, role: 'member', active: true,
        verified_at: null, ...stamp(nowIso), account_id: null, identity_id: null };
    }
    return users.get(key);
  };
  const owner = user(wekanBoard.creator || items[0] && items[0].creator || 'wekan');

  const lanes = [...new Set(items.map(item => str(item.swimlaneTitle) || 'Default'))];
  const boards = new Map();
  for (const lane of lanes.length ? lanes : ['Default']) {
    const id = fizzyId(`board:${wekanBoard._id || ''}:${lane}`, Date.parse(wekanBoard.createdAt || '') || 0);
    boards.set(lane, id);
    put('boards', { id, account_id: null, all_access: true, creator_id: owner, name: lanes.length > 1 ? lane : str(wekanBoard.title) || lane, ...stamp(nowIso) });
  }
  // Every person of the board can open every Fizzy board.
  const columns = new Map();
  const special = [FIZZY_TRIAGE, FIZZY_NOT_NOW, FIZZY_DONE];
  const listTitles = [...list(collected.lists).map(l => str(l && l.title)), ...items.map(item => str(item.listTitle))]
    .filter((title, i, all) => title && all.indexOf(title) === i && !special.includes(title));
  for (const [lane, boardId] of boards) {
    listTitles.forEach((title, position) => {
      const id = fizzyId(`column:${boardId}:${title}`, 0);
      columns.set(`${lane}\u0000${title}`, id);
      put('columns', { id, account_id: null, board_id: boardId, color: FIZZY_DEFAULT_COLOR, name: title, position, ...stamp(nowIso) });
    });
  }
  const tags = new Map();
  const tag = title => {
    if (!tags.has(title)) {
      const id = fizzyId(`tag:${title}`, 0);
      tags.set(title, id);
      put('tags', { id, account_id: null, title, ...stamp(nowIso) });
    }
    return tags.get(title);
  };
  const rich = (recordType, recordId, name, text, at) => {
    const id = fizzyId(`rich:${recordType}:${recordId}:${name}`, Date.parse(at) || 0);
    files[`data/action_text_rich_texts/${id}.json`] = { id, account_id: null, body: vikunjaHtml(text), name,
      record_id: recordId, record_type: recordType, ...stamp(at) };
  };

  items.forEach((item, index) => {
    const lane = str(item.swimlaneTitle) || 'Default';
    const boardId = boards.get(lane) || [...boards.values()][0];
    const created = time(item.createdAt, now);
    const id = fizzyId(`card:${item.cardId || index}`, Date.parse(created));
    const creator = user(item.creator || 'wekan');
    const listTitle = str(item.listTitle);
    const done = item.archived === true || listTitle === FIZZY_DONE;
    put('cards', { id, account_id: null, board_id: boardId,
      column_id: done || special.includes(listTitle) ? null : columns.get(`${lane}\u0000${listTitle}`) || null,
      created_at: created, creator_id: creator, due_on: day(item.dueAt), last_active_at: created,
      number: index + 1, status: 'published', title: str(item.title) || `Card ${index + 1}`, updated_at: created });
    if (str(item.description).trim()) rich('Card', id, 'description', item.description, created);
    if (done) put('closures', { id: fizzyId(`closure:${id}`, Date.parse(created)), account_id: null, card_id: id, user_id: creator, ...stamp(created) });
    else if (listTitle === FIZZY_NOT_NOW) put('card_not_nows', { id: fizzyId(`notnow:${id}`, Date.parse(created)), account_id: null, card_id: id, user_id: creator, ...stamp(created) });
    if (['gold', 'yellow'].includes(str(item.color))) put('card_goldnesses', { id: fizzyId(`golden:${id}`, Date.parse(created)), account_id: null, card_id: id, ...stamp(created) });
    for (const label of list(item.labels)) {
      const title = str(label && (label.name || label.title) || label);
      if (title && typeof title === 'string') {
        const tagId = tag(title);
        put('taggings', { id: fizzyId(`tagging:${id}:${tagId}`, Date.parse(created)), account_id: null, card_id: id, tag_id: tagId, ...stamp(created) });
      }
    }
    const people = [...new Set([item.owner, ...list(item.assignees)].map(str).filter(Boolean))];
    for (const person of people) {
      const assignee = user(person);
      put('assignments', { id: fizzyId(`assignment:${id}:${assignee}`, Date.parse(created)), account_id: null,
        assignee_id: assignee, assigner_id: creator, card_id: id, ...stamp(created) });
    }
    list(item.checklists).forEach((checklist, c) => list(checklist && checklist.items).forEach((entry, i) => {
      const content = str(entry && entry.title).trim();
      if (!content) return;
      put('steps', { id: fizzyId(`step:${id}:${c}:${i}`, Date.parse(created)), account_id: null, card_id: id,
        completed: Boolean(entry.done), content, ...stamp(created) });
    }));
    list(item.comments).forEach((comment, i) => {
      if (!str(comment && comment.text).trim()) return;
      const at = time(comment.date, Date.parse(created));
      const commentId = fizzyId(`comment:${id}:${i}`, Date.parse(at));
      put('comments', { id: commentId, account_id: null, card_id: id, creator_id: user(comment.author || 'wekan'), ...stamp(at) });
      rich('Comment', commentId, 'body', comment.text, at);
    });
  });
  // Access to every board for every person (Board::Accessible).
  for (const [, boardId] of boards) {
    for (const [, userId] of users) {
      put('accesses', { id: fizzyId(`access:${boardId}:${userId}`, 0), accessed_at: null, account_id: null, board_id: boardId,
        involvement: userId === owner ? 'watching' : 'access_only', user_id: userId, ...stamp(nowIso) });
    }
  }
  files['data/account.json'] = {
    name: str(wekanBoard.title) || 'WeKan', cards_count: items.length,
    join_code: { code: fizzyJoinCode(`${wekanBoard._id || ''}:${now}`), usage_count: 0, usage_limit: 10 },
  };
  return { files };
}

// formatFizzy's rows as the zip's files: { path: JSON text }. Only the paths
// formatFizzy writes - data/<table>/<id>.json and data/account.json.
export function fizzyArchiveFiles(built = {}) {
  const out = {};
  for (const [path, row] of Object.entries(isObject(built.files) ? built.files : {})) {
    if (path === 'data/account.json' || /^data\/[a-z_]+\/[0-9a-z]{25}\.json$/.test(path)) out[path] = JSON.stringify(row);
  }
  return out;
}
