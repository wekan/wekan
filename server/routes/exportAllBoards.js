import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { ReactiveCache } from '/imports/reactiveCache';
import {
  MASS_EXPORT_FORMATS, extensionOf, massExportFilename, parseBoardIds, uniqueFileNames, uniqueSheetNames,
} from '/models/lib/exportAllBoards';
import { BOARD_EXPORT_FIELD_KEYS, parseExportFields } from '/models/lib/exportFields';
import { attachmentDisposition } from '/models/lib/exportFilename';

// "Export all boards" (All Boards sidebar, or Multi-Selection > Export):
//
//   GET /api/export-all-boards/:format?authToken=…[&boardIds=a,b][&fields=…]
//
// Every board the user is an active member of - not archived, not a template -
// that they may export, in one format, in one download: Excel as ONE workbook
// with a sheet per board named after it, every other format as a .zip with one
// file per board. Each board passes the same checks as its own export (the
// export switch, board visibility, assigned-only members, admin-only custom
// fields); a board that does not is left out and named in skipped.txt.
const { sendJsonResult, safeRoute } = require('/server/apiMiddleware');
const { Authentication } = require('/server/authentication');

async function requestUser(req) {
  const token = req.query && req.query.authToken;
  if (token) {
    if (String(token).length > 10000) return null;
    return require('/server/lib/activeUser').activeUserByToken(token, 'export', req);
  }
  Authentication.checkLoggedIn(req.userId);
  return ReactiveCache.getUser({ _id: req.userId });
}

// The boards to export, sorted by title, and those that cannot be exported.
async function exportableBoards(user, wanted) {
  const selector = {
    archived: false,
    type: 'board',
    members: { $elemMatch: { userId: user._id, isActive: true } },
    ...(wanted ? { _id: { $in: wanted } } : {}),
  };
  const boards = (await ReactiveCache.getBoards(selector, { sort: { title: 1 } })).slice(0, 1000);
  const { canExportBoardData } = require('/models/lib/exportAccess');
  const { assertFieldExport } = require('/server/lib/adminOnlyCustomFields');
  const ok = [];
  const skipped = [];
  for (const board of boards) {
    try {
      if (!canExportBoardData(board, user)) throw new Error('not exportable by this user');
      await assertFieldExport(board._id, user._id);
      ok.push(board);
    } catch (error) {
      skipped.push(`${board.title} (${board._id}): ${(error && (error.reason || error.message)) || error}`);
    }
  }
  return { boards: ok, skipped };
}

// One board's file, as its own export writes it.
async function boardFile(board, format, user, req) {
  const language = (user.profile && user.profile.language) || 'en';
  const redact = async data => {
    const { containsFields } = require('/models/lib/adminOnlyCustomFields');
    return containsFields(data) ? require('/server/lib/adminOnlyCustomFields').redactFields(data, user._id, board._id) : data;
  };
  if (format === 'wekan' || format === 'csv' || format === 'scsv' || format === 'tsv') {
    const { Exporter } = require('/models/exporter');
    const exporter = new Exporter(board._id, undefined, {
      excludeAttachments: req.query.attachments === 'false',
      userLanguage: language,
      fields: parseExportFields(req.query && req.query.fields, BOARD_EXPORT_FIELD_KEYS),
    });
    exporter._customFieldViewerId = user._id;
    if (format === 'wekan') return JSON.stringify(await redact(await exporter.build()));
    return exporter.buildCsv({ csv: ',', scsv: ';', tsv: '\t' }[format], language);
  }
  const rendered = await require('/server/lib/renderExternalExport').renderExternalExport(board._id, format,
    parseExportFields(req.query && req.query.fields, BOARD_EXPORT_FIELD_KEYS));
  return rendered.json !== undefined ? JSON.stringify(await redact(rendered.json)) : rendered.body;
}

WebApp.handlers.get('/api/export-all-boards/:format', safeRoute(async function (req, res) {
  const format = req.params.format;
  if (!MASS_EXPORT_FORMATS.includes(format)) {
    sendJsonResult(res, { code: 404, data: { error: 'Unknown export format' } });
    return;
  }
  let user;
  try {
    user = await requestUser(req);
  } catch (error) {
    sendJsonResult(res, { code: error.statusCode || 401, data: { error: 'Unauthorized' } });
    return;
  }
  if (!user) {
    sendJsonResult(res, { code: 401, data: { error: 'Invalid token' } });
    return;
  }
  try {
    await require('/models/lib/importExportSecurity').assertExportEnabled();
  } catch (error) {
    sendJsonResult(res, { code: 403, data: { error: error.reason || 'Export is disabled' } });
    return;
  }
  const { boards, skipped } = await exportableBoards(user, parseBoardIds(req.query && req.query.boardIds));
  if (!boards.length) {
    sendJsonResult(res, { code: 404, data: { error: 'No board to export', skipped } });
    return;
  }

  // Excel: one workbook, a sheet per board, named after the board.
  if (format === 'excel') {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', attachmentDisposition(massExportFilename(format)));
    const { createWorkbookWriter } = require('/models/server/createWorkbook');
    const { ExporterExcel } = require('/models/server/ExporterExcel');
    const workbook = createWorkbookWriter(res);
    const names = uniqueSheetNames(boards.map(board => board.title));
    const language = (user.profile && user.profile.language) || 'en';
    for (let i = 0; i < boards.length; i += 1) {
      const exporter = new ExporterExcel(boards[i]._id, language);
      exporter._customFieldViewerId = user._id;
      await exporter.build(res, { workbook, sheetName: names[i], activities: false });
    }
    await workbook.commit();
    return;
  }

  // Every other format: a .zip, written as each board is made.
  const { Zip, ZipDeflate, strToU8 } = require('fflate');
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', attachmentDisposition(massExportFilename(format)));
  const done = new Promise((resolve, reject) => {
    const zip = new Zip((error, chunk, final) => {
      if (error) { reject(error); return; }
      res.write(Buffer.from(chunk));
      if (final) { res.end(); resolve(); }
    });
    const add = (name, content) => {
      const entry = new ZipDeflate(name, { level: 6 });
      zip.add(entry);
      entry.push(typeof content === 'string' ? strToU8(content) : new Uint8Array(content), true);
    };
    (async () => {
      const names = uniqueFileNames(boards.map(board => board.title), extensionOf(format));
      for (let i = 0; i < boards.length; i += 1) {
        try {
          add(names[i], await boardFile(boards[i], format, user, req));
        } catch (error) {
          skipped.push(`${boards[i].title} (${boards[i]._id}): ${(error && (error.reason || error.message)) || error}`);
        }
      }
      if (skipped.length) add('skipped.txt', `${skipped.join('\n')}\n`);
      zip.end();
    })().catch(reject);
  });
  try {
    await done;
  } catch (error) {
    if (!res.headersSent) sendJsonResult(res, { code: 500, data: { error: 'Export failed' } });
    else res.end();
    if (Meteor.isDevelopment) console.error('export-all-boards failed:', error);
  }
}));
