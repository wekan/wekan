// "Export all boards": every board a user can export, in one format, in one
// download (server/lib/exportAllBoards.js). Plain JavaScript, so
// tests/exportAllBoards.test.cjs runs it in Node.
//
//   - Excel: ONE workbook, a sheet per board, the sheet named after the board.
//   - Every other format: a .zip with one file per board, named after it.

import { EXTERNAL_EXPORT_FORMATS } from './externalExportFormatters.js';

// The extension of one board's file, per format key. The tool formats are
// those of the board export menu (client/components/boards/exportScope.js);
// a format not listed here is a JSON document.
const EXTENSIONS = {
  wekan: 'json', csv: 'csv', scsv: 'csv', tsv: 'tsv',
  markdown: 'md', leo: 'leo', opml: 'opml', orgmode: 'org', todotxt: 'txt', taskwarrior: 'json', focalboard: 'jsonl',
  todoist: 'csv', meistertask: 'csv', obsidian: 'md', linear: 'csv', ticktick: 'csv', clickup: 'csv', nullboard: 'nbx',
  pivotal: 'csv', redmine: 'csv', notion: 'csv', quire: 'csv', superproductivity: 'json', vikunja: 'zip',
  planner: 'xlsx', monday: 'xlsx', wrike: 'xlsx', teamwork: 'xlsx', businessmap: 'xlsx',
};
export const extensionOf = format => EXTENSIONS[format] || 'json';

// The formats "Export all boards" offers: WeKan's own JSON, CSV/TSV, Excel and
// every tool format. PDF, HTML, iCalendar and the dependency graph are
// documents of one board and are not among them.
export const MASS_EXPORT_FORMATS = ['wekan', 'csv', 'scsv', 'tsv', 'excel', ...EXTERNAL_EXPORT_FORMATS];
export const MAX_MASS_EXPORT_BOARDS = 1000;

// ?boardIds=a,b,c -> ['a', 'b', 'c'], or null for every board. Ids are
// Meteor ids; anything else is dropped.
export function parseBoardIds(value) {
  if (value === undefined || value === null || value === '') return null;
  return [...new Set(String(value).split(',').map(id => id.trim()).filter(id => /^[A-Za-z0-9_-]{1,64}$/.test(id)))]
    .slice(0, MAX_MASS_EXPORT_BOARDS);
}

// Excel sheet names: at most 31 characters, none of \ / ? * [ ] :, not empty,
// not starting or ending with an apostrophe, and unique regardless of case.
// A name that is taken gets " (2)", " (3)" ... within the 31 characters.
export function uniqueSheetNames(titles) {
  const used = new Set();
  return (titles || []).map(title => {
    const base = String(title || '').replace(/[\\/?*[\]:]/g, ' ').replace(/\s+/g, ' ').trim()
      .replace(/^'+|'+$/g, '').trim().slice(0, 31).trim() || 'Board';
    let name = base;
    for (let n = 2; used.has(name.toLowerCase()); n += 1) {
      const suffix = ` (${n})`;
      name = `${base.slice(0, 31 - suffix.length).trim()}${suffix}`;
    }
    used.add(name.toLowerCase());
    return name;
  });
}

// File names in the .zip: the board's title as the single board export names
// its file (letters, digits, . _ -), unique regardless of case.
export function uniqueFileNames(titles, extension) {
  const used = new Set();
  return (titles || []).map(title => {
    const base = String(title || '').replace(/[^a-z0-9._-]+/gi, '-').replace(/-+/g, '-').replace(/^[-.]+|[-.]+$/g, '')
      .slice(0, 80) || 'board';
    let name = `${base}.${extension}`;
    for (let n = 2; used.has(name.toLowerCase()); n += 1) name = `${base}-${n}.${extension}`;
    used.add(name.toLowerCase());
    return name;
  });
}

// The download's own name.
export const massExportFilename = format => (format === 'excel' ? 'wekan-boards.xlsx' : `wekan-boards-${format}.zip`);
