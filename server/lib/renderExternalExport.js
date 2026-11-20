// One board in one external format (the export menu's tool list), as the
// bytes the export route sends: models/export.js serves it for one board, and
// server/lib/exportAllBoards.js writes it for every board into one .zip.
// Returns { json } for a JSON document - sent through sendJsonResult, which
// redacts admin-only custom fields - or { contentType, body } for a file of
// its own (text, a workbook or an archive).
const { buildExternalExport } = require('/models/lib/externalExporters');

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
// Markdown, the Leo outline (XML), todo.txt, Taskwarrior's JSON and the other
// text formats are files of their own, sent as the formatter wrote them.
const TEXT_TYPES = { markdown: 'text/markdown', leo: 'application/xml', todotxt: 'text/plain',
  taskwarrior: 'application/json', focalboard: 'application/x-ndjson', todoist: 'text/csv', meistertask: 'text/csv',
  obsidian: 'text/markdown', linear: 'text/csv', ticktick: 'text/csv', clickup: 'text/csv', nullboard: 'application/json',
  pivotal: 'text/csv', redmine: 'text/csv', notion: 'text/csv', superproductivity: 'application/json', quire: 'text/csv',
  opml: 'text/x-opml', orgmode: 'text/x-org',
  mbox: 'application/mbox', enex: 'application/enex+xml', mattermost: 'application/x-ndjson' };
// The tools whose import file is an Excel workbook, and the function writing
// it. Each require names its module literally: the bundler (rspack) resolves
// only a literal path, and the [path, name] pairs this used to hold were
// required through a variable - "require(path)" - which the bundle cannot
// resolve, so every workbook export answered 500.
const WORKBOOKS = {
  wrike: () => require('/server/lib/wrikeWorkbook').writeWrikeWorkbook, // models/lib/wrikeFormat.js
  monday: () => require('/server/lib/mondayWorkbook').writeMondayWorkbook, // models/lib/mondayFormat.js
  teamwork: () => require('/server/lib/teamworkWorkbook').writeTeamworkWorkbook, // models/lib/teamworkFormat.js
  businessmap: () => require('/server/lib/businessmapWorkbook').writeBusinessmapWorkbook, // models/lib/businessmapFormat.js
  planner: () => require('/server/lib/plannerWorkbook').writePlannerWorkbook, // models/lib/plannerFormat.js
};

async function renderExternalExport(boardId, format, fields) {
  const built = await buildExternalExport(boardId, format, fields);
  if (TEXT_TYPES[format]) {
    return { contentType: `${TEXT_TYPES[format]}; charset=utf-8`, body: String(built == null ? '' : built) };
  }
  // Vikunja's export is a .zip of data.json, filters.json and VERSION
  // (models/lib/vikunjaFormat.js); the HTML is made after the export
  // boundary has checked the text it is made from.
  if (format === 'vikunja') {
    const { vikunjaArchiveFiles } = require('/models/lib/vikunjaFormat');
    return { contentType: 'application/zip', body: require('/server/lib/vikunjaArchive').writeVikunjaArchive(vikunjaArchiveFiles(built)) };
  }
  if (WORKBOOKS[format]) {
    return { contentType: XLSX, body: await WORKBOOKS[format]()(built) };
  }
  // Every other format is one JSON document - Kanri's board export
  // (models/lib/kanriFormat.js) among them.
  return { json: built };
}

// The text formats that are a sequence of independent parts, written to the
// response a page of cards at a time instead of built whole: an .mbox is one
// message after another, an .enex a head, notes and a tail.
const STREAMED = {
  mbox: () => {
    const { formatMbox } = require('/models/lib/mailFormat');
    let first = true;
    return { head: '', page: collected => {
      const text = formatMbox(collected);
      const out = first || !text ? text : `\n${text}`;
      first = false;
      return out;
    }, tail: '' };
  },
  enex: () => {
    const { enexHead, enexNotes, ENEX_TAIL } = require('/models/lib/enexFormat');
    return { head: enexHead(), page: collected => enexNotes(collected.items), tail: ENEX_TAIL };
  },
};

// Writes the export to `res` page by page, or answers false when the format
// is not one that streams.
async function streamExternalExport(res, boardId, format, fields) {
  if (!STREAMED[format]) return false;
  const { externalExportPages } = require('/models/lib/externalExporters');
  const parts = STREAMED[format]();
  res.writeHead(200, { 'Content-Type': `${TEXT_TYPES[format]}; charset=utf-8` });
  if (parts.head) res.write(parts.head);
  for await (const collected of externalExportPages(boardId, format, fields)) {
    const text = parts.page(collected);
    // Wait for the socket when it is full, so the pages do not pile up in memory.
    if (text && !res.write(text)) await new Promise(resolve => res.once('drain', resolve));
  }
  res.end(parts.tail);
  return true;
}

module.exports = { renderExternalExport, streamExternalExport, STREAMED };
