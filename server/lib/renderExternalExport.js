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

// The formats whose rows refer to other cards - a parent's number, columns
// counted over the board, the order of the lists - written a page at a time
// with the board's light references (models/lib/exportPaging.js): the
// formatter writes the head on the first page and the tail on the last.
// byList: its cards are written list by list (Todoist's sections).
// byList: 'lists': the outlines, list by list in the board's order, each
// list's heading opened before its first card and closed after its last.
const PAGED = {
  todotxt: {}, taskwarrior: {}, meistertask: {}, linear: {}, ticktick: {}, clickup: {},
  pivotal: {}, redmine: {}, quire: {}, todoist: { byList: true }, notion: {},
  // NDJSON: the head named over the whole board on the first page, each
  // card's records after it.
  focalboard: {}, mattermost: {},
  markdown: { byList: 'lists' }, opml: { byList: 'lists' }, orgmode: { byList: 'lists' }, obsidian: { byList: 'lists' },
  // Leo: its outline from the light first pass on the first page, each page's
  // card texts after it.
  leo: { byList: 'lists' },
};

// The formats that are one JSON document whose cards are one array: `path`
// names the array (empty: the document is the array). The first page writes
// the document around it, with the array left open; every page then writes
// its own cards into it. Each part passes the export boundary and the
// admin-only field redaction as the whole document does (sendJsonResult).
const JSON_PAGED = {
  trello: { path: ['cards'] },
  jira: { path: ['issues'] },
  asana: { path: ['data'] },
  zenkit: { path: ['items'] },
  openproject: { path: ['_embedded', 'elements'] },
  github: { path: [] }, gitea: { path: [] }, forgejo: { path: [] }, gitlab: { path: [] },
  // Nested: the cards are in their lists' `cards` (Deck's stacks, Kanri's
  // columns). The pages come list by list; the lists are the document's own,
  // the same on every page (the formatter makes them from the board's lists
  // and its light first pass), each written around its cards.
  deck: { path: ['stacks'], nested: 'cards', byList: 'listIds' },
  kanri: { path: ['columns'], nested: 'cards', byList: 'listIds' },
};
const ARRAY_PLACE = '__wekan_paged_array__';

async function streamJsonExport(res, boardId, format, fields) {
  const { path, nested, byList } = JSON_PAGED[format];
  const { externalExportPages, formatters } = require('/models/lib/externalExporters');
  const { secureTransfer } = require('/server/lib/secureTransfer');
  const { containsFields } = require('/models/lib/adminOnlyCustomFields');
  const context = { direction: 'export', source: `export:${format}` };
  const userId = res.req && res.req.userId;
  const safe = async value => {
    const checked = secureTransfer(value, context);
    return containsFields(checked) ? require('/server/lib/adminOnlyCustomFields').redactFields(checked, userId) : checked;
  };
  const write = async text => {
    if (!res.write(text)) await new Promise(resolve => res.once('drain', resolve));
  };
  const place = JSON.stringify(ARRAY_PLACE);
  // A JSON text split around its placeholder.
  const around = async value => {
    const text = JSON.stringify(await safe(value));
    const at = text.indexOf(place);
    return [text.slice(0, at), text.slice(at + place.length)];
  };
  let tail = null;
  let count = 0;
  // Nested: each list written around its cards, opened when its first card
  // comes (or the next list's does) and closed after it.
  let shells = null;
  let open = -1;
  const openUpTo = async index => {
    while (open < index) {
      if (open >= 0) await write(`]${shells[open][1]}`);
      open += 1;
      await write(`${open ? ',' : ''}${shells[open][0]}[`);
      count = 0;
    }
  };
  for await (const collected of externalExportPages(boardId, format, fields, 500, { paged: true, ...(byList ? { byList } : {}) })) {
    const doc = formatters[format](collected);
    if (nested) {
      const lists = path.reduce((node, key) => (node ? node[key] : undefined), doc) || [];
      if (tail === null) {
        const empty = formatters[format]({ ...collected, items: [] });
        const shellLists = path.reduce((node, key) => (node ? node[key] : undefined), empty) || [];
        shells = [];
        for (const list of shellLists) {
          // eslint-disable-next-line no-await-in-loop
          shells.push(await around({ ...JSON.parse(JSON.stringify(list)), [nested]: ARRAY_PLACE }));
        }
        const skeleton = JSON.parse(JSON.stringify(empty));
        let node = skeleton;
        path.slice(0, -1).forEach(key => { node = node[key]; });
        node[path[path.length - 1]] = ARRAY_PLACE;
        const [head, rest] = await around(skeleton);
        tail = rest;
        res.statusCode = 200;
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Content-Type', 'application/json');
        await write(`${head}[`);
      }
      for (const [index, list] of lists.entries()) {
        const cards = list[nested] || [];
        if (!cards.length) continue;
        // eslint-disable-next-line no-await-in-loop
        await openUpTo(index);
        for (const card of cards) {
          // eslint-disable-next-line no-await-in-loop
          await write(`${count ? ',' : ''}${JSON.stringify(await safe(card))}`);
          count += 1;
        }
      }
      continue;
    }
    const cards = path.reduce((node, key) => (node ? node[key] : undefined), doc) || [];
    if (tail === null) {
      let skeleton = ARRAY_PLACE;
      if (path.length) {
        skeleton = JSON.parse(JSON.stringify(doc));
        let node = skeleton;
        path.slice(0, -1).forEach(key => { node = node[key]; });
        node[path[path.length - 1]] = ARRAY_PLACE;
      }
      const text = JSON.stringify(await safe(skeleton));
      const at = text.indexOf(JSON.stringify(ARRAY_PLACE));
      tail = text.slice(at + JSON.stringify(ARRAY_PLACE).length);
      res.statusCode = 200;
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Content-Type', 'application/json');
      await write(`${text.slice(0, at)}[`);
    }
    for (const card of cards) {
      // eslint-disable-next-line no-await-in-loop
      await write(`${count ? ',' : ''}${JSON.stringify(await safe(card))}`);
      count += 1;
    }
  }
  if (nested) {
    await openUpTo(shells.length - 1);
    res.end(`${shells.length ? `]${shells[shells.length - 1][1]}` : ''}]${tail}`);
    return true;
  }
  res.end(`]${tail}`);
  return true;
}

// Writes the export to `res` page by page, or answers false when the format
// is not one that streams.
async function streamExternalExport(res, boardId, format, fields) {
  if (JSON_PAGED[format]) return streamJsonExport(res, boardId, format, fields);
  if (!STREAMED[format] && !PAGED[format]) return false;
  const { externalExportPages, formatters } = require('/models/lib/externalExporters');
  const parts = STREAMED[format] ? STREAMED[format]() : { head: '', page: collected => formatters[format](collected), tail: '' };
  const options = PAGED[format] ? { paged: true, ...PAGED[format] } : {};
  res.writeHead(200, { 'Content-Type': `${TEXT_TYPES[format]}; charset=utf-8` });
  if (parts.head) res.write(parts.head);
  for await (const collected of externalExportPages(boardId, format, fields, 500, options)) {
    const text = parts.page(collected);
    // Wait for the socket when it is full, so the pages do not pile up in memory.
    if (text && !res.write(text)) await new Promise(resolve => res.once('drain', resolve));
  }
  res.end(parts.tail);
  return true;
}

module.exports = { renderExternalExport, streamExternalExport, STREAMED, PAGED, JSON_PAGED };
