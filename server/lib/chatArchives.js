'use strict';
// Server-only: the .zip exports of Slack and Google Takeout, opened into what
// models/lib/chatExportFormats.js and models/lib/googleTakeoutFormat.js read.
//
// An upload is the user's file, so a zip is read with the guards of the other
// zip imports (server/lib/vikunjaArchive.js, ZipBombBleed): the upload and the
// number of entries are capped before anything inflates, the size an entry
// declares is checked first, and every entry read inflates through
// readZipEntryBounded, counting what actually comes out against one budget
// for the whole archive. Nothing is written to disk and an entry's name is
// only matched, never used as a path. The Slack and Google Takeout readers
// read no attachments; Telegram's and Discord's export folders carry the
// message files beside the JSON, and those are read as bytes, under the same
// budget, for the import to attach.
const { declaredZipEntrySize, readZipEntryBounded } = require('./boundedZipEntry');

const MAX_ZIP_BYTES = 128 * 1024 * 1024;
const MAX_ZIP_ENTRIES = 50000;
const MAX_INFLATED_BYTES = 256 * 1024 * 1024;
const MAX_ENTRY_BYTES = 128 * 1024 * 1024;

// value: { zipBase64 } from the page, or { zipFile, inflateLimit } - an
// upload on the local disk (server/lib/importUpload.js), opened from there so
// the archive is never in memory whole. What its entries inflate to is counted
// against MAX_INFLATED_BYTES, or for an upload against inflateLimit: the
// administrator's limit, or with none the free disk space, as if it were
// unpacked there (models/import.js).
async function openZip(value, what) {
  const unzipper = require('unzipper');
  let directory;
  if (value && typeof value.zipFile === 'string') {
    const fd = await require('fs').promises.open(value.zipFile, 'r');
    const head = Buffer.alloc(4);
    try { await fd.read(head, 0, 4, 0); } finally { await fd.close(); }
    const magic = head.readUInt32LE(0);
    if (magic !== 0x04034b50 && magic !== 0x06054b50) throw new Error(`${what} is not a .zip file`);
    try {
      directory = await unzipper.Open.file(value.zipFile);
    } catch (error) {
      throw new Error(`${what} is not a readable .zip file`);
    }
  } else {
    const base64 = value && value.zipBase64;
    if (typeof base64 !== 'string' || !base64) throw new Error(`${what} is empty`);
    if (base64.length > Math.ceil(MAX_ZIP_BYTES / 3) * 4 + 4) throw new Error(`${what} is larger than ${MAX_ZIP_BYTES} bytes`);
    const buffer = Buffer.from(base64, 'base64');
    const magic = buffer.length >= 4 ? buffer.readUInt32LE(0) : 0;
    if (magic !== 0x04034b50 && magic !== 0x06054b50) throw new Error(`${what} is not a .zip file`);
    try {
      directory = await unzipper.Open.buffer(buffer);
    } catch (error) {
      throw new Error(`${what} is not a readable .zip file`);
    }
  }
  const entries = directory.files.filter(entry => entry.type === 'File');
  if (entries.length > MAX_ZIP_ENTRIES) throw new Error(`${what} has more than ${MAX_ZIP_ENTRIES} files`);
  const inflateLimit = value && value.zipFile && Number(value.inflateLimit) > 0 ? Number(value.inflateLimit) : MAX_INFLATED_BYTES;
  const budget = { remaining: inflateLimit };
  const read = async entry => {
    if (declaredZipEntrySize(entry) > MAX_ENTRY_BYTES) throw new Error(`${what}: ${entry.path} is too large`);
    try {
      return (await readZipEntryBounded(entry, MAX_ENTRY_BYTES, budget)).toString('utf8');
    } catch (error) {
      if (/zip-(entry-)?too-large/.test(String(error && error.message))) throw new Error(`${what} is too large once unpacked`);
      throw new Error(`${what}: ${entry.path} could not be read`);
    }
  };
  const json = async entry => {
    try { return JSON.parse((await read(entry)).replace(/^\uFEFF/, '')); } catch (error) {
      if (/too large/.test(error.message)) throw error;
      return undefined;
    }
  };
  const bytes = async entry => {
    if (declaredZipEntrySize(entry) > MAX_ENTRY_BYTES) throw new Error(`${what}: ${entry.path} is too large`);
    try {
      return await readZipEntryBounded(entry, MAX_ENTRY_BYTES, budget);
    } catch (error) {
      if (/zip-(entry-)?too-large/.test(String(error && error.message))) throw new Error(`${what} is too large once unpacked`);
      throw new Error(`${what}: ${entry.path} could not be read`);
    }
  };
  // An entry streamed on rather than read - an mbox - under the same budget,
  // with no size of its own beyond it.
  const stream = entry => require('./boundedZipEntry').boundedZipEntryStream(entry, inflateLimit, budget);
  return { entries, read, json, stream, bytes };
}

const parts = path => String(path).split('/').filter(Boolean);
const base = path => parts(path).pop() || '';

// Slack: users.json, channels.json, groups.json, dms.json, mpims.json at the
// top, and each conversation's days as <folder>/<YYYY-MM-DD>.json.
async function readSlackExport(value) {
  const { entries, json } = await openZip(value, 'Slack export');
  const top = entries.filter(e => parts(e.path).length === 1);
  const named = name => top.find(e => e.path === name);
  if (!named('channels.json') && !named('dms.json') && !named('groups.json') && !named('mpims.json')) {
    throw new Error('Slack export has no channels.json');
  }
  const data = { messages: {} };
  for (const key of ['users', 'channels', 'groups', 'dms', 'mpims']) {
    const entry = named(`${key}.json`);
    // eslint-disable-next-line no-await-in-loop
    data[key] = entry ? (await json(entry)) || [] : [];
  }
  const days = entries.filter(e => parts(e.path).length === 2 && /^\d{4}-\d{2}-\d{2}\.json$/.test(base(e.path)))
    .sort((a, b) => a.path.localeCompare(b.path));
  for (const entry of days) {
    const folder = parts(entry.path)[0];
    // eslint-disable-next-line no-await-in-loop
    const day = await json(entry);
    if (Array.isArray(day)) (data.messages[folder] = data.messages[folder] || []).push(...day);
  }
  return data;
}

// Google Takeout: each product is recognised by what a file IS, not by its
// folder name, which Takeout writes in the account's language.
async function readGoogleTakeout(value) {
  const { entries, read, json, stream } = await openZip(value, 'Google Takeout export');
  const found = { tasks: [], keep: [], mail: [], calendars: [], chat: [], skipped: [] };
  const spaces = new Map();
  // Product folders seen, and those something was read from.
  const products = new Set();
  const used = new Set();
  for (const entry of entries) {
    const path = entry.path;
    const name = base(path).toLowerCase();
    // The product is the folder under Takeout/; a file beside them is none.
    const offset = parts(path)[0] === 'Takeout' ? 1 : 0;
    const product = parts(path).length > offset + 1 ? parts(path)[offset] : '';
    if (product) products.add(product);
    if (name.endsWith('.mbox')) {
      used.add(product);
      // Streamed, a message at a time: a Takeout mailbox can be many gigabytes.
      // eslint-disable-next-line no-await-in-loop
      const { messages } = await require('./mailImport').decodeMailStream(stream(entry));
      found.mail.push(...messages);
    } else if (name.endsWith('.ics')) {
      used.add(product);
      // eslint-disable-next-line no-await-in-loop
      found.calendars.push(await read(entry));
    } else if (name === 'messages.json' || name === 'group_info.json') {
      used.add(product);
      const folder = parts(path).slice(0, -1).join('/');
      // eslint-disable-next-line no-await-in-loop
      const data = await json(entry);
      const space = spaces.get(folder) || { folder: base(folder), name: '', members: [], messages: [] };
      if (data && name === 'messages.json' && Array.isArray(data.messages)) space.messages.push(...data.messages);
      if (data && name === 'group_info.json') {
        space.name = typeof data.name === 'string' ? data.name : '';
        space.members = Array.isArray(data.members) ? data.members : [];
      }
      spaces.set(folder, space);
    } else if (name.endsWith('.json')) {
      if (declaredZipEntrySize(entry) > 32 * 1024 * 1024) continue;
      // eslint-disable-next-line no-await-in-loop
      const data = await json(entry);
      if (data && data.kind === 'tasks#taskLists') { found.tasks.push(data); used.add(product); }
      else if (data && typeof data === 'object' && ('textContent' in data || 'listContent' in data)
        && ('isTrashed' in data || 'isArchived' in data || 'userEditedTimestampUsec' in data)) { found.keep.push(data); used.add(product); }
    }
  }
  found.chat = [...spaces.values()].filter(space => space.messages.length);
  found.skipped = [...products].filter(p => !used.has(p)).sort();
  return found;
}

// Telegram Desktop's and DiscordChatExporter's export folders, zipped: the
// JSON, and the files its messages name by a path relative to it (Telegram:
// photos/..., files/...; DiscordChatExporter with --media: <name>.json_Files/...).
// `files` maps such a path to the file's bytes as base64, for the parser
// (models/lib/chatExportFormats.js) to attach to the chat's card; a path the
// messages do not name is not read.
async function readFolderExport(value, what, pick) {
  const { entries, json, bytes } = await openZip(value, what);
  const jsonEntries = entries.filter(e => base(e.path).toLowerCase().endsWith('.json')).filter(pick);
  if (!jsonEntries.length) throw new Error(`${what} has no export JSON`);
  const docs = [];
  for (const entry of jsonEntries) {
    // eslint-disable-next-line no-await-in-loop
    const doc = await json(entry);
    if (doc && typeof doc === 'object') docs.push({ doc, folder: parts(entry.path).slice(0, -1).join('/') });
  }
  if (!docs.length) throw new Error(`${what}: its JSON could not be read`);
  const byPath = new Map(entries.map(e => [parts(e.path).join('/'), e]));
  const files = {};
  const wanted = new Set();
  const visit = (doc, folder) => {
    const add = rel => {
      const clean = String(rel || '').replace(/\\/g, '/').split('/').filter(p => p && p !== '.' && p !== '..').join('/');
      if (clean) wanted.add(JSON.stringify([folder, clean]));
    };
    const messages = Array.isArray(doc.messages) ? doc.messages
      : doc.chats && Array.isArray(doc.chats.list) ? doc.chats.list.flatMap(c => (c && Array.isArray(c.messages) ? c.messages : [])) : [];
    for (const m of messages) {
      if (!m || typeof m !== 'object') continue;
      for (const key of ['photo', 'file', 'thumbnail']) if (typeof m[key] === 'string') add(m[key]);
      for (const a of Array.isArray(m.attachments) ? m.attachments : []) if (a && typeof a.url === 'string' && !/^https?:/i.test(a.url)) add(decodeURIComponent(a.url));
    }
  };
  docs.forEach(({ doc, folder }) => visit(doc, folder));
  for (const item of wanted) {
    const [folder, rel] = JSON.parse(item);
    const entry = byPath.get([folder, rel].filter(Boolean).join('/'));
    // eslint-disable-next-line no-await-in-loop
    if (entry) files[rel] = (await bytes(entry)).toString('base64');
  }
  return { docs: docs.map(d => d.doc), files };
}

async function readTelegramExport(value) {
  const { docs, files } = await readFolderExport(value, 'Telegram export', e => base(e.path).toLowerCase() === 'result.json');
  return { ...docs[0], attachedFiles: files };
}

async function readDiscordExport(value) {
  const { docs, files } = await readFolderExport(value, 'Discord export', () => true);
  const exports = docs.filter(doc => doc.channel && Array.isArray(doc.messages));
  if (!exports.length) throw new Error('Discord export has no DiscordChatExporter JSON');
  return { exports, attachedFiles: files };
}

// Rocket.Chat: "Download my data" as JSON - channels.json, a { roomId,
// roomName, type } line per room, <roomName>.json beside it for each room, a
// message a line, and assets/<fileId>-<fileName> - or the zip its own CSV
// importer reads: users.csv, channels.csv and <channel>/<file>.csv. Either may
// sit in a folder of its own inside the zip. Into what
// models/lib/chatExportFormats.js parseRocketChatExport reads.
async function readRocketChatExport(value) {
  const what = 'Rocket.Chat export';
  const { entries, read, bytes } = await openZip(value, what);
  const shallowest = name => entries.filter(e => base(e.path).toLowerCase() === name)
    .sort((a, b) => parts(a.path).length - parts(b.path).length)[0];
  const dirOf = entry => parts(entry.path).slice(0, -1).join('/');
  const inDir = (dir, rel) => [dir, rel].filter(Boolean).join('/');
  const byPath = new Map(entries.map(e => [parts(e.path).join('/'), e]));
  const lines = text => String(text).split(/\r?\n/).filter(line => line.trim()).map(line => {
    try { return JSON.parse(line); } catch (error) { return null; }
  }).filter(Boolean);
  const channelsJson = shallowest('channels.json');
  if (channelsJson) {
    const dir = dirOf(channelsJson);
    const rooms = [];
    for (const room of lines(await read(channelsJson))) {
      const name = String(room.roomName || room.roomId || '');
      const entry = name && byPath.get(inDir(dir, `${name}.json`));
      if (!entry || name.includes('/')) continue;
      // eslint-disable-next-line no-await-in-loop
      rooms.push({ name, type: room.type, messages: lines(await read(entry)) });
    }
    if (!rooms.length) throw new Error(`${what}: channels.json names no room file beside it`);
    // Only the files the messages name are read.
    const attachedFiles = {};
    for (const room of rooms) {
      for (const m of room.messages) {
        for (const a of Array.isArray(m && m.attachments) ? m.attachments : []) {
          if (!a || !a.fileId || !a.fileName) continue;
          const rel = `assets/${a.fileId}-${a.fileName}`;
          const entry = byPath.get(inDir(dir, rel));
          // eslint-disable-next-line no-await-in-loop
          if (entry && !attachedFiles[rel]) attachedFiles[rel] = (await bytes(entry)).toString('base64');
        }
      }
    }
    return { rooms, attachedFiles };
  }
  const anchor = shallowest('channels.csv') || shallowest('users.csv');
  if (!anchor) throw new Error(`${what} has no channels.json and no channels.csv`);
  const dir = dirOf(anchor);
  const depth = parts(dir).length;
  const top = name => byPath.get(inDir(dir, name));
  const folders = {};
  for (const entry of entries) {
    const path = parts(entry.path);
    if (path.length !== depth + 2 || path.slice(0, depth).join('/') !== dir || !/\.csv$/i.test(path[depth + 1])) continue;
    // eslint-disable-next-line no-await-in-loop
    (folders[path[depth]] = folders[path[depth]] || []).push(await read(entry));
  }
  // The CSV's rows are read by the parser (rocketChatCsvRooms).
  return { csv: {
    users: top('users.csv') ? await read(top('users.csv')) : '',
    channels: top('channels.csv') ? await read(top('channels.csv')) : '',
    folders,
  } };
}

module.exports = { readSlackExport, readGoogleTakeout, readTelegramExport, readDiscordExport, readRocketChatExport, openZip, MAX_ZIP_BYTES, MAX_INFLATED_BYTES };
