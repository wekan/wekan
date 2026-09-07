import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import { TrelloCreator } from './trelloCreator';
import { WekanCreator } from './wekanCreator';
import { CsvCreator } from './csvCreator';
import { JiraCreator } from './jiraCreator';
import { KanboardCreator } from './kanboardCreator';
import { EXTERNAL_PARSERS } from './lib/externalParsers';
import { Exporter } from './exporter';
import { getMembersToMap } from './wekanmapper';
import { assertImportEnabled } from './lib/importExportSecurity';
import { withDeadline } from './lib/withDeadline';

// Hard deadline for a single board import, so a stalled/hung import can never leave the
// client's spinner running forever — the method returns a timeout error instead.
// Tunable via WEKAN_IMPORT_TIMEOUT_MS (0/invalid disables the deadline).
function importDeadlineMs() {
  const ms = parseInt(process.env.WEKAN_IMPORT_TIMEOUT_MS, 10);
  return Number.isFinite(ms) ? ms : 120000;
}

function recordAnonymousImportAttempt(method, connection) {
  if (!Meteor.isServer) return;
  const { record } = require('/server/lib/securityLog');
  record({
    key: 'authn.import',
    action: 'blocked',
    source: 'ddp:' + method,
    ip: connection && connection.clientAddress,
    detail: 'Anonymous board import denied',
  });
}

function sanitizeImported(value, source, invocation) {
  if (!Meteor.isServer) return value;
  return require('/server/lib/secureTransfer').secureTransfer(value, {
    direction: 'import', source: `import:${source}`,
    userId: invocation && invocation.userId,
    ip: invocation && invocation.connection && invocation.connection.clientAddress,
  });
}

// Parse an uploaded .xlsx (base64) into the row-array shape the CsvCreator
// consumes (board[0] is the header row). Excel import reuses the CSV creator.
async function parseXlsxToRows(excelBase64) {
  // eslint-disable-next-line global-require
  const ExcelJS = require('@wekanteam/exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(excelBase64, 'base64'));
  const worksheet = workbook.worksheets[0];
  const rows = [];
  if (worksheet) {
    worksheet.eachRow(row => {
      // row.values is 1-indexed (index 0 is empty); normalize to strings.
      rows.push(row.values.slice(1).map(v => (v == null ? '' : String(v))));
    });
  }
  return rows;
}

Meteor.methods({
  async importBoard(board, data, importSource, currentBoard) {
    // All check() calls must run BEFORE the first `await`: Meteor's
    // audit-argument-checks tracks checked arguments on the current async context,
    // and an early throw before checking them replaces the intended error with
    // "Did not check() all arguments". These checks validate types only; no parser,
    // feature lookup, creator or write is reached before authentication.
    check(board, Match.OneOf(Object, Array));
    check(data, Object);
    check(importSource, String);
    check(currentBoard, Match.Maybe(String));
    // ImportBleed (GHSA-qp32-wqxw-wq3h): this method reaches direct collection
    // writes, so authentication is rejected immediately after Meteor's mandatory
    // argument audit and before feature checks, parsing or creator construction.
    if (!this.userId) {
      recordAnonymousImportAttempt('importBoard', this.connection);
      throw new Meteor.Error('error-notAuthorized');
    }
    // Admin Panel / Features / Security: master switch to disable all import.
    await assertImportEnabled();
    let creator;
    let importedBoard = sanitizeImported(board, importSource, this);
    switch (importSource) {
      case 'trello':
        check(board, Object);
        creator = new TrelloCreator(data);
        break;
      case 'wekan':
        check(board, Object);
        creator = new WekanCreator(data);
        break;
      case 'csv':
        check(board, Array);
        creator = new CsvCreator(data);
        break;
      case 'jira':
        check(board, Object);
        creator = new JiraCreator(data);
        break;
      case 'kanboard':
        check(board, Object);
        creator = new KanboardCreator(data);
        break;
      case 'excel':
        // board = { excelBase64 }; parse it into rows and reuse the CSV creator.
        check(board, Object);
        importedBoard = sanitizeImported(
          await parseXlsxToRows(importedBoard.excelBase64), 'excel-cells', this,
        );
        creator = new CsvCreator(data);
        break;
      default:
        // NextCloud Deck / OpenProject / GitHub / GitLab / Gitea / Forgejo:
        // normalize the platform's JSON to the common Kanboard shape and reuse
        // the Kanboard creator.
        if (EXTERNAL_PARSERS[importSource]) {
          check(board, Match.OneOf(Object, Array));
          importedBoard = EXTERNAL_PARSERS[importSource](board);
          creator = new KanboardCreator(data);
        }
        break;
    }
    if (!creator) {
      throw new Meteor.Error('invalid-import-source', `Unknown import source: ${importSource}`);
    }

    // 1. check all parameters are ok from a syntax point of view
    //creator.check(board);

    // 2. check parameters are ok from a business point of view (exist &
    // authorized) nothing to check, everyone can import boards in their account

    // 3. create all elements, bounded by a hard deadline on the server so a hung
    // import (e.g. a database operation that never returns) surfaces a timeout error
    // to the client instead of spinning forever. The client also runs its own watchdog.
    if (Meteor.isServer) {
      return await withDeadline(
        creator.create(importedBoard, currentBoard),
        importDeadlineMs(),
        () => new Meteor.Error('import-timeout', 'Import took too long and was aborted'),
      );
    }
    return await creator.create(importedBoard, currentBoard);
  },
});

Meteor.methods({
  // #1173: import INTO the board that is open, beside the thing whose menu was
  // used - a swimlane below that swimlane, a list after that list, a card below
  // that card. The document is the same one the export writes, and `fields` is
  // the same selection popup; on this side it means what to BRING IN.
  async importScoped(target, doc, fields) {
    check(target, Object);
    check(target.boardId, String);
    check(target.swimlaneId, Match.Maybe(String));
    check(target.listId, Match.Maybe(String));
    check(target.cardId, Match.Maybe(String));
    check(doc, Object);
    check(fields, Match.Maybe([String]));
    // Keep the scoped sibling explicit too. Board helpers are authorization
    // checks for an authenticated user; they are not an authentication guard.
    if (!this.userId) {
      recordAnonymousImportAttempt('importScoped', this.connection);
      throw new Meteor.Error('error-notAuthorized');
    }
    const userId = this.userId;
    await assertImportEnabled();

    const board = await ReactiveCache.getBoard(target.boardId);
    if (!board) throw new Meteor.Error('board-not-found', 'Board not found');
    // Importing WRITES to this board, so it is not the export's "can you see
    // it": it is "may you change it".
    if (!board.isVisibleBy(await ReactiveCache.getCurrentUser())
      || !board.isBoardMember()) {
      throw new Meteor.Error('forbidden', 'Not allowed to import into this board');
    }
    if (doc._format && doc._format !== 'wekan-board-1.0.0') {
      throw new Meteor.Error('invalid-format', `Unknown export format: ${doc._format}`);
    }

    if (!Meteor.isServer) return null;
    const { ScopedImporter } = require('./server/scopedImporter');
    const safeDoc = sanitizeImported(doc, 'wekan-scoped', this);
    const importer = new ScopedImporter(target, safeDoc, {
      userId,
      fields,
    });
    return withDeadline(
      importer.run(),
      importDeadlineMs(),
      () => new Meteor.Error('import-timeout', 'Import took too long and was aborted'),
    );
  },
});

Meteor.methods({
  async cloneBoard(sourceBoardId, currentBoardId) {
    check(sourceBoardId, String);
    check(currentBoardId, Match.Maybe(String));

    // Cloning reads a board (like export) and creates a new one (like import), so
    // it is gated by the disable-all-import master switch (and, via Exporter.build,
    // the disable-all-export switch).
    await assertImportEnabled();

    // Authorization: a caller may only clone (which reads the entire board)
    // a source board they are allowed to see. Without this check any
    // authenticated user could clone an arbitrary private board by ID.
    // We reuse the same guard the REST export route uses (canExport ->
    // board.isVisibleBy), since cloning exposes the same data as an export.
    if (!this.userId) {
      throw new Meteor.Error('error-notAuthorized');
    }
    const exporter = new Exporter(sourceBoardId);
    const user = await ReactiveCache.getUser(this.userId);
    if (!user || !(await exporter.canExport(user))) {
      throw new Meteor.Error('error-notAuthorized');
    }

    const data = await exporter.build();
    const additionalData = {};

    //get the members to map
    const membersMapping = getMembersToMap(data);

    //now mirror the mapping done in finishImport in client/components/import/import.js:
    if (membersMapping) {
      const mappingById = {};
      membersMapping.forEach(member => {
        if (member.wekanId) {
          mappingById[member.id] = member.wekanId;
        }
      });
      additionalData.membersMapping = mappingById;
    }

    const creator = new WekanCreator(additionalData);
    //data.title = `${data.title  } - ${  TAPi18n.__('copy-tag')}`;
    data.title = `${data.title}`;
    return await creator.create(data, currentBoardId);
  },
});
