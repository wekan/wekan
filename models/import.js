import { validateImportSourceShape } from './lib/importSourceShape';
import { requireBoardMutation } from '/models/lib/boardMutationGuard';
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

// On Sandstorm an import replaces the board it was started from: the creators
// archive `currentBoard`. That id comes from the client, and nothing checked
// it, so anyone could archive any board by naming it. Only a board admin may
// have their board replaced; for anyone else the import still runs and simply
// leaves that board alone. No Problems record: a member who is not an admin
// reaches this by importing from a board page, which is ordinary use.
async function replaceableBoardId(userId, boardId) {
  if (!boardId || !userId) return undefined;
  const board = await ReactiveCache.getBoard(boardId);
  return board && board.hasAdmin(userId) ? boardId : undefined;
}

Meteor.methods({
  async importBoard(board, data, importSource, currentBoard) {
    // All check() calls must run BEFORE the first `await`: Meteor's
    // audit-argument-checks tracks checked arguments on the current async context,
    // and an early throw before checking them replaces the intended error with
    // "Did not check() all arguments". These checks validate types only; no parser,
    // feature lookup, creator or write is reached before authentication.
    // String is accepted alongside Object/Array for markdown-kanban text
    // imports (models/lib/externalParsers.js parseMarkdownKanban); the
    // 'markdown', 'todotxt', 'taskwarrior', 'focalboard' and 'leo' cases below are the only
    // ones that let a string through their own per-source check().
    check(board, Match.OneOf(Object, Array, String));
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
    try { validateImportSourceShape(importSource, board); }
    catch (error) { throw new Meteor.Error('invalid-import-format', error.message); }
    let creator;
    // A .leo outline is XML: sanitizing the raw text would strip its tags as
    // markup. It is parsed first and the parsed tasks are sanitized instead.
    let importedBoard = importSource === 'leo' ? board : sanitizeImported(board, importSource, this);
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
        // Resolve Kanboard's ids and nested subtasks/comments into the shared
        // task shape; the creator used to read only the handful of fields
        // that shape and Kanboard's API happen to spell the same way.
        importedBoard = EXTERNAL_PARSERS.kanboard(importedBoard);
        creator = new KanboardCreator(data, 'kanboard');
        break;
      case 'excel':
        // board = { excelBase64 }; parse it into rows and reuse the CSV creator.
        check(board, Object);
        importedBoard = sanitizeImported(
          await parseXlsxToRows(importedBoard.excelBase64), 'excel-cells', this,
        );
        creator = new CsvCreator(data);
        break;
      case 'markdown':
        // A markdown-kanban task list is plain text, not JSON - see
        // parseMarkdownKanban in models/lib/externalParsers.js.
        check(board, String);
        importedBoard = EXTERNAL_PARSERS.markdown(importedBoard);
        creator = new KanboardCreator(data, 'markdown');
        break;
      case 'todotxt':
        // todo.txt, one task per line - see models/lib/todoTxtFormat.js.
        check(board, String);
        try {
          importedBoard = EXTERNAL_PARSERS.todotxt(importedBoard);
        } catch (error) {
          throw new Meteor.Error('invalid-import-format', error.message);
        }
        creator = new KanboardCreator(data, 'todotxt');
        break;
      case 'taskwarrior':
        // Taskwarrior's `task export` JSON - see models/lib/taskwarriorFormat.js.
        // Sent as text: older versions write one object per line, not an array.
        check(board, String);
        try {
          importedBoard = EXTERNAL_PARSERS.taskwarrior(importedBoard);
        } catch (error) {
          throw new Meteor.Error('invalid-import-format', error.message);
        }
        creator = new KanboardCreator(data, 'taskwarrior');
        break;
      case 'focalboard':
        // A Focalboard board.jsonl - see models/lib/focalboardFormat.js. Sent
        // as text: one JSON object per line.
        check(board, String);
        try {
          importedBoard = EXTERNAL_PARSERS.focalboard(importedBoard);
        } catch (error) {
          throw new Meteor.Error('invalid-import-format', error.message);
        }
        creator = new KanboardCreator(data, 'focalboard');
        break;
      case 'leo':
        // The Leo literate editor's outline - see models/lib/leoOutline.js.
        check(board, String);
        if (!Meteor.isServer) return undefined;
        try {
          importedBoard = require('/server/lib/leoImport').parseLeo(board);
        } catch (error) {
          throw new Meteor.Error('invalid-import-format', error.message);
        }
        importedBoard = sanitizeImported(importedBoard, 'leo', this);
        creator = new KanboardCreator(data, 'leo');
        break;
      default:
        // NextCloud Deck / OpenProject / GitHub / GitLab / Gitea / Forgejo:
        // normalize the platform's JSON to the common Kanboard shape and reuse
        // the Kanboard creator. Parse the SANITIZED copy: `board` is the raw
        // upload, and parsing it would store the markup and prototype keys the
        // boundary above removed - while Problems reports them as sanitized.
        if (EXTERNAL_PARSERS[importSource]) {
          check(board, Match.OneOf(Object, Array));
          importedBoard = EXTERNAL_PARSERS[importSource](importedBoard);
          creator = new KanboardCreator(data, importSource);
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
        creator.create(importedBoard, await replaceableBoardId(this.userId, currentBoard)),
        importDeadlineMs(),
        () => new Meteor.Error('import-timeout', 'Import took too long and was aborted'),
      );
    }
    return await creator.create(importedBoard, await replaceableBoardId(this.userId, currentBoard));
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
    requireBoardMutation(userId, board, 'importScoped', Meteor);
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
    //data.title = `${data.title  } - ${  TAPi18n.__('copyCardPopup-title')}`;
    data.title = `${data.title}`;
    return await creator.create(data, await replaceableBoardId(this.userId, currentBoardId));
  },
});
