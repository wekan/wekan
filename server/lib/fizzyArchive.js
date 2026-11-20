'use strict';
// Server-only: Fizzy's export .zip files opened into what
// models/lib/fizzyFormat.js parseFizzyExport reads - with the guards of the
// other zip imports (server/lib/chatArchives.js openZip, ZipBombBleed): the
// upload and its entries are capped before anything inflates, and what does
// inflate counts against one budget. An entry's name is only matched, never
// used as a path, and only the files the records name are read.
//
//   Account export: data/account.json, data/users/<id>.json,
//   data/<table>/<id>.json and storage/<blob key>.
//   Personal data export: <number>.json per card, files under <number>/.
const { openZip } = require('./chatArchives');

const parts = path => String(path).split('/').filter(Boolean);
const TABLES = ['boards', 'columns', 'cards', 'comments', 'steps', 'tags', 'taggings', 'assignments', 'closures',
  'card_not_nows', 'card_goldnesses', 'action_text_rich_texts', 'active_storage_blobs', 'active_storage_attachments'];
const COUNTED = ['reactions', 'watches', 'pins'];

async function readFizzyExport(value) {
  const what = 'Fizzy export';
  const { entries, json, bytes } = await openZip(value, what);
  // The export may sit in a folder of its own inside the zip.
  const anchor = entries.find(e => /(^|\/)data\/account\.json$/.test(e.path));
  if (anchor) {
    const root = parts(anchor.path).slice(0, -2).join('/');
    const rel = e => {
      const p = parts(e.path);
      return root ? (p.slice(0, parts(root).length).join('/') === root ? p.slice(parts(root).length) : null) : p;
    };
    const tables = {};
    const users = [];
    const counts = {};
    const storage = new Map();
    for (const entry of entries) {
      const p = rel(entry);
      if (!p) continue;
      if (p.length === 2 && p[0] === 'storage') { storage.set(p[1], entry); continue; }
      if (p.length !== 3 || p[0] !== 'data' || !/^[0-9a-z]+\.json$/.test(p[2])) continue;
      if (COUNTED.includes(p[1])) { counts[p[1]] = (counts[p[1]] || 0) + 1; continue; }
      if (p[1] !== 'users' && !TABLES.includes(p[1])) continue;
      // eslint-disable-next-line no-await-in-loop
      const row = await json(entry);
      if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
      if (p[1] === 'users') users.push(row);
      else (tables[p[1]] = tables[p[1]] || []).push(row);
    }
    const files = {};
    for (const blob of tables.active_storage_blobs || []) {
      const entry = blob && typeof blob.key === 'string' ? storage.get(blob.key) : null;
      // eslint-disable-next-line no-await-in-loop
      if (entry) files[blob.key] = (await bytes(entry)).toString('base64');
    }
    return { account: (await json(anchor)) || {}, users, tables, files, counts };
  }
  const cardEntries = entries.filter(e => /^\d+\.json$/.test(parts(e.path).pop() || ''));
  if (!cardEntries.length) throw new Error(`${what} has no data/account.json and no card files`);
  const cards = [];
  const wanted = new Set();
  for (const entry of cardEntries) {
    // eslint-disable-next-line no-await-in-loop
    const card = await json(entry);
    if (!card || typeof card !== 'object' || card.number === undefined) continue;
    cards.push(card);
    const folder = parts(entry.path).slice(0, -1).join('/');
    const text = [card.description, ...(Array.isArray(card.comments) ? card.comments.map(c => c && c.body) : [])].join(' ');
    for (const match of String(text).matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (match[1].startsWith(`${card.number}/`)) wanted.add(JSON.stringify([folder, match[1]]));
    }
  }
  const byPath = new Map(entries.map(e => [parts(e.path).join('/'), e]));
  const files = {};
  for (const item of wanted) {
    const [folder, path] = JSON.parse(item);
    const entry = byPath.get([folder, path].filter(Boolean).join('/'));
    // eslint-disable-next-line no-await-in-loop
    if (entry) files[path] = (await bytes(entry)).toString('base64');
  }
  return { cards, files };
}

module.exports = { readFizzyExport };
