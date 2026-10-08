'use strict';
// Opens Notion's "Markdown & CSV" export .zip; what the CSV and the page
// files mean is models/lib/notionFormat.js. Server only.
//
// An upload is the user's file, so it is read with the same guards as the
// Vikunja and Trello zip imports (server/lib/vikunjaArchive.js,
// server/routes/importTrelloZip.js): the upload and the number of entries are
// capped before anything inflates, declared sizes are checked first, and every
// entry that is read inflates through readZipEntryBounded, which counts the
// bytes that actually come out against one budget for the whole import
// (ZipBombBleed). Nothing is written to disk and no entry name is used as a
// path; images and other files are only counted, never inflated.
//
// The layout is not specified by Notion. Read leniently:
//   - every .csv is a database; "<name> <id>_all.csv" (every row) is used
//     instead of "<name> <id>.csv" (the exported view) when both are there;
//   - a database's row pages are the .md files directly in the folder named
//     like its CSV ("Tasks <id>/"), or, without such a folder, those beside
//     the CSV (Create folders for subpages off);
//   - .md files deeper in that folder are subpages, and are counted;
//   - an export that holds only further .zip files (a large workspace export
//     comes in parts) is opened one level down, under the same budget.
const { declaredZipEntrySize, readZipEntryBounded } = require('./boundedZipEntry');

// The upload itself, as bytes (its base64 is a third larger).
const MAX_NOTION_ZIP_BYTES = 64 * 1024 * 1024;
const MAX_NOTION_CSV_BYTES = 32 * 1024 * 1024;
const MAX_NOTION_PAGE_BYTES = 2 * 1024 * 1024;
// Everything that is inflated, together - nested archives included.
const MAX_NOTION_INFLATED_BYTES = 96 * 1024 * 1024;
const MAX_NOTION_ZIP_ENTRIES = 20000;
const MAX_NOTION_PAGES = 20000;
const MAX_NOTION_DATABASES = 50;

const dirname = name => (name.includes('/') ? name.slice(0, name.lastIndexOf('/')) : '');
const basename = name => name.slice(name.lastIndexOf('/') + 1);

async function openZip(buffer) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw new Error('Notion export is empty');
  if (buffer.length > MAX_NOTION_ZIP_BYTES) throw new Error(`Notion export is larger than ${MAX_NOTION_ZIP_BYTES} bytes`);
  // A zip starts with a local file header (PK\3\4), or is an empty archive (PK\5\6).
  const magic = buffer.length >= 4 ? buffer.readUInt32LE(0) : 0;
  if (magic !== 0x04034b50 && magic !== 0x06054b50) throw new Error('Notion export is not a .zip file');
  const unzipper = require('unzipper');
  let directory;
  try {
    directory = await unzipper.Open.buffer(buffer);
  } catch (error) {
    throw new Error('Notion export is not a readable .zip file');
  }
  const entries = directory.files.filter(entry => entry.type === 'File');
  if (entries.length > MAX_NOTION_ZIP_ENTRIES) throw new Error(`Notion export has more than ${MAX_NOTION_ZIP_ENTRIES} files`);
  return entries;
}

// { databases: [{ name, csv, pages: [{ name, text }] }], assets, nested, other, skipped }
// from the export's bytes.
async function readNotionArchive(buffer, budget = { remaining: MAX_NOTION_INFLATED_BYTES }, depth = 0) {
  const entries = await openZip(buffer);
  const read = async (entry, max) => {
    if (declaredZipEntrySize(entry) > max) throw new Error(`Notion ${basename(entry.path)} is too large`);
    try {
      return await readZipEntryBounded(entry, max, budget);
    } catch (error) {
      if (/zip-(entry-)?too-large/.test(String(error && error.message))) throw new Error(`Notion ${basename(entry.path)} is too large`);
      throw new Error(`Notion ${basename(entry.path)} could not be read`);
    }
  };
  // Macs add __MACOSX/ and ._ files when a folder is zipped by hand.
  const useful = entries.filter(entry => !/(^|\/)__MACOSX\//.test(entry.path) && !/^\._/.test(basename(entry.path)));
  const csvs = useful.filter(entry => /\.csv$/i.test(entry.path));
  if (!csvs.length) {
    const zips = useful.filter(entry => /\.zip$/i.test(entry.path));
    if (depth === 0 && zips.length && zips.length === useful.length) {
      const merged = { databases: [], assets: 0, nested: 0, other: 0, skipped: [] };
      for (const inner of zips) {
        const part = await readNotionArchive(await read(inner, MAX_NOTION_ZIP_BYTES), budget, 1).catch(error => {
          if (/no database CSV/.test(error.message)) return null;
          throw error;
        });
        if (!part) continue;
        merged.databases.push(...part.databases);
        merged.assets += part.assets;
        merged.nested += part.nested;
        merged.other += part.other;
        merged.skipped.push(...part.skipped);
      }
      if (!merged.databases.length) throw new Error('Notion export has no database CSV');
      return merged;
    }
    throw new Error('Notion export has no database CSV');
  }
  // One database per CSV path, its _all.csv preferred.
  const byBase = new Map();
  for (const entry of csvs) {
    const base = entry.path.replace(/\.csv$/i, '').replace(/_all$/i, '');
    const all = /_all\.csv$/i.test(entry.path);
    if (!byBase.has(base) || all) byBase.set(base, entry);
  }
  if (byBase.size > MAX_NOTION_DATABASES) throw new Error(`Notion export has more than ${MAX_NOTION_DATABASES} databases`);
  const mds = useful.filter(entry => /\.md$/i.test(entry.path));
  const claimed = new Set();
  const databases = [];
  let pageCount = 0;
  let nested = 0;
  for (const [base, entry] of byBase) {
    const csv = (await read(entry, MAX_NOTION_CSV_BYTES)).toString('utf8');
    let own = mds.filter(md => dirname(md.path) === base);
    if (!own.length) own = mds.filter(md => dirname(md.path) === dirname(entry.path) && !claimed.has(md.path));
    nested += mds.filter(md => md.path.startsWith(`${base}/`) && dirname(md.path) !== base).length;
    const pages = [];
    for (const md of own) {
      claimed.add(md.path);
      pageCount += 1;
      if (pageCount > MAX_NOTION_PAGES) throw new Error(`Notion export has more than ${MAX_NOTION_PAGES} pages`);
      pages.push({ name: basename(md.path), text: (await read(md, MAX_NOTION_PAGE_BYTES)).toString('utf8') });
    }
    databases.push({ name: basename(entry.path), csv, pages });
  }
  // Pages that are neither a row nor a subpage of one: pages outside any database.
  const bases = [...byBase.keys()];
  const other = mds.filter(md => !claimed.has(md.path) && !bases.some(base => md.path.startsWith(`${base}/`))).length;
  const assets = useful.filter(entry => !/\.(csv|md|zip)$/i.test(entry.path)).length;
  const skipped = [];
  const views = csvs.length - byBase.size;
  if (views) skipped.push({ path: '/views', reason: `${views} view CSV(s) were left out for the _all.csv of the same database, which has every row` });
  return { databases, assets, nested, other, skipped };
}

// What models/import.js received: { zipBase64 } from the import page's file
// input, or the text of one database CSV pasted or chosen.
async function readNotionImport(value) {
  if (typeof value === 'string') return value;
  const base64 = value && value.zipBase64;
  if (typeof base64 !== 'string' || !base64) throw new Error('Notion export is empty');
  // Refused before decoding: base64 is 4 characters for every 3 bytes.
  if (base64.length > Math.ceil(MAX_NOTION_ZIP_BYTES / 3) * 4 + 4) {
    throw new Error(`Notion export is larger than ${MAX_NOTION_ZIP_BYTES} bytes`);
  }
  return readNotionArchive(Buffer.from(base64, 'base64'));
}

module.exports = {
  readNotionArchive,
  readNotionImport,
  MAX_NOTION_ZIP_BYTES,
  MAX_NOTION_ZIP_ENTRIES,
  MAX_NOTION_INFLATED_BYTES,
};
