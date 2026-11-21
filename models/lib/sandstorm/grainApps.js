// Sandstorm grain backups (.zip) of the apps WeKan imports from and exports
// to, read into WeKan's normalized board and written back as a grain
// Sandstorm restores. Plain JavaScript without Meteor or a database, so
// tests/sandstormGrain.test.cjs runs it in Node: server/lib/sandstormGrain.js
// opens the .zip, reads an app's SQLite database (node:sqlite) and its files,
// and hands this module plain values; for an export it takes this module's
// file list, writes the SQLite databases and adds the attachments.
//
// A grain backup is `metadata` (GrainInfo, ./grainInfo.js), `log` (the
// grain's console, not read) and the grain's /var as `data/...`. What is in
// data/ is each app's own storage, so each app has a reader and a writer here,
// from the grains Sandstorm wrote of it.
//
// Import only, by design: WeKan, Gogs and WordPress - a grain of theirs is
// a whole installation (Gogs' repositories and configuration, WordPress's
// PHP, WeKan's users that are Sandstorm identities of that grain), which a
// board cannot be made into. Not at all: Rocket.Chat, Text Editor and
// SandForms keep their data in MongoDB's files, Piwik in MySQL's; reading
// them takes those database engines.

import { parseICalendar } from '../icalendarFormat.js';
import { vikunjaHtmlToText } from '../vikunjaFormat.js';
import { writeGrainInfo } from './grainInfo.js';
import { randomHex } from './randomHex.js';

export const SANDSTORM_APPS = [
  { key: 'sandstormwekan', app: 'wekan', name: 'WeKan', appId: 'm86q05rdvj14yvn78ghaxynqz7u2svw6rnttptxx49g1785cdv1h', export: false },
  { key: 'sandstormprioritize', app: 'prioritize', name: 'Prioritize', appId: 'nut9xv0zcc4x92udcu9mwrp661xps9ecdtjaffnev34yn2ussvz0', appVersion: 17, export: true },
  { key: 'sandstormyatl', app: 'yatl', name: 'Yet Another TODO list', appId: '6ee9j59rp4mepat8pz2pt1sq97xmname4kvhzh4m3uzwrvf1hu10', appVersion: 8, export: true },
  { key: 'sandstormmutodo', app: 'mutodo', name: 'μTodo', appId: 'p4z5hactgfhv2k5k845fvth60cnm78yn5k39r62jxwyzhrtqpn00', appVersion: 1, export: true },
  { key: 'sandstormsandchat', app: 'sandchat', name: 'SandChat', appId: 'q95sez0acjwq7c1emxyxz38947sr7sgc1gn9yju93nqccz83fzyh', appVersion: 3, export: true },
  { key: 'sandstormethercalc', app: 'ethercalc', name: 'EtherCalc', appId: 'a0n6hwm32zjsrzes8gnjg734dh6jwt7x83xdgytspe761pe2asw0', appVersion: 202012283, export: true },
  { key: 'sandstormradicalecalendar', app: 'radicalecalendar', name: 'Radicale calendar', appId: '8kr4rvyrggvzfvc160htzdt4u5rfvjc2dgdn27n5pt66mxa40m1h', appVersion: 14, export: true },
  { key: 'sandstormradicalecontacts', app: 'radicalecontacts', name: 'Radicale address book', appId: '8kr4rvyrggvzfvc160htzdt4u5rfvjc2dgdn27n5pt66mxa40m1h', appVersion: 14, export: true },
  { key: 'sandstormdavros', app: 'davros', name: 'Davros', appId: '8aspz4sfjnp8u89000mh2v1xrdyx97ytn8hq71mdzv4p4d8n0n3h', appVersion: 332, export: true },
  { key: 'sandstormhackercms', app: 'hackercms', name: 'Hacker CMS', appId: 'nqmcqs9spcdpmqyuxemf0tsgwn8awfvswc58wgk375g4u25xv6yh', appVersion: 10, export: true },
  { key: 'sandstormgogs', app: 'gogs', name: 'Gogs', appId: 'd9ygf47xrtnw12j92cyt6cu8ut75esx01u4q3kcrn8415w9qzzgh', export: false },
  { key: 'sandstormwordpress', app: 'wordpress', name: 'WordPress', appId: 'aax9j672p6z8n7nyupzvj2nmumeqd4upa0f7mgu8gprwmy53x04h', export: false },
];
// The apps whose grains WeKan cannot read, and why: named when such a grain
// is chosen, instead of "not a grain".
export const SANDSTORM_UNREADABLE = {
  vfnwptfn02ty21w715snyyczw0nqxkv3jvawcah10c6z7hj1hnu0: 'Rocket.Chat keeps its messages in MongoDB\'s database files; export them in Rocket.Chat (My Account → Download my data) and import that under Rocket.Chat',
  n4n49dkfyskmhcmg5h0mfzk4kjvce2jcs8ravr7y7uw9xs2pzghh: 'Text Editor keeps its documents in MongoDB\'s database files, which only MongoDB reads',
  ztxnreej8a0pqn97ccfhuckswjkrmsaavn85n5sgzk30tv2k4y9h: 'SandForms keeps its forms in MongoDB\'s database files, which only MongoDB reads',
  xuajusd5d4a9v4js71ru0cwj9wn984q1x8kny10htsp8f5dcfep0: 'Piwik keeps its statistics in MySQL\'s database files, which only MySQL reads',
};

export const sandstormApp = key => SANDSTORM_APPS.find(a => a.key === key) || null;
export const sandstormAppsOf = appId => SANDSTORM_APPS.filter(a => a.appId === appId);
export const MAX_SANDSTORM_CARDS = 50000;
export const DONE_LIST = 'Done';
export const TODO_LIST = 'To do';

const str = value => (value === undefined || value === null ? '' : String(value));
const list = value => (Array.isArray(value) ? value : []);
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const iso = value => {
  if (value === undefined || value === null || value === '') return '';
  const date = new Date(typeof value === 'number' ? value : String(value).replace(' ', 'T').replace(/(\.\d{3})\d+/, '$1'));
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
};
// A SQLite datetime without a zone (Rails writes UTC) as ISO.
const sqlTime = value => iso(str(value) && !/[zZ]|[+-]\d\d:?\d\d$/.test(str(value)) ? `${str(value)}Z` : value);
const htmlText = html => (str(html).trim() ? vikunjaHtmlToText(str(html), { checklists: false }).text : '');
// HTML comments removed until none is left: one pass leaves `<!-<!---->->`
// as a comment again (CodeQL js/incomplete-multi-character-sanitization).
const stripComments = html => {
  let out = str(html);
  let prev;
  do {
    prev = out;
    out = out.replace(/<!--[\s\S]*?-->/g, '');
  } while (out !== prev);
  return out;
};
const isDoneList = title => /^(done|closed|complete(d)?|finished|valmis)$/i.test(str(title).trim());
const board = (name, columns, tasks, { swimlanes, unsupported = [] } = {}) => ({
  board: { name: name || 'Imported Sandstorm grain' },
  columns: columns.map(title => ({ title })),
  swimlanes: (swimlanes && swimlanes.length ? swimlanes : ['Default']).map(n => ({ name: n })),
  tasks,
  warnings: [],
  unsupported,
});
const cap = tasks => {
  if (tasks.length > MAX_SANDSTORM_CARDS) throw new Error(`The grain has more than ${MAX_SANDSTORM_CARDS} items`);
  return tasks;
};

// ------------------------------------------------------------- FerretDB ---
// WeKan's grain keeps MongoDB's documents in FerretDB's SQLite backend:
// each a JSON value with its own schema - { "$s": { p: { field: type }, $k:
// [order] }, field: value } - where a date is milliseconds, binData base64
// and an objectId hex (FerretDB internal/handler/sjson).
export function decodeSjson(value, schema) {
  if (schema === undefined) {
    if (!isObject(value) || !isObject(value.$s)) return value;
    return decodeSjson(value, { t: 'object', $s: value.$s });
  }
  const t = schema && schema.t;
  if (value === null || t === 'null') return null;
  if (t === 'date') return new Date(Number(value)).toISOString();
  if (t === 'object') {
    const s = schema.$s || {};
    const out = {};
    for (const key of list(s.$k).length ? s.$k : Object.keys(value).filter(k => k !== '$s')) {
      if (key in value) out[key] = decodeSjson(value[key], (s.p || {})[key]);
    }
    return out;
  }
  if (t === 'array') return list(value).map((v, i) => decodeSjson(v, list(schema.i)[i]));
  if (t === 'binData') return isObject(value) ? str(value.b) : value;
  return value;
}

// ----------------------------------------------------------------- import ---

function wekanBoard(data, info) {
  const c = data.collections || {};
  const users = new Map(list(c.users).map(u => [u._id, str(u.username) || str(u.profile && u.profile.fullname) || u._id]));
  const boards = list(c.boards).filter(b => b && b.type !== 'template-container' && !/^templates?$/i.test(str(b.title)));
  if (!boards.length) throw new Error('The WeKan grain has no boards');
  const many = boards.length > 1;
  const boardTitle = new Map(boards.map(b => [b._id, str(b.title) || 'Board']));
  const lists = new Map(list(c.lists).map(l => [l._id, l]));
  const lanes = new Map(list(c.swimlanes).map(s => [s._id, s]));
  const labelsOf = new Map(boards.map(b => [b._id, new Map(list(b.labels).map(l => [l._id, str(l.name) || str(l.color)]))]));
  const columns = [];
  const swimlanes = [];
  const tasks = [];
  const sorted = (rows, key) => rows.slice().sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0) || str(a[key]).localeCompare(str(b[key])));
  for (const l of sorted(list(c.lists).filter(l => boardTitle.has(l.boardId) && !l.archived), 'title')) {
    if (!columns.includes(str(l.title))) columns.push(str(l.title));
  }
  for (const card of sorted(list(c.cards).filter(card => boardTitle.has(card.boardId) && card.type !== 'template-card'), 'title')) {
    const l = lists.get(card.listId);
    const lane = lanes.get(card.swimlaneId);
    const swimlane = many ? boardTitle.get(card.boardId) : str(lane && lane.title) || 'Default';
    if (!swimlanes.includes(swimlane)) swimlanes.push(swimlane);
    const column = str(l && l.title) || 'Imported';
    if (!columns.includes(column)) columns.push(column);
    const people = [...list(card.members), ...list(card.assignees)].map(id => users.get(id)).filter(Boolean);
    const checklists = sorted(list(c.checklists).filter(cl => cl.cardId === card._id), 'title').map(cl => ({
      title: str(cl.title) || 'Checklist',
      items: sorted(list(c.checklistItems).filter(i => i.checklistId === cl._id), 'title').map(i => ({ title: str(i.title), done: Boolean(i.isFinished) })),
    }));
    const files = list(c.attachments).filter(a => a && a.meta && a.meta.cardId === card._id && data.files && data.files[a._id])
      .map(a => ({ name: str(a.name) || 'attachment', file: data.files[a._id] }));
    tasks.push({
      title: str(card.title) || 'Card',
      description: str(card.description),
      column_name: column,
      swimlane_name: swimlane,
      tags: list(card.labelIds).map(id => labelsOf.get(card.boardId)?.get(id)).filter(Boolean),
      ref: card._id,
      ...(card.parentId ? { parent_ref: card.parentId } : {}),
      ...(people[0] ? { owner_username: people[0] } : {}),
      ...(people.length > 1 ? { assignees: [...new Set(people.slice(1))] } : {}),
      ...(users.get(card.userId) ? { requested_by: users.get(card.userId) } : {}),
      ...(iso(card.createdAt) ? { date_creation: iso(card.createdAt) } : {}),
      ...(iso(card.startAt) ? { date_started: iso(card.startAt) } : {}),
      ...(iso(card.dueAt) ? { date_due: iso(card.dueAt) } : {}),
      ...(iso(card.endAt) ? { date_end: iso(card.endAt) } : {}),
      ...(iso(card.receivedAt) ? { date_received: iso(card.receivedAt) } : {}),
      ...(card.color ? { color: card.color } : {}),
      ...(card.archived ? { archived: true } : {}),
      ...(checklists.length ? { checklists } : {}),
      comments: list(c.card_comments).filter(m => m.cardId === card._id && str(m.text))
        .sort((a, b) => str(a.createdAt).localeCompare(str(b.createdAt)))
        .map(m => ({ text: str(m.text), author: users.get(m.userId) || '', authorName: users.get(m.userId) || '', date: iso(m.createdAt) })),
      ...(files.length ? { attachments: files } : {}),
    });
  }
  const unsupported = [];
  const missing = list(c.attachments).filter(a => a && a.meta && !(data.files && data.files[a._id])).length;
  if (missing) unsupported.push({ path: '/attachments', reason: `${missing} attachment(s) whose file is not in the grain are not imported` });
  if (many) unsupported.push({ path: '/boards', reason: `the grain has ${boards.length} boards: each is a swimlane; "One board per project" makes each a board again` });
  return board(many ? str(info.title) || 'WeKan grain' : boards[0].title, columns, cap(tasks), { swimlanes, unsupported });
}

function prioritizeBoard(data, info) {
  const jobs = list(data.data && data.data.jobs);
  const tasks = jobs.filter(j => isObject(j) && isObject(j.v)).map(j => {
    const v = j.v;
    const fields = {};
    if (Number(v.period) > 0) fields['Repeat every (days)'] = Math.round((Number(v.period) / 86400000) * 100) / 100;
    if (str(v.urgencyGrowth)) fields['Urgency growth'] = str(v.urgencyGrowth);
    return {
      title: str(v.title) || `Task ${j.k}`,
      description: '',
      column_name: 'Tasks',
      swimlane_name: 'Default',
      tags: [],
      ref: str(j.k),
      ...(v.lastDone ? { date_end: iso(v.lastDone) } : {}),
      ...(Object.keys(fields).length ? { custom_fields: fields } : {}),
    };
  });
  return board(info.title || 'Prioritize', ['Tasks'], cap(tasks));
}

const todoBoard = (title, rows) => board(title, [TODO_LIST, DONE_LIST], cap(rows.map(r => ({
  title: str(r.title) || 'Todo',
  description: '',
  column_name: r.done ? DONE_LIST : TODO_LIST,
  swimlane_name: 'Default',
  tags: [],
  ref: str(r.id),
  ...(iso(r.created) ? { date_creation: iso(r.created) } : {}),
}))));

// μTodo (prologic/bitcask): a log of entries, each key size (u32), value
// size (u64), key, value and the CRC-32 of the value, all big-endian; the
// last entry of a key is its value.
export function readBitcask(bytes) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const out = new Map();
  let at = 0;
  while (at + 16 <= data.length) {
    const keySize = view.getUint32(at);
    const valueSize = Number(view.getBigUint64(at + 4));
    if (keySize > 1024 || valueSize > 1024 * 1024 || at + 12 + keySize + valueSize + 4 > data.length) break;
    const key = new TextDecoder().decode(data.subarray(at + 12, at + 12 + keySize));
    const value = data.subarray(at + 12 + keySize, at + 12 + keySize + valueSize);
    const crc = view.getUint32(at + 12 + keySize + valueSize);
    if (crc32(value) !== crc) throw new Error(`The μTodo data file is damaged at entry ${key}`);
    out.set(key, value);
    at += 12 + keySize + valueSize + 4;
  }
  return out;
}

let CRC_TABLE = null;
export function crc32(bytes) {
  if (!CRC_TABLE) {
    CRC_TABLE = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function writeBitcask(entries) {
  const parts = [];
  for (const [key, value] of entries) {
    const k = new TextEncoder().encode(key);
    const v = value instanceof Uint8Array ? value : new TextEncoder().encode(String(value));
    const entry = new Uint8Array(12 + k.length + v.length + 4);
    const view = new DataView(entry.buffer);
    view.setUint32(0, k.length);
    view.setBigUint64(4, BigInt(v.length));
    entry.set(k, 12);
    entry.set(v, 12 + k.length);
    view.setUint32(12 + k.length + v.length, crc32(v));
    parts.push(entry);
  }
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.length; }
  return out;
}

function mutodoBoard(data, info) {
  const records = readBitcask(data.bytes);
  const rows = [];
  for (const [key, value] of records) {
    if (!/^todo_\d+$/.test(key)) continue;
    let todo;
    try { todo = JSON.parse(new TextDecoder().decode(value)); } catch (e) { continue; }
    rows.push({ id: todo.ID, title: todo.Title, done: todo.Done, created: todo.CreatedAt });
  }
  rows.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
  return todoBoard(info.title || 'μTodo', rows);
}

function sandchatBoard(data, info) {
  const users = new Map(list(data.users).map(u => [u.id, str(u.name) || `user ${u.id}`]));
  const comments = list(data.chats).filter(c => str(c.message)).sort((a, b) => (a.id || 0) - (b.id || 0))
    .map(c => ({ text: str(c.message), author: users.get(c.user_id) || '', authorName: users.get(c.user_id) || '', date: sqlTime(c.created_at) }));
  return board(info.title || 'SandChat', ['Chats'], [{
    title: info.title || 'SandChat room', description: '', column_name: 'Chats', swimlane_name: 'Default', tags: [],
    ...(comments[0] ? { date_creation: comments[0].date } : {}), comments,
  }]);
}

// SocialCalc's save format (EtherCalc's snapshot-<sheet>.txt): MIME parts,
// the sheet part's "cell:<coord>:<type>:<value>..." lines; in a value "\c"
// is ':', "\n" a line break and "\b" a backslash.
const scDecode = text => str(text).replace(/\\(c|n|b)/g, (m, ch) => ({ c: ':', n: '\n', b: '\\' })[ch]);
const SC_ESCAPES = { '\\': '\\b', ':': '\\c', '\n': '\\n' };
// One pass, the backslash among the characters escaped, so no "\" already in
// the text can cancel an escape (tests/incompleteEscaping.test.cjs).
const scEncode = text => str(text).replace(/\r\n?/g, '\n').replace(/[\\:\n]/g, ch => SC_ESCAPES[ch]);
const colIndex = letters => letters.split('').reduce((n, ch) => n * 26 + (ch.charCodeAt(0) - 64), 0);
const colName = index => { let s = ''; for (let n = index; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s; return s; };

export function readSocialCalc(text) {
  const cells = new Map();
  for (const line of str(text).split(/\r?\n/)) {
    const m = /^cell:([A-Z]+)(\d+):(.*)$/.exec(line);
    if (!m) continue;
    const parts = m[3].split(':');
    let value = '';
    for (let i = 0; i < parts.length; i += 1) {
      if (parts[i] === 't' || parts[i] === 'v') { value = scDecode(parts[i + 1]); break; }
      if (parts[i] === 'vt' || parts[i] === 'vtf' || parts[i] === 'vtc') { value = scDecode(parts[i + 2]); break; }
    }
    cells.set(`${m[1]}${m[2]}`, { col: colIndex(m[1]), row: Number(m[2]), value });
  }
  const rows = new Map();
  for (const cell of cells.values()) {
    if (!rows.has(cell.row)) rows.set(cell.row, new Map());
    rows.get(cell.row).set(cell.col, cell.value);
  }
  return [...rows.keys()].sort((a, b) => a - b).map(r => {
    const row = rows.get(r);
    const width = Math.max(...row.keys());
    return Array.from({ length: width }, (_, i) => str(row.get(i + 1)));
  });
}

export const ETHERCALC_COLUMNS = ['Title', 'List', 'Swimlane', 'Labels', 'Start', 'Due', 'Description'];

function ethercalcBoard(data, info) {
  const sheets = isObject(data.sheets) ? data.sheets : {};
  // The multi-sheet index ("sheet": #url, #title) names the sheets in order.
  const index = sheets.sheet ? readSocialCalc(sheets.sheet).filter(r => /^\/\S+/.test(str(r[0]))) : [];
  const order = index.length ? [...new Map(index.map(r => [str(r[0]).slice(1), str(r[1]) || str(r[0]).slice(1)])).entries()]
    : Object.keys(sheets).map(id => [id, id]);
  const columns = [];
  const tasks = [];
  for (const [id, sheetTitle] of order) {
    if (!sheets[id] || (id === 'sheet' && index.length)) continue;
    const rows = readSocialCalc(sheets[id]).filter(r => r.some(cell => str(cell).trim()));
    if (!rows.length) continue;
    const ours = ETHERCALC_COLUMNS.every((name, i) => rows[0][i] === name);
    const header = ours || rows[0].every(cell => !cell || Number.isNaN(Number(cell))) ? rows[0] : null;
    for (const row of header ? rows.slice(1) : rows) {
      const cell = name => (header ? str(row[header.indexOf(name)]) : '');
      if (ours) {
        const column = cell('List') || sheetTitle;
        if (!columns.includes(column)) columns.push(column);
        tasks.push({ title: cell('Title') || 'Row', description: cell('Description'), column_name: column,
          swimlane_name: cell('Swimlane') || 'Default', tags: cell('Labels').split(/\s*,\s*/).filter(Boolean),
          ...(iso(cell('Start')) ? { date_started: iso(cell('Start')) } : {}), ...(iso(cell('Due')) ? { date_due: iso(cell('Due')) } : {}) });
        continue;
      }
      if (!columns.includes(sheetTitle)) columns.push(sheetTitle);
      const titleAt = row.findIndex(v => str(v).trim());
      const fields = {};
      row.forEach((value, i) => {
        if (i !== titleAt && str(value).trim()) fields[header && str(header[i]).trim() ? str(header[i]).trim() : colName(i + 1)] = value;
      });
      tasks.push({ title: str(row[titleAt]).trim(), description: '', column_name: sheetTitle, swimlane_name: 'Default', tags: [],
        ...(Object.keys(fields).length ? { custom_fields: fields } : {}) });
    }
  }
  if (!tasks.length) throw new Error('The EtherCalc grain has no rows');
  const swimlanes = [...new Set(tasks.map(t => t.swimlane_name))];
  return board(info.title || 'EtherCalc', columns, cap(tasks), { swimlanes });
}

// vCard 3.0 (Radicale's address book): unfolded lines, NAME;params:value.
export function readVCards(text) {
  const lines = str(text).replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '').split('\n');
  const cards = [];
  let card = null;
  for (const line of lines) {
    if (/^BEGIN:VCARD$/i.test(line)) { card = []; continue; }
    if (/^END:VCARD$/i.test(line)) { if (card) cards.push(card); card = null; continue; }
    if (!card) continue;
    const m = /^(?:[\w-]+\.)?([\w-]+)((?:;[^:]*)?):(.*)$/.exec(line);
    if (m) card.push({ name: m[1].toUpperCase(), params: m[2], value: m[3].replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1') });
  }
  return cards;
}

const VCARD_FIELDS = { EMAIL: 'Email', TEL: 'Phone', ORG: 'Organization', TITLE: 'Job title', URL: 'Website', ADR: 'Address',
  NICKNAME: 'Nickname', BDAY: 'Birthday' };

function radicaleContactsBoard(data, info) {
  const tasks = readVCards(data.vcf).map(props => {
    const get = name => props.filter(p => p.name === name).map(p => p.value);
    const fields = {};
    for (const [prop, label] of Object.entries(VCARD_FIELDS)) {
      const values = get(prop).map(v => (prop === 'ADR' || prop === 'ORG' ? v.split(';').filter(Boolean).join(', ') : v)).filter(Boolean);
      if (values.length) fields[label] = values.join(', ');
    }
    const n = (get('N')[0] || '').split(';');
    return {
      title: get('FN')[0] || [n[1], n[0]].filter(Boolean).join(' ') || 'Contact',
      description: get('NOTE').join('\n'),
      column_name: 'Contacts',
      swimlane_name: 'Default',
      tags: get('CATEGORIES').flatMap(v => v.split(',')).map(v => v.trim()).filter(Boolean),
      ...(get('UID')[0] ? { ref: get('UID')[0] } : {}),
      ...(Object.keys(fields).length ? { custom_fields: fields } : {}),
    };
  });
  if (!tasks.length) throw new Error('The Radicale address book has no contacts');
  return board(info.title || 'Radicale address book', ['Contacts'], cap(tasks));
}

function radicaleCalendarBoard(data, info) {
  const parsed = parseICalendar(str(data.ics));
  parsed.board = { name: info.title || (parsed.board && parsed.board.name) || 'Radicale calendar' };
  return parsed;
}

const DAVROS_TEXT = /\.(md|markdown|txt)$/i;
function davrosBoard(data, info) {
  const columns = [];
  const tasks = [];
  for (const file of list(data.files).sort((a, b) => a.path.localeCompare(b.path))) {
    const parts = file.path.split('/');
    const column = parts.length > 1 ? parts[0] : 'Files';
    if (!columns.includes(column)) columns.push(column);
    const name = parts[parts.length - 1];
    if (DAVROS_TEXT.test(name) && typeof file.text === 'string') {
      // A WeKan export's card: "# Title" then the description.
      const m = /^# (.*)\n\n?([\s\S]*)$/.exec(file.text);
      tasks.push({ title: m ? m[1] : name.replace(DAVROS_TEXT, ''), description: m ? m[2].trimEnd() : file.text, column_name: column,
        swimlane_name: 'Default', tags: [], ref: file.path });
    } else {
      // A card's file (<list>/<card>/<file>) joins that card; another is a card of its own.
      const owner = parts.length > 2 ? tasks.find(t => t.ref === `${parts.slice(0, -1).join('/')}.md`) : null;
      const attachment = { name, file: str(file.base64) };
      if (owner) (owner.attachments = owner.attachments || []).push(attachment);
      else tasks.push({ title: name, description: '', column_name: column, swimlane_name: 'Default', tags: [], ref: file.path, attachments: [attachment] });
    }
  }
  if (!tasks.length) throw new Error('The Davros grain has no files');
  return board(info.title || 'Davros', columns, cap(tasks));
}

// Hacker CMS: a Jekyll site, the pages in data/src (front matter between
// "---" lines, then Markdown or HTML); _layouts, _includes and _config*.yaml
// are the site's own and not pages.
function frontMatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(str(text));
  if (!m) return { meta: {}, body: str(text) };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([\w-]+):\s*(.*)$/.exec(line);
    if (kv) meta[kv[1]] = kv[2].replace(/^["']|["']$/g, '');
  }
  return { meta, body: m[2] };
}
function hackercmsBoard(data, info) {
  const tasks = list(data.pages).filter(p => !/(^|\/)_/.test(p.path) && /\.(html?|md|markdown)$/i.test(p.path))
    .sort((a, b) => a.path.localeCompare(b.path)).map(page => {
      const { meta, body } = frontMatter(page.text);
      if (meta.wekan === 'index') return null; // the list of pages WeKan's export writes
      const html = /\.html?$/i.test(page.path);
      const title = meta.title || (html && (/<title\b[^>]*>([^<]*)<\/title\b[^>]*>/i.exec(body) || [])[1]) || page.path.replace(/\.[^.]+$/, '');
      // The page's text, without its <head> and without the heading that
      // only repeats its title.
      let source = body;
      let prev;
      do {
        prev = source;
        source = source.replace(/<head\b[\s\S]*?<\/head\s*>/gi, '');
      } while (source !== prev);
      const text = html ? htmlText(source) : body.trim();
      const heading = `# ${str(title).trim()}`;
      const description = text.startsWith(heading) ? text.slice(heading.length).trim() : text;
      return { title: str(title).trim(), description, column_name: 'Pages', swimlane_name: 'Default',
        tags: meta.tags ? meta.tags.replace(/[[\]"]/g, '').split(/\s*,\s*/).filter(Boolean) : [], ref: page.path };
    }).filter(Boolean);
  if (!tasks.length) throw new Error('The Hacker CMS grain has no pages');
  return board(info.title || 'Hacker CMS', ['Pages'], cap(tasks));
}

function gogsBoard(data, info) {
  const users = new Map(list(data.users).map(u => [u.id, str(u.name) || str(u.full_name)]));
  const repos = new Map(list(data.repositories).map(r => [r.id, str(r.name)]));
  const labels = new Map(list(data.labels).map(l => [l.id, str(l.name)]));
  const milestones = new Map(list(data.milestones).map(m => [m.id, str(m.name)]));
  const issueLabels = new Map();
  for (const il of list(data.issueLabels)) {
    if (!issueLabels.has(il.issue_id)) issueLabels.set(il.issue_id, []);
    issueLabels.get(il.issue_id).push(labels.get(il.label_id));
  }
  const unix = s => (Number(s) > 0 ? new Date(Number(s) * 1000).toISOString() : '');
  const issues = list(data.issues).filter(i => !Number(i.is_pull));
  const tasks = issues.map(i => ({
    title: str(i.name) || `#${i.index}`,
    description: str(i.content),
    column_name: Number(i.is_closed) ? 'Closed' : 'Open',
    swimlane_name: repos.get(i.repo_id) || 'Default',
    tags: list(issueLabels.get(i.id)).filter(Boolean),
    ref: str(i.id),
    ...(users.get(i.poster_id) ? { requested_by: users.get(i.poster_id) } : {}),
    ...(users.get(i.assignee_id) ? { owner_username: users.get(i.assignee_id) } : {}),
    ...(unix(i.created_unix) ? { date_creation: unix(i.created_unix) } : {}),
    ...(unix(i.deadline_unix) ? { date_due: unix(i.deadline_unix) } : {}),
    ...(milestones.get(i.milestone_id) ? { custom_fields: { Milestone: milestones.get(i.milestone_id) } } : {}),
    comments: list(data.comments).filter(c => c.issue_id === i.id && Number(c.type) === 0 && str(c.content))
      .map(c => ({ text: str(c.content), author: users.get(c.poster_id) || '', authorName: users.get(c.poster_id) || '', date: unix(c.created_unix) })),
  }));
  const pulls = list(data.issues).length - issues.length;
  const unsupported = pulls ? [{ path: '/issues', reason: `${pulls} pull request(s) are not imported` }] : [];
  if (!tasks.length && !list(data.repositories).length) throw new Error('The Gogs grain has no repositories');
  const swimlanes = [...new Set([...repos.values(), ...tasks.map(t => t.swimlane_name)])];
  return board(info.title || 'Gogs', ['Open', 'Closed'], cap(tasks), { swimlanes, unsupported });
}

const WP_STATUS = { publish: 'Published', private: 'Private', draft: 'Draft', pending: 'Pending review', future: 'Scheduled' };
function wordpressBoard(data, info) {
  const users = new Map(list(data.users).map(u => [u.ID, str(u.display_name) || str(u.user_login)]));
  const terms = new Map(list(data.terms).map(t => [t.term_taxonomy_id, t]));
  const termsOf = new Map();
  for (const r of list(data.relationships)) {
    const t = terms.get(r.term_taxonomy_id);
    if (!t || !['category', 'post_tag'].includes(t.taxonomy) || str(t.name) === 'Uncategorized') continue;
    if (!termsOf.has(r.object_id)) termsOf.set(r.object_id, []);
    termsOf.get(r.object_id).push(str(t.name));
  }
  const posts = list(data.posts).filter(p => ['post', 'page'].includes(p.post_type) && WP_STATUS[p.post_status]);
  const columns = [];
  const tasks = posts.map(p => {
    const column = WP_STATUS[p.post_status];
    if (!columns.includes(column)) columns.push(column);
    return {
      title: str(p.post_title) || `(${p.post_type} ${p.ID})`,
      description: htmlText(stripComments(p.post_content)),
      column_name: column,
      swimlane_name: p.post_type === 'page' ? 'Pages' : 'Posts',
      tags: termsOf.get(p.ID) || [],
      ref: str(p.ID),
      ...(Number(p.post_parent) ? { parent_ref: str(p.post_parent) } : {}),
      ...(users.get(p.post_author) ? { requested_by: users.get(p.post_author) } : {}),
      ...(sqlTime(p.post_date_gmt) ? { date_creation: sqlTime(p.post_date_gmt) } : {}),
      comments: list(data.comments).filter(c => c.comment_post_ID === p.ID && str(c.comment_approved) === '1')
        .map(c => ({ text: htmlText(c.comment_content), author: str(c.comment_author), authorName: str(c.comment_author), date: sqlTime(c.comment_date_gmt) })),
    };
  });
  const other = list(data.posts).filter(p => ['attachment'].includes(p.post_type)).length;
  const unsupported = other ? [{ path: '/attachments', reason: `${other} WordPress media file(s) are not imported` }] : [];
  if (!tasks.length) throw new Error('The WordPress grain has no posts or pages');
  const swimlanes = [...new Set(tasks.map(t => t.swimlane_name))];
  return board(info.title || 'WordPress', columns, cap(tasks), { swimlanes, unsupported });
}

const READERS = {
  wekan: wekanBoard, prioritize: prioritizeBoard,
  yatl: (data, info) => todoBoard(info.title || 'Yet Another TODO list', list(data.todos).map(t => ({ id: t.id, title: t.descr, done: Boolean(t.done) }))),
  mutodo: mutodoBoard, sandchat: sandchatBoard, ethercalc: ethercalcBoard, radicalecalendar: radicaleCalendarBoard,
  radicalecontacts: radicaleContactsBoard, davros: davrosBoard, hackercms: hackercmsBoard, gogs: gogsBoard, wordpress: wordpressBoard,
};

// The board of a grain: `data` is what server/lib/sandstormGrain.js read for
// the app (readAppData says what), `info` the grain's metadata.
export function parseSandstormGrain(key, data, info = {}) {
  const app = sandstormApp(key);
  if (!app || !READERS[app.app]) throw new Error('Not a Sandstorm app WeKan reads');
  return READERS[app.app](isObject(data) ? data : {}, isObject(info) ? info : {});
}

// EXTERNAL_PARSERS' entry of a grain source: what readSandstormGrainData read.
export const sandstormParser = key => value => {
  if (!isObject(value) || value.sandstorm !== key) throw new Error('Choose the grain backup (.zip) Sandstorm downloads');
  return parseSandstormGrain(key, value.data, value.info);
};

// ----------------------------------------------------------------- export ---
// Two steps, as for the other archives: formatSandstormGrain keeps the
// board's plain values, which pass the export boundary; sandstormGrainFiles
// writes the grain's files from them afterwards.

const ITEM_FIELDS = ['cardId', 'title', 'description', 'listTitle', 'swimlaneTitle', 'labels', 'dueAt', 'startAt', 'endAt',
  'createdAt', 'owner', 'assignees', 'creator', 'comments', 'checklists', 'archived', 'dueComplete', 'customFields', 'attachments',
  'parentCardId'];
export function formatSandstormGrain(key, collected = {}) {
  const app = sandstormApp(key);
  if (!app || !app.export) throw new Error('WeKan does not write grains of this app');
  return {
    sandstorm: app.key,
    title: str(collected.board && collected.board.title) || app.name,
    lists: list(collected.lists).map(l => str(l && l.title)).filter(Boolean),
    items: list(collected.items).map(item => Object.fromEntries(ITEM_FIELDS.filter(k => item && item[k] !== undefined).map(k => [k, item[k]]))),
  };
}

const isDone = item => Boolean(item.archived || item.dueComplete || isDoneList(item.listTitle));
const slug = (value, fallback) => (str(value).normalize('NFKD').replace(/[^\w\s.-]+/g, '').trim().replace(/\s+/g, '-')
  .replace(/^\.+/, '').slice(0, 80)) || fallback;
const icsText = value => str(value).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const icsDate = value => (iso(value) ? iso(value).replace(/[-:]/g, '').replace(/\.\d{3}/, '') : '');
const fold = line => {
  const out = [];
  let rest = line;
  while (rest.length > 74) { out.push(rest.slice(0, 74)); rest = ` ${rest.slice(74)}`; }
  out.push(rest);
  return out.join('\r\n');
};
const uidOf = (item, n) => `${slug(item.cardId, `card-${n}`)}@wekan`;
const nowIso = () => new Date().toISOString();

function socialCalcSave(rows) {
  const lines = ['version:1.5'];
  rows.forEach((row, r) => row.forEach((value, c) => {
    if (str(value) === '') return;
    lines.push(`cell:${colName(c + 1)}${r + 1}:t:${scEncode(value)}`);
  }));
  lines.push(`sheet:c:${Math.max(1, ...rows.map(r => r.length))}:r:${Math.max(1, rows.length)}:tvf:1`, 'valueformat:1:text-wiki');
  const part = '--SocialCalcSpreadsheetControlSave\nContent-type: text/plain; charset=UTF-8\n\n';
  return ['socialcalc:version:1.0', 'MIME-Version: 1.0', 'Content-Type: multipart/mixed; boundary=SocialCalcSpreadsheetControlSave', '']
    // The empty last element ends the header with its newline.
    .join('\n')
    + `${part}# SocialCalc Spreadsheet Control Save\nversion:1.0\npart:sheet\npart:edit\npart:audit\n`
    + `${part}${lines.join('\n')}\n`
    + `${part}version:1.0\nrowpane:0:1:1\ncolpane:0:1:1\necell:A1\n`
    + `${part}\n--SocialCalcSpreadsheetControlSave--\n`;
}

const WRITERS = {
  prioritize: built => {
    const jobs = built.items.map((item, n) => {
      const fields = item.customFields || {};
      const days = Number(fields['Repeat every (days)']);
      return { k: n + 1, v: { title: str(item.title) || 'Task', period: Math.round((days > 0 ? days : 7) * 86400000),
        lastDone: iso(item.endAt) ? Date.parse(item.endAt) : null,
        urgencyGrowth: ['linear', 'exponential', 'log'].includes(fields['Urgency growth']) ? fields['Urgency growth'] : 'linear' } };
    });
    return { files: { 'data/data.json': JSON.stringify({ jobs }), 'data/data-version': '3' }, random: { 'data/csrfkey': 32 } };
  },
  yatl: built => ({ sqlite: { 'data/db.sqlite3': {
    ddl: ['CREATE TABLE todos (\n\t\tid INTEGER PRIMARY KEY,\n\t\tdone BOOL NOT NULL,\n\t\tdescr VARCHAR NOT NULL\n\t)'],
    rows: { todos: built.items.map((item, n) => ({ id: n + 1, done: isDone(item) ? 1 : 0, descr: str(item.title) || 'Todo' })) },
  } } }),
  mutodo: built => {
    const entries = [];
    built.items.forEach((item, n) => {
      const at = iso(item.createdAt) || nowIso();
      entries.push([`todo_${n}`, JSON.stringify({ ID: n, Done: isDone(item), Title: str(item.title) || 'Todo', CreatedAt: at, UpdatedAt: at })]);
      const next = new Uint8Array(8);
      new DataView(next.buffer).setBigUint64(0, BigInt(n + 1));
      entries.push(['nextid', next]);
    });
    return { bytes: { 'data/todo.db/000000000.data': writeBitcask(entries) },
      files: { 'data/todo.db/config.json': '{"max_datafile_size":1048576,"max_key_size":64,"max_value_size":65536,"sync":false}',
        // bitcask's lock file, empty, as in μTodo's own grain.
        'data/todo.db/lock': '' } };
  },
  sandchat: built => {
    const names = [];
    const messages = [];
    for (const item of built.items) {
      for (const c of list(item.comments)) {
        if (!str(c && c.text).trim()) continue;
        const name = str(c.author) || 'wekan';
        if (!names.includes(name)) names.push(name);
        messages.push({ name, text: str(c.text), date: iso(c.date) || iso(item.createdAt) || nowIso() });
      }
    }
    messages.sort((a, b) => a.date.localeCompare(b.date));
    const stamp = value => value.replace('T', ' ').replace('Z', '').replace(/(\.\d{3})$/, '$1000');
    const now = stamp(nowIso());
    // The empty marker of the newest migration, as SandChat's own grain has:
    // the database is already migrated.
    return { files: { 'data/migrations/20161031003402': '' }, sqlite: { 'data/db.sqlite3': {
      ddl: [
        'CREATE TABLE "schema_migrations" ("version" varchar NOT NULL PRIMARY KEY)',
        'CREATE TABLE "ar_internal_metadata" ("key" varchar NOT NULL PRIMARY KEY, "value" varchar, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL)',
        'CREATE TABLE "users" ("id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "uid" text NOT NULL, "name" text, "picture" text, "pronouns" text, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "tabs_count" integer DEFAULT 0)',
        'CREATE TABLE "tabs" ("id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "tid" varchar NOT NULL, "user_id" integer, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL)',
        'CREATE TABLE "chats" ("id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "message" text, "user_id" integer, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL)',
      ],
      rows: {
        schema_migrations: ['20161023151424', '20161023151458', '20161031003402'].map(version => ({ version })),
        ar_internal_metadata: [{ key: 'environment', value: 'production', created_at: now, updated_at: now }],
        users: names.map((name, n) => ({ id: n + 1, uid: randomHex(32), name, picture: null, pronouns: null, created_at: now, updated_at: now, tabs_count: 0 })),
        chats: messages.map((m, n) => ({ id: n + 1, message: m.text, user_id: names.indexOf(m.name) + 1, created_at: stamp(m.date), updated_at: stamp(m.date) })),
      },
    } } };
  },
  ethercalc: built => {
    const rows = [ETHERCALC_COLUMNS, ...built.items.map(item => [str(item.title), str(item.listTitle), str(item.swimlaneTitle) === 'Default' ? '' : str(item.swimlaneTitle),
      list(item.labels).join(', '), iso(item.startAt).slice(0, 10), iso(item.dueAt).slice(0, 10), str(item.description)])];
    return { files: {
      'data/dump/snapshot-sheet.txt': socialCalcSave([['#url', '#title'], ['/sheet1', built.title || 'Sheet1']]),
      'data/dump/snapshot-sheet1.txt': socialCalcSave(rows),
      // The sheets' edit history, empty: the snapshots are the whole of them.
      'data/dump/audit-sheet.txt': '',
      'data/dump/audit-sheet1.txt': '',
    } };
  },
  radicalecalendar: built => {
    const lines = ['BEGIN:VCALENDAR', 'PRODID:-//WeKan//Sandstorm grain export//EN', 'VERSION:2.0'];
    built.items.forEach((item, n) => {
      const uid = uidOf(item, n);
      const start = icsDate(item.startAt) || icsDate(item.dueAt);
      const kind = start ? 'VEVENT' : 'VTODO';
      lines.push(`BEGIN:${kind}`, `UID:${uid}`, `DTSTAMP:${icsDate(item.createdAt) || icsDate(nowIso())}`, fold(`SUMMARY:${icsText(item.title)}`));
      if (str(item.description)) lines.push(fold(`DESCRIPTION:${icsText(item.description)}`));
      if (list(item.labels).length) lines.push(fold(`CATEGORIES:${list(item.labels).map(icsText).join(',')}`));
      if (kind === 'VEVENT') {
        lines.push(`DTSTART:${start}`);
        if (icsDate(item.dueAt) && icsDate(item.dueAt) !== start) lines.push(`DTEND:${icsDate(item.dueAt)}`);
      } else lines.push(`STATUS:${isDone(item) ? 'COMPLETED' : 'NEEDS-ACTION'}`);
      lines.push(`X-RADICALE-NAME:${uid}.ics`, `END:${kind}`);
    });
    lines.push('END:VCALENDAR', '');
    return { files: {
      'data/action.txt': 'caldav',
      'data/lib/radicale/owner/calendar.ics': lines.join('\r\n'),
      'data/lib/radicale/owner/calendar.ics.props': '{"tag": "VCALENDAR"}',
    } };
  },
  radicalecontacts: built => {
    const out = [];
    built.items.forEach((item, n) => {
      const uid = uidOf(item, n);
      const fields = item.customFields || {};
      const vc = s => str(s).replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\r?\n/g, '\\n');
      const name = str(item.title).trim() || 'Contact';
      const parts = name.split(/\s+/);
      const lines = ['BEGIN:VCARD', 'VERSION:3.0', `UID:${uid}`, fold(`FN:${vc(name)}`),
        fold(`N:${vc(parts.length > 1 ? parts[parts.length - 1] : name)};${vc(parts.length > 1 ? parts.slice(0, -1).join(' ') : '')};;;`)];
      if (str(item.description)) lines.push(fold(`NOTE:${vc(item.description)}`));
      if (list(item.labels).length) lines.push(fold(`CATEGORIES:${list(item.labels).map(vc).join(',')}`));
      for (const [prop, label] of Object.entries(VCARD_FIELDS)) {
        if (str(fields[label]).trim()) lines.push(fold(`${prop}:${prop === 'ORG' ? str(fields[label]).split(/\s*,\s*/).map(vc).join(';') : vc(fields[label])}`));
      }
      lines.push(`X-RADICALE-NAME:${uid}.vcf`, 'END:VCARD');
      out.push(lines.join('\r\n'));
    });
    return { files: {
      'data/action.txt': 'carddav',
      'data/lib/radicale/owner/addressbook.vcf': `${out.join('\r\n')}\r\n`,
      'data/lib/radicale/owner/addressbook.vcf.props': '{"tag": "VADDRESSBOOK"}',
    } };
  },
  davros: built => {
    // A file or folder name as Davros shows it: spaces kept, only what no
    // file name may hold taken out.
    const fileName = (value, fallback) => (str(value).replace(/[\u0000-\u001f/\\:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim()
      .replace(/^\.+/, '').slice(0, 120)) || fallback;
    const files = {};
    const attachments = {};
    const used = new Set();
    built.items.forEach((item, n) => {
      const folder = fileName(item.listTitle, 'Files');
      let base = `${folder}/${fileName(item.title, `Card ${n + 1}`)}`;
      for (let k = 2; used.has(base); k += 1) base = `${folder}/${fileName(item.title, 'Card')} (${k})`;
      used.add(base);
      files[`data/davros/data/${base}.md`] = `# ${str(item.title)}\n\n${str(item.description)}\n`;
      for (const a of list(item.attachments)) {
        if (a && a.id) attachments[`data/davros/data/${base}/${fileName(a.name, `file ${a.id}`)}`] = str(a.id);
      }
    });
    return { files, attachments, dirs: ['data/davros/config/', 'data/davros/tmp/uploads/'] };
  },
  hackercms: built => {
    const used = new Set();
    const pages = built.items.map((item, n) => {
      let name = slug(item.title, `page-${n + 1}`).toLowerCase();
      for (let k = 2; used.has(name) || name === 'index'; k += 1) name = `${slug(item.title, 'page').toLowerCase()}-${k}`;
      used.add(name);
      return { name, title: str(item.title), body: str(item.description), tags: list(item.labels) };
    });
    const yamlText = s => JSON.stringify(str(s));
    const esc = s => str(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const files = {
      'data/src/_config_published.yaml': '# Config used when you publish the live site.\n\nbaseurl: /  # Note:  Different from preview.\n',
      'data/src/_config_preview.yaml': '# Config used for the preview pane.\n\nbaseurl: /preview/\n',
      'data/src/_layouts/page.html': '<html>\n<body>\n{{ content }}\n</body>\n</html>\n',
      'data/src/index.html': `---\nlayout: page\ntitle: ${yamlText(built.title)}\nwekan: index\n---\n<h1>${esc(built.title)}</h1>\n<ul>\n${pages.map(p => `<li><a href="${p.name}.html">${esc(p.title)}</a></li>`).join('\n')}\n</ul>\n`,
    };
    for (const page of pages) {
      files[`data/src/${page.name}.md`] = `---\nlayout: page\ntitle: ${yamlText(page.title)}\n${page.tags.length ? `tags: [${page.tags.map(yamlText).join(', ')}]\n` : ''}---\n${page.body}\n`;
    }
    return { files, symlinks: { 'data/www': 'published' }, dirs: ['data/published/', 'data/preview/'] };
  },
};

// The grain's files from formatSandstormGrain's checked values:
//   { metadata: bytes, files: { path: text }, bytes: { path: Uint8Array },
//     sqlite: { path: { ddl, rows } }, attachments: { path: attachmentId },
//     random: { path: size }, symlinks: { path: target }, dirs: [path/] }
// Every path is under data/; the server writes the SQLite databases, the
// attachments' bytes and the random keys.
export function sandstormGrainFiles(built = {}) {
  const app = sandstormApp(built && built.sandstorm);
  if (!app || !app.export || !WRITERS[app.app]) throw new Error('Not a Sandstorm grain export');
  const safe = { ...built, items: list(built.items).filter(isObject) };
  const out = WRITERS[app.app](safe);
  for (const group of ['files', 'bytes', 'sqlite', 'attachments', 'random', 'symlinks']) {
    for (const path of Object.keys(out[group] || {})) {
      if (!/^data\/[^\0]*$/.test(path) || path.split('/').some(p => p === '..' || p === '')) throw new Error(`A grain path outside data/: ${path}`);
    }
  }
  return {
    metadata: writeGrainInfo({ appId: app.appId, appVersion: app.appVersion, title: safe.title || app.name }),
    files: out.files || {}, bytes: out.bytes || {}, sqlite: out.sqlite || {}, attachments: out.attachments || {},
    random: out.random || {}, symlinks: out.symlinks || {}, dirs: out.dirs || [],
  };
}
