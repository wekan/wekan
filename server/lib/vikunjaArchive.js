'use strict';
// Opens and writes Vikunja's user data export zip; what data.json means is
// models/lib/vikunjaFormat.js. Server only.
//
// An upload is the user's file, so the zip is read with the same guards as
// the Trello zip import (server/routes/importTrelloZip.js): the upload and the
// number of entries are capped before anything inflates, the sizes the
// archive declares are checked first, and the entries that are read
// (data.json, VERSION, filters.json) inflate through readZipEntryBounded,
// which counts the bytes that actually come out (ZipBombBleed). Nothing is
// written to disk and no entry name is used as a path: files/<id> entries
// are only counted, never inflated.
const { declaredZipEntrySize, readZipEntryBounded } = require('./boundedZipEntry');

// The upload itself, as bytes (its base64 is a third larger).
const MAX_VIKUNJA_ZIP_BYTES = 64 * 1024 * 1024;
// data.json, inflated; the same bound the parser puts on its text.
const MAX_VIKUNJA_DATA_BYTES = 64 * 1024 * 1024;
const MAX_VIKUNJA_SMALL_ENTRY_BYTES = 1024 * 1024;
// Everything that is inflated, together.
const MAX_VIKUNJA_INFLATED_BYTES = MAX_VIKUNJA_DATA_BYTES + 2 * MAX_VIKUNJA_SMALL_ENTRY_BYTES;
const MAX_VIKUNJA_ZIP_ENTRIES = 20000;

// { version, data, files, filters } from the zip's bytes.
async function readVikunjaArchive(buffer) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw new Error('Vikunja export is empty');
  if (buffer.length > MAX_VIKUNJA_ZIP_BYTES) throw new Error(`Vikunja export is larger than ${MAX_VIKUNJA_ZIP_BYTES} bytes`);
  // A zip starts with a local file header (PK\3\4), or is an empty archive (PK\5\6).
  const magic = buffer.length >= 4 ? buffer.readUInt32LE(0) : 0;
  if (magic !== 0x04034b50 && magic !== 0x06054b50) throw new Error('Vikunja export is not a .zip file');
  const unzipper = require('unzipper');
  let directory;
  try {
    directory = await unzipper.Open.buffer(buffer);
  } catch (error) {
    throw new Error('Vikunja export is not a readable .zip file');
  }
  const entries = directory.files.filter(entry => entry.type === 'File');
  if (entries.length > MAX_VIKUNJA_ZIP_ENTRIES) throw new Error(`Vikunja export has more than ${MAX_VIKUNJA_ZIP_ENTRIES} files`);
  const named = name => entries.find(entry => entry.path === name);
  const dataEntry = named('data.json');
  const versionEntry = named('VERSION');
  const filtersEntry = named('filters.json');
  if (!dataEntry) throw new Error('Vikunja export has no data.json');
  if (!versionEntry) throw new Error('Vikunja export has no VERSION file');
  if (declaredZipEntrySize(dataEntry) > MAX_VIKUNJA_DATA_BYTES) throw new Error('Vikunja data.json is too large');
  // What actually inflates is counted, whatever the archive declares.
  const budget = { remaining: MAX_VIKUNJA_INFLATED_BYTES };
  const read = async (entry, max) => {
    try {
      return (await readZipEntryBounded(entry, max, budget)).toString('utf8');
    } catch (error) {
      if (/zip-(entry-)?too-large/.test(String(error && error.message))) throw new Error(`Vikunja ${entry.path} is too large`);
      throw new Error(`Vikunja ${entry.path} could not be read`);
    }
  };
  const version = (await read(versionEntry, MAX_VIKUNJA_SMALL_ENTRY_BYTES)).trim();
  const data = await read(dataEntry, MAX_VIKUNJA_DATA_BYTES);
  let filters = 0;
  if (filtersEntry) {
    try {
      const parsed = JSON.parse(await read(filtersEntry, MAX_VIKUNJA_SMALL_ENTRY_BYTES));
      filters = Array.isArray(parsed) ? parsed.length : 0;
    } catch (error) {
      filters = 0; // saved filters are not imported either way
    }
  }
  const files = entries.filter(entry => /^files\/\d+$/.test(entry.path)).length;
  return { version, data, files, filters };
}

// What models/import.js received: { zipBase64 } from the import page's file
// input, or the text of data.json pasted into the textarea.
async function readVikunjaImport(value) {
  if (typeof value === 'string') return value;
  const base64 = value && value.zipBase64;
  if (typeof base64 !== 'string' || !base64) throw new Error('Vikunja export is empty');
  // Refused before decoding: base64 is 4 characters for every 3 bytes.
  if (base64.length > Math.ceil(MAX_VIKUNJA_ZIP_BYTES / 3) * 4 + 4) {
    throw new Error(`Vikunja export is larger than ${MAX_VIKUNJA_ZIP_BYTES} bytes`);
  }
  return readVikunjaArchive(Buffer.from(base64, 'base64'));
}

// A .zip Buffer from vikunjaArchiveFiles()'s { 'data.json', 'filters.json', VERSION }.
function writeVikunjaArchive(files) {
  const { zipSync, strToU8 } = require('fflate');
  const entries = {};
  for (const [name, text] of Object.entries(files || {})) entries[name] = strToU8(String(text));
  return Buffer.from(zipSync(entries, { level: 6 }));
}

module.exports = {
  readVikunjaArchive,
  readVikunjaImport,
  writeVikunjaArchive,
  MAX_VIKUNJA_ZIP_BYTES,
  MAX_VIKUNJA_DATA_BYTES,
  MAX_VIKUNJA_ZIP_ENTRIES,
};
