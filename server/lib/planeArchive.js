'use strict';
// Opens Plane's issue export: the .zip that Workspace Settings > Exports
// writes (apps/api/plane/bgtasks/export_task.py), holding one
// <slug>-<projectId>.<csv|json|xlsx> per project or one
// <slug>-<workspaceId>.<ext>, or one .xlsx on its own. What the files mean is
// models/lib/planeFormat.js. Server only: ExcelJS is a server dependency.
//
// An upload is the user's file, so the zip is read with the same guards as
// the Vikunja and Trello zip imports: the upload and the number of entries
// are capped before anything inflates, the sizes the archive declares are
// checked first, and every entry that is read inflates through
// readZipEntryBounded (server/lib/boundedZipEntry.js), which counts the bytes
// that actually come out (ZipBombBleed). Nothing is written to disk and no
// entry name is used as a path.
const { declaredZipEntrySize, readZipEntryBounded } = require('./boundedZipEntry');

// The upload itself, as bytes (its base64 is a third larger).
const MAX_PLANE_ZIP_BYTES = 64 * 1024 * 1024;
// One export file, inflated.
const MAX_PLANE_FILE_BYTES = 64 * 1024 * 1024;
// Everything that is inflated, together.
const MAX_PLANE_INFLATED_BYTES = 128 * 1024 * 1024;
// Plane writes one file per exported project.
const MAX_PLANE_ZIP_ENTRIES = 1000;
const FORMATS = { json: 'json', csv: 'csv', xlsx: 'xlsx' };

const isZip = buffer => {
  // A zip (and an .xlsx) starts with a local file header (PK\3\4), or is an empty archive (PK\5\6).
  const magic = buffer.length >= 4 ? buffer.readUInt32LE(0) : 0;
  return magic === 0x04034b50 || magic === 0x06054b50;
};

// A cell as Plane wrote it: text, a number or a boolean. ExcelJS returns
// rich text, hyperlinks and formulas as objects.
function cellValue(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if (Array.isArray(value.richText)) return value.richText.map(part => String(part && part.text || '')).join('');
    if (value.text !== undefined) return String(value.text);
    if (value.result !== undefined) return cellValue(value.result);
    return '';
  }
  return value;
}

// The first sheet's rows, as arrays of cell values (Plane writes one sheet).
async function readPlaneWorkbook(buffer) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw new Error('Plane workbook is empty');
  if (buffer.length > MAX_PLANE_FILE_BYTES) throw new Error(`Plane workbook is larger than ${MAX_PLANE_FILE_BYTES} bytes`);
  if (!isZip(buffer)) throw new Error('Plane workbook is not an .xlsx file');
  const ExcelJS = require('@wekanteam/exceljs');
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch (error) {
    throw new Error('Plane workbook is not a readable .xlsx file');
  }
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('Plane workbook has no sheet');
  const rows = [];
  sheet.eachRow(row => rows.push(row.values.slice(1).map(cellValue)));
  return rows;
}

// { files: [{ name, format, content | rows }] } from the zip's bytes.
async function readPlaneArchive(buffer) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw new Error('Plane export is empty');
  if (buffer.length > MAX_PLANE_ZIP_BYTES) throw new Error(`Plane export is larger than ${MAX_PLANE_ZIP_BYTES} bytes`);
  if (!isZip(buffer)) throw new Error('Plane export is not a .zip file');
  const unzipper = require('unzipper');
  let directory;
  try {
    directory = await unzipper.Open.buffer(buffer);
  } catch (error) {
    throw new Error('Plane export is not a readable .zip file');
  }
  const entries = directory.files.filter(entry => entry.type === 'File');
  if (entries.length > MAX_PLANE_ZIP_ENTRIES) throw new Error(`Plane export has more than ${MAX_PLANE_ZIP_ENTRIES} files`);
  // An .xlsx is a zip too; Plane's export never holds one at its top level.
  if (entries.some(entry => entry.path === '[Content_Types].xml')) {
    throw new Error('Plane export is an .xlsx workbook, not the export .zip; choose the .zip or the workbook inside it');
  }
  const exported = entries
    .filter(entry => !/(^|\/)(__MACOSX|\.)/.test(entry.path))
    .map(entry => ({ entry, format: FORMATS[(/\.([a-z]+)$/i.exec(entry.path) || [])[1]?.toLowerCase()] }))
    .filter(file => file.format);
  if (!exported.length) throw new Error('Plane export has no .json, .csv or .xlsx file');
  const budget = { remaining: MAX_PLANE_INFLATED_BYTES };
  const files = [];
  for (const { entry, format } of exported) {
    if (declaredZipEntrySize(entry) > MAX_PLANE_FILE_BYTES) throw new Error(`Plane ${entry.path} is too large`);
    let bytes;
    try {
      bytes = await readZipEntryBounded(entry, MAX_PLANE_FILE_BYTES, budget);
    } catch (error) {
      if (/zip-(entry-)?too-large/.test(String(error && error.message))) throw new Error(`Plane ${entry.path} is too large`);
      throw new Error(`Plane ${entry.path} could not be read`);
    }
    const name = entry.path.split('/').pop();
    if (format === 'xlsx') files.push({ name, format, rows: await readPlaneWorkbook(bytes) });
    else files.push({ name, format, content: bytes.toString('utf8') });
  }
  return { files };
}

const tooLarge = base64 => base64.length > Math.ceil(MAX_PLANE_ZIP_BYTES / 3) * 4 + 4;

// What models/import.js received: { zipBase64 } or { xlsxBase64 } from the
// import page's file input, or the text of a JSON or CSV file, chosen or pasted.
async function readPlaneImport(value) {
  if (typeof value === 'string') return value;
  const zip = value && value.zipBase64;
  const xlsx = value && value.xlsxBase64;
  const base64 = typeof zip === 'string' && zip ? zip : typeof xlsx === 'string' && xlsx ? xlsx : '';
  if (!base64) throw new Error('Plane export is empty');
  // Refused before decoding: base64 is 4 characters for every 3 bytes.
  if (tooLarge(base64)) throw new Error(`Plane export is larger than ${MAX_PLANE_ZIP_BYTES} bytes`);
  const buffer = Buffer.from(base64, 'base64');
  if (base64 === zip) return readPlaneArchive(buffer);
  return { files: [{ name: 'workbook.xlsx', format: 'xlsx', rows: await readPlaneWorkbook(buffer) }] };
}

module.exports = {
  readPlaneArchive,
  readPlaneImport,
  readPlaneWorkbook,
  MAX_PLANE_ZIP_BYTES,
  MAX_PLANE_FILE_BYTES,
  MAX_PLANE_ZIP_ENTRIES,
};
