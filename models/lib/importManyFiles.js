// "Import many boards": several export files of one tool, or one .zip that
// holds them, each imported as its own board - what a Trello .zip of many
// boards does, for every import source. The import page and api.py build the
// same document per file that a single import sends (models/lib/importSourceShape.js).
// Plain JavaScript, so tests/importManyFiles.test.cjs runs it in Node.

import { unzipSync } from 'fflate';
import { readCsv } from './todoistCsvFormat.js';
import { csvSeparatorOf } from './csvImportMapping.js';
import { IMPORT_SOURCES } from './importSources.js';

// What each source's file is sent as comes from the one description of every
// source (models/lib/importSources.js); these lists are read from it.
const keysWhere = test => IMPORT_SOURCES.filter(test).map(source => source.key);
// The import file is an Excel workbook: sent as { excelBase64 }.
export const EXCEL_SOURCES = keysWhere(source => source.send === 'excel');
// A .zip is ONE export of these tools (and of WeKan, with attachments): it is
// a board, not a container of boards.
export const ZIP_EXPORT_SOURCES = keysWhere(source => Boolean(source.zipSend));
// The import reads the file's text.
export const TEXT_SOURCES = keysWhere(source => source.send === 'text');
// Imported by their own creators, not the generalized importer: "One board
// per project" does not apply to them.
export const OWN_CREATOR_SOURCES = keysWhere(source => source.creator !== 'generalized');
export const isGeneralizedSource = source => !OWN_CREATOR_SOURCES.includes(source);

export const MAX_MANY_FILES = 500;
export const MAX_MANY_BYTES = 200 * 1024 * 1024;

const extensionOf = name => {
  const match = /\.([a-z0-9]+)$/i.exec(String(name || ''));
  return match ? match[1].toLowerCase() : '';
};
const isNoise = path => /(^|\/)(__MACOSX\/|\.)/.test(path) || /\/$/.test(path);

function toBase64(bytes) {
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary); // eslint-disable-line no-undef
}

// files: [{ name, bytes: Uint8Array }] as chosen. A .zip that is not one export
// of the source is opened and each file in it becomes one file to import.
// Returns { files, skipped: [reason] }.
export function expandFiles(source, files) {
  const out = [];
  const skipped = [];
  let total = 0;
  const take = (name, bytes) => {
    if (out.length >= MAX_MANY_FILES) { skipped.push(`${name}: more than ${MAX_MANY_FILES} files`); return; }
    total += bytes.length;
    if (total > MAX_MANY_BYTES) { skipped.push(`${name}: more than ${MAX_MANY_BYTES / 1024 / 1024} MB in all`); return; }
    out.push({ name, bytes });
  };
  for (const file of files || []) {
    const name = String(file.name || 'file');
    if (extensionOf(name) === 'zip' && !ZIP_EXPORT_SOURCES.includes(source)) {
      let entries;
      try {
        // Sizes are checked before inflating: an entry's declared size is
        // what fflate's filter sees.
        let declared = 0;
        entries = unzipSync(file.bytes, { filter: entry => {
          if (isNoise(entry.name)) return false;
          declared += entry.originalSize || 0;
          return declared <= MAX_MANY_BYTES;
        } });
      } catch (error) {
        skipped.push(`${name}: not a readable .zip`);
        continue;
      }
      Object.keys(entries).sort().forEach(path => take(`${name}/${path}`, entries[path]));
    } else {
      take(name, file.bytes);
    }
  }
  return { files: out, skipped };
}

// The document a single import of this file sends, for `source`.
export function documentForFile(source, name, bytes) {
  const ext = extensionOf(name);
  if (EXCEL_SOURCES.includes(source) || (source === 'plane' && ext === 'xlsx')) {
    return source === 'plane' ? { xlsxBase64: toBase64(bytes) } : { excelBase64: toBase64(bytes) };
  }
  if (ext === 'zip' && ZIP_EXPORT_SOURCES.includes(source) && source !== 'wekan') return { zipBase64: toBase64(bytes) };
  const text = new TextDecoder('utf-8').decode(bytes).replace(/^﻿/, '');
  if (source === 'csv') {
    // As the import page: a tab separated file is read with tabs, so a value
    // with a comma in it stays one value, and a file with more semicolons than
    // commas in its first line is semicolon separated.
    return readCsv(text, 'CSV', csvSeparatorOf(text)).filter(row => row.some(cell => String(cell).trim()));
  }
  if (TEXT_SOURCES.includes(source)) return text;
  return JSON.parse(text);
}
