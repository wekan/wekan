'use strict';
// Server-only: the files of the Microsoft imports that are not one text -
// an Outlook .msg (binary) or a .zip of .msg and .eml files, the Teams
// personal export (.tar) or a .zip with its messages.json, and the OneNote
// export .zip WeKan writes. Each upload is read from the disk or from base64
// under the same size limits as the other archives (server/lib/chatArchives.js).
const fs = require('fs');
const { openZip } = require('./chatArchives');

const MAX_BINARY_BYTES = 64 * 1024 * 1024;
const MAX_TAR_BYTES = 2 * 1024 * 1024 * 1024;
const MAX_JSON_BYTES = 256 * 1024 * 1024;

const isZip = value => value && (typeof value.zipFile === 'string' || typeof value.zipBase64 === 'string');

// { binaryFile } (an upload on the disk) or { binaryBase64 } as a Buffer.
async function binaryOf(value, what, max = MAX_BINARY_BYTES) {
  if (value && typeof value.binaryFile === 'string') {
    const { size } = await fs.promises.stat(value.binaryFile);
    if (size > max) throw new Error(`${what} is larger than ${max} bytes`);
    return fs.promises.readFile(value.binaryFile);
  }
  if (value && typeof value.binaryBase64 === 'string' && value.binaryBase64) {
    if (value.binaryBase64.length > Math.ceil(max / 3) * 4 + 4) throw new Error(`${what} is larger than ${max} bytes`);
    return Buffer.from(value.binaryBase64, 'base64');
  }
  throw new Error(`Choose the ${what}`);
}

// Outlook: [message] for parseMailMessages.
async function readOutlookMessages(value) {
  const { readOutlookMsg } = require('../../models/lib/outlookMsgFormat');
  const { decodeMail } = require('./mailImport');
  if (isZip(value)) {
    const { entries, read, bytes } = await openZip(value, 'Outlook .zip');
    const messages = [];
    for (const entry of entries.filter(e => /\.(msg|eml)$/i.test(e.path) && !/(^|\/)(__MACOSX|\.)/.test(e.path))) {
      // eslint-disable-next-line no-await-in-loop
      if (/\.msg$/i.test(entry.path)) messages.push(readOutlookMsg(new Uint8Array(await bytes(entry))));
      // eslint-disable-next-line no-await-in-loop
      else messages.push(...await decodeMail(await read(entry)));
    }
    if (!messages.length) throw new Error('The Outlook .zip has no .msg or .eml files');
    return messages;
  }
  return [readOutlookMsg(new Uint8Array(await binaryOf(value, 'Outlook .msg file')))];
}

// The messages.json of a .tar: ustar headers of 512 bytes, each file's data
// after its header in 512-byte blocks; a pax header ("x") may give the path.
async function messagesJsonFromTar(file) {
  const fd = await fs.promises.open(file, 'r');
  try {
    const { size } = await fd.stat();
    if (size > MAX_TAR_BYTES) throw new Error(`The Teams export is larger than ${MAX_TAR_BYTES} bytes`);
    let at = 0;
    let paxPath = '';
    const header = Buffer.alloc(512);
    while (at + 512 <= size) {
      // eslint-disable-next-line no-await-in-loop
      await fd.read(header, 0, 512, at);
      if (header.every(b => b === 0)) break;
      const field = (start, length) => header.subarray(start, start + length).toString('utf8').replace(/\0.*$/s, '');
      const length = parseInt(field(124, 12).trim() || '0', 8) || 0;
      const type = String.fromCharCode(header[156] || 48);
      const prefix = field(345, 155);
      const name = paxPath || (prefix ? `${prefix}/${field(0, 100)}` : field(0, 100));
      paxPath = '';
      const data = at + 512;
      if (type === 'x' && length < 1024 * 1024) {
        const pax = Buffer.alloc(length);
        // eslint-disable-next-line no-await-in-loop
        await fd.read(pax, 0, length, data);
        const match = /\d+ path=([^\n]*)\n/.exec(pax.toString('utf8'));
        if (match) paxPath = match[1];
      } else if ((type === '0' || type === '\0') && /(^|\/)messages\.json$/i.test(name)) {
        if (length > MAX_JSON_BYTES) throw new Error('messages.json of the Teams export is too large');
        const out = Buffer.alloc(length);
        // eslint-disable-next-line no-await-in-loop
        await fd.read(out, 0, length, data);
        return out.toString('utf8');
      }
      at = data + Math.ceil(length / 512) * 512;
    }
  } finally { await fd.close(); }
  throw new Error('The Teams export .tar has no messages.json');
}

// Teams: the parsed JSON parseTeamsExport reads, from a .tar, a .zip or JSON.
async function readTeamsExport(value) {
  if (isZip(value)) {
    const { entries, read } = await openZip(value, 'Teams .zip');
    const entry = entries.filter(e => /(^|\/)messages(_[^/]*)?\.json$/i.test(e.path))
      .sort((a, b) => a.path.split('/').length - b.path.split('/').length)[0];
    if (!entry) throw new Error('The Teams .zip has no messages.json');
    return JSON.parse((await read(entry)).replace(/^﻿/, ''));
  }
  if (value && typeof value.binaryFile === 'string') return JSON.parse((await messagesJsonFromTar(value.binaryFile)).replace(/^﻿/, ''));
  if (value && typeof value.binaryBase64 === 'string') {
    const dir = await fs.promises.mkdtemp(require('path').join(require('os').tmpdir(), 'wekan-teams-'));
    const file = require('path').join(dir, 'export.tar');
    try {
      await fs.promises.writeFile(file, await binaryOf(value, 'Teams export', MAX_BINARY_BYTES));
      return JSON.parse((await messagesJsonFromTar(file)).replace(/^﻿/, ''));
    } finally { await fs.promises.rm(dir, { recursive: true, force: true }); }
  }
  return value;
}

// OneNote: onenote.json of the .zip WeKan exports, or the JSON itself.
async function readOnenoteExport(value) {
  if (!isZip(value)) return value;
  const { entries, read } = await openZip(value, 'OneNote .zip');
  const entry = entries.filter(e => /(^|\/)onenote\.json$/i.test(e.path))
    .sort((a, b) => a.path.split('/').length - b.path.split('/').length)[0];
  if (!entry) throw new Error('The OneNote .zip has no onenote.json');
  return JSON.parse(await read(entry));
}

module.exports = { readOutlookMessages, readTeamsExport, readOnenoteExport, messagesJsonFromTar, binaryOf };
