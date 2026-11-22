'use strict';

// The slideshow's previews of attachments whose content is scattered through
// the file - an Outlook .msg (a Compound File: a little file system of
// sectors) and an OpenDocument (a ZIP whose text is in a compressed
// content.xml) - converted ONCE, a piece at a time, into a form that is read
// a row at a time:
//
//   <key>.rows   one JSON object a line - a display row
//   <key>.idx    where each row starts: (count + 1) little-endian uint64
//                offsets into .rows, the last one its length
//   <key>.json   { version, kind, count, bytes, truncated }
//
// so the slideshow fetches through HTTP Range requests only the index entries
// and rows on the screen, and its scrollbar is exactly the rows of the file
// (client/lib/attachmentRecords.js). The original is read through its own
// storage's byte ranges (fs, GridFS and the cloud adapters, #6745), in blocks
// of BLOCK_BYTES of which a few are cached: never whole. Written to temporary
// names and renamed when complete, so a preview half written is never served.
//
// The files are a cache: kept under the files root in attachment-previews/,
// named by the attachment and what it is (size, upload time, storage path),
// rebuilt when it changes, and removed with the attachment.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { isFilesRoot } = require('../../models/lib/filesRoot');

const FORMAT_VERSION = 1;
const BLOCK_BYTES = 64 * 1024;
const CACHE_BLOCKS = 64;
// What one preview may take on the server's disk: its guard, not a limit of
// what is shown - a preview that reaches it ends with a row saying so.
const MAX_PREVIEW_BYTES = 512 * 1024 * 1024;
// An OpenDocument row repeated (table:number-rows-repeated) more than this is
// written this many times: a sheet that repeats a real row a billion times is
// an attack on the disk, not a document.
const MAX_ROW_REPEAT = 100000;
const MAX_CONCURRENT = 2;

const PREVIEW_KINDS = new Set(['outlook', 'opendocument']);

function previewRoot() {
  const base = process.env.WRITABLE_PATH || process.cwd();
  return isFilesRoot(base) ? path.join(base, 'attachment-previews') : path.join(base, 'files', 'attachment-previews');
}

function previewKey(attachment) {
  const original = (attachment.versions && attachment.versions.original) || {};
  const what = JSON.stringify([attachment.size, attachment.uploadedAt || attachment.uploadedAtOstrio || '',
    original.path || '', original.meta && original.meta.gridFsFileId || '', FORMAT_VERSION]);
  const id = String(attachment._id).replace(/[^\w-]/g, '');
  return `${id}.${crypto.createHash('sha256').update(what).digest('hex').slice(0, 16)}`;
}

// The original through its storage, read(offset, length), in cached blocks.
function storageReader(strategy, size) {
  const cache = new Map();
  const block = async index => {
    if (cache.has(index)) {
      const hit = cache.get(index);
      cache.delete(index);
      cache.set(index, hit);
      return hit;
    }
    const start = index * BLOCK_BYTES;
    const end = Math.min(size, start + BLOCK_BYTES) - 1;
    const stream = strategy.getReadStream({ start, end });
    if (!stream) throw new Error('The attachment cannot be read from its storage');
    const chunks = [];
    let total = 0;
    for await (const chunk of stream) {
      chunks.push(chunk);
      total += chunk.length;
      if (total >= end - start + 1) break;
    }
    if (typeof stream.destroy === 'function') stream.destroy();
    const data = new Uint8Array(Buffer.concat(chunks).subarray(0, end - start + 1));
    cache.set(index, data);
    while (cache.size > CACHE_BLOCKS) cache.delete(cache.keys().next().value);
    return data;
  };
  const read = async (offset, length) => {
    const startAt = Math.max(0, offset);
    const endAt = Math.min(size, offset + length);
    if (endAt <= startAt) return new Uint8Array(0);
    const out = new Uint8Array(endAt - startAt);
    let filled = 0;
    for (let i = Math.floor(startAt / BLOCK_BYTES); i <= Math.floor((endAt - 1) / BLOCK_BYTES); i += 1) {
      const data = await block(i);
      const lo = Math.max(startAt, i * BLOCK_BYTES) - i * BLOCK_BYTES;
      const hi = Math.min(endAt, i * BLOCK_BYTES + data.length) - i * BLOCK_BYTES;
      if (hi > lo) { out.set(data.subarray(lo, hi), filled); filled += hi - lo; }
    }
    return out.subarray(0, filled);
  };
  return { size, read, bytes: (a, b) => read(a, b - a) };
}

// Rows -> the .rows and .idx files, a row at a time.
class RowWriter {
  constructor(rowsPath, indexPath, limit = MAX_PREVIEW_BYTES) {
    this.limit = limit;
    this.rows = fs.openSync(rowsPath, 'w');
    this.index = fs.openSync(indexPath, 'w');
    this.offset = 0;
    this.count = 0;
    this.indexBuffer = Buffer.alloc(8 * 4096);
    this.indexFill = 0;
    this.truncated = false;
  }

  writeIndex(offset) {
    this.indexBuffer.writeBigUInt64LE(BigInt(offset), this.indexFill);
    this.indexFill += 8;
    if (this.indexFill === this.indexBuffer.length) {
      fs.writeSync(this.index, this.indexBuffer, 0, this.indexFill);
      this.indexFill = 0;
    }
  }

  // false once the preview is as large as the disk guard allows.
  add(row) {
    if (this.truncated) return false;
    const line = Buffer.from(`${JSON.stringify(row)}\n`, 'utf8');
    if (this.offset + line.length > this.limit) {
      this.truncated = true;
      return false;
    }
    this.writeIndex(this.offset);
    fs.writeSync(this.rows, line);
    this.offset += line.length;
    this.count += 1;
    return true;
  }

  close() {
    this.writeIndex(this.offset);
    if (this.indexFill) fs.writeSync(this.index, this.indexBuffer, 0, this.indexFill);
    fs.closeSync(this.rows);
    fs.closeSync(this.index);
  }
}

// Long text as display rows of at most `width` characters, a paragraph's
// lines kept apart.
function textRows(kind, text, width = 1000) {
  const out = [];
  for (const line of String(text).split('\n')) {
    if (line.length <= width) out.push({ k: kind, v: line });
    else for (let at = 0; at < line.length; at += width) out.push({ k: kind, v: line.slice(at, at + width) });
  }
  return out;
}

class StopConversion extends Error {}

async function convertOutlook(source, add) {
  const { outlookMsgRows } = require('../../models/lib/outlookMsgFormat');
  const { Parser } = require('htmlparser2');
  await outlookMsgRows(source.read, source.size, async row => { if (!add(row)) throw new StopConversion(); }, { Parser });
}

async function convertOpenDocument(source, add) {
  const { ZipDirectory } = require('../../models/lib/zipDirectory');
  const { OdfBlocks } = require('../../models/lib/odfBlocks');
  const { Inflate } = require('fflate');
  const { Parser } = require('htmlparser2');
  const zip = await new ZipDirectory(source).open();
  let entry = null;
  for await (const e of zip.entries()) if (e.name === 'content.xml') { entry = e; break; }
  if (!entry) throw new Error('Not an OpenDocument file: no content.xml');
  if (entry.method !== 0 && entry.method !== 8) throw new Error('Unsupported compression in content.xml');
  const start = await zip.dataStart(entry);
  const blocks = new OdfBlocks();
  const parser = new Parser({
    onopentag: (name, attrs) => blocks.open(name, attrs),
    ontext: text => blocks.addText(text),
    onclosetag: name => blocks.close(name),
  }, { xmlMode: true, decodeEntities: true });
  const decoder = new TextDecoder('utf-8');
  const feed = data => parser.write(decoder.decode(data, { stream: true }));
  const inflate = entry.method === 8 ? new Inflate(data => feed(data)) : null;
  let repeat = { cells: null, n: 0 };
  const drain = () => {
    for (let b = blocks.take(); b; b = blocks.take()) {
      let rows;
      if (b.kind === 'row') {
        // A repeated row is given out one at a time by take(): count how many
        // in a row are the same block, and write at most MAX_ROW_REPEAT.
        if (repeat.cells === b.cells) repeat.n += 1;
        else repeat = { cells: b.cells, n: 1 };
        if (repeat.n >= MAX_ROW_REPEAT && blocks.queue[0] && blocks.queue[0].cells === b.cells) {
          blocks.queue.shift(); // the rest of the repeats, dropped at once rather than counted out
        }
        rows = [{ k: 'row', c: b.cells }];
      } else if (b.kind === 'page') rows = [{ k: 'page', v: b.name }];
      else rows = textRows(b.kind === 'heading' ? 'h' : 'p', b.text);
      for (const row of rows) if (!add(row)) throw new StopConversion();
    }
  };
  // Small pieces of the compressed data, so content.xml is inflated and parsed
  // a little at a time, however large it inflates.
  const end = start + entry.compressedSize;
  for (let at = start; at < end; at += BLOCK_BYTES) {
    const piece = await source.read(at, Math.min(BLOCK_BYTES, end - at));
    if (!piece.length) break;
    for (let i = 0; i < piece.length; i += 4096) {
      if (inflate) inflate.push(piece.subarray(i, i + 4096), false);
      else feed(piece.subarray(i, i + 4096));
      drain();
    }
  }
  if (inflate) inflate.push(new Uint8Array(0), true);
  parser.end();
  drain();
}

const CONVERTERS = { outlook: convertOutlook, opendocument: convertOpenDocument };

const building = new Map();
let running = 0;
const waiting = [];
async function slot() {
  if (running < MAX_CONCURRENT) { running += 1; return; }
  await new Promise(resolve => waiting.push(resolve));
  running += 1;
}
function release() {
  running -= 1;
  const next = waiting.shift();
  if (next) next();
}

function paths(attachment) {
  const key = previewKey(attachment);
  const dir = previewRoot();
  return { dir, key, rows: path.join(dir, `${key}.rows`), index: path.join(dir, `${key}.idx`), meta: path.join(dir, `${key}.json`) };
}

// The preview of an attachment, made now if it was not yet: its paths and meta.
async function ensurePreview(attachment, strategy, kind) {
  if (!PREVIEW_KINDS.has(kind)) throw new Error(`No preview conversion for ${kind}`);
  const p = paths(attachment);
  try {
    return { ...p, info: JSON.parse(fs.readFileSync(p.meta, 'utf8')) };
  } catch (e) { /* not made yet */ }
  if (!building.has(p.key)) {
    building.set(p.key, (async () => {
      await slot();
      const tmp = `.${process.pid}.${Date.now()}.tmp`;
      try {
        fs.mkdirSync(p.dir, { recursive: true });
        // An earlier preview of the same attachment, made before it changed.
        const id = p.key.split('.')[0];
        for (const name of fs.readdirSync(p.dir)) {
          if (name.startsWith(`${id}.`) && !name.startsWith(`${p.key}.`)) fs.rmSync(path.join(p.dir, name), { force: true });
        }
        const writer = new RowWriter(p.rows + tmp, p.index + tmp);
        let error = null;
        try {
          await CONVERTERS[kind](storageReader(strategy, Number(attachment.size) || 0), row => writer.add(row));
        } catch (e) {
          if (!(e instanceof StopConversion)) error = e;
        }
        if (error) {
          writer.close();
          fs.rmSync(p.rows + tmp, { force: true });
          fs.rmSync(p.index + tmp, { force: true });
          throw error;
        }
        writer.close();
        const info = { version: FORMAT_VERSION, kind, count: writer.count, bytes: writer.offset, truncated: writer.truncated };
        fs.renameSync(p.rows + tmp, p.rows);
        fs.renameSync(p.index + tmp, p.index);
        fs.writeFileSync(p.meta + tmp, JSON.stringify(info));
        fs.renameSync(p.meta + tmp, p.meta);
        return info;
      } finally {
        release();
        building.delete(p.key);
      }
    })());
  }
  return { ...p, info: await building.get(p.key) };
}

// Every preview of an attachment, when it is removed.
function removePreviews(attachmentId) {
  const dir = previewRoot();
  const id = String(attachmentId || '').replace(/[^\w-]/g, '');
  if (!id) return;
  let names = [];
  try { names = fs.readdirSync(dir); } catch (e) { return; }
  for (const name of names) if (name.startsWith(`${id}.`)) fs.rmSync(path.join(dir, name), { force: true });
}

module.exports = {
  ensurePreview, removePreviews, previewRoot, previewKey, storageReader, RowWriter, textRows,
  PREVIEW_KINDS, FORMAT_VERSION, MAX_PREVIEW_BYTES, MAX_ROW_REPEAT, BLOCK_BYTES,
};
