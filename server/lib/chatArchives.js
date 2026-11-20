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
// only matched, never used as a path. Attachments and images are not read.
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
  // An entry streamed on rather than read - an mbox - under the same budget,
  // with no size of its own beyond it.
  const stream = entry => require('./boundedZipEntry').boundedZipEntryStream(entry, inflateLimit, budget);
  return { entries, read, json, stream };
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

module.exports = { readSlackExport, readGoogleTakeout, MAX_ZIP_BYTES, MAX_INFLATED_BYTES };
