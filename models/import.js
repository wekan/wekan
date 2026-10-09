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
import { isCsvMappingShape, mappingForSheet } from './lib/csvImportMapping';

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
    // 'markdown', 'todotxt', 'taskwarrior', 'focalboard', 'todoist', 'orgmode', 'leo' and 'opml' cases below are the only
    // ones that let a string through their own per-source check().
    check(board, Match.OneOf(Object, Array, String));
    check(data, Object);
    check(importSource, String);
    check(currentBoard, Match.Maybe(String));
    // The CSV/TSV and Excel imports' column mapping (models/lib/csvImportMapping.js):
    // its shape here, its column numbers against the file's header in the creator.
    check(data.csvMapping, Match.Maybe(Match.Where(isCsvMappingShape)));
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
    // The boards of an Excel workbook: one per sheet that has a header.
    let excelBoards = null;
    // A .leo or OPML outline is XML: sanitizing the raw text would strip its
    // tags as markup. It is parsed first and the parsed tasks are sanitized
    // instead.
    // A Vikunja export is a zip, or the text of its data.json, whose HTML
    // descriptions sit inside JSON strings: sanitizing that text as markup
    // would break the JSON. It is parsed first as well.
    // So is a Notion export: a .zip whose pages are read on the server, or a
    // database CSV; the parsed board is sanitized. And a Plane export: a zip, a
    // workbook, or JSON or CSV text whose cells hold JSON.
    let importedBoard = importSource === 'leo' || importSource === 'opml' || importSource === 'vikunja' || importSource === 'notion' || importSource === 'plane' ? board
      : sanitizeImported(board, importSource, this);
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
        // board = { excelBase64 }; every sheet with a header is a board
        // (server/lib/excelBoardWorkbook.js), read through the CSV creator.
        check(board, Object);
        if (!Meteor.isServer) return undefined;
        try {
          excelBoards = (await require('/server/lib/excelBoardWorkbook').readExcelBoards(importedBoard.excelBase64)).boards;
        } catch (error) {
          throw new Meteor.Error('invalid-import-format', error.message);
        }
        excelBoards = excelBoards.map(part => ({ ...part, rows: sanitizeImported(part.rows, 'excel-cells', this) }));
        importedBoard = excelBoards[0].rows;
        creator = new CsvCreator(data, { title: excelBoards[0].title });
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
      case 'todoist':
        // A Todoist project template (CSV) - see models/lib/todoistCsvFormat.js.
        check(board, String);
        try {
          importedBoard = EXTERNAL_PARSERS.todoist(importedBoard);
        } catch (error) {
          throw new Meteor.Error('invalid-import-format', error.message);
        }
        creator = new KanboardCreator(data, 'todoist');
        break;
      case 'meistertask':
        // A MeisterTask project CSV - see models/lib/meistertaskCsvFormat.js.
        check(board, String);
        try {
          importedBoard = EXTERNAL_PARSERS.meistertask(importedBoard);
        } catch (error) {
          throw new Meteor.Error('invalid-import-format', error.message);
        }
        creator = new KanboardCreator(data, 'meistertask');
        break;
      case 'obsidian':
        // An Obsidian Kanban plugin board - see models/lib/obsidianKanbanFormat.js.
        check(board, String);
        try {
          importedBoard = EXTERNAL_PARSERS.obsidian(importedBoard);
        } catch (error) {
          throw new Meteor.Error('invalid-import-format', error.message);
        }
        creator = new KanboardCreator(data, 'obsidian');
        break;
      case 'linear':
        // Linear's CSV export - see models/lib/linearCsvFormat.js.
        check(board, String);
        try {
          importedBoard = EXTERNAL_PARSERS.linear(importedBoard);
        } catch (error) {
          throw new Meteor.Error('invalid-import-format', error.message);
        }
        creator = new KanboardCreator(data, 'linear');
        break;
      case 'ticktick':
        // A TickTick backup CSV - see models/lib/ticktickCsvFormat.js.
        check(board, String);
        try {
          importedBoard = EXTERNAL_PARSERS.ticktick(importedBoard);
        } catch (error) {
          throw new Meteor.Error('invalid-import-format', error.message);
        }
        creator = new KanboardCreator(data, 'ticktick');
        break;
      case 'clickup':
        // A ClickUp task CSV - see models/lib/clickupCsvFormat.js.
        check(board, String);
        try {
          importedBoard = EXTERNAL_PARSERS.clickup(importedBoard);
        } catch (error) {
          throw new Meteor.Error('invalid-import-format', error.message);
        }
        creator = new KanboardCreator(data, 'clickup');
        break;
      case 'nullboard':
        // A Nullboard .nbx board file (JSON text) - see models/lib/nullboardFormat.js.
        check(board, String);
        try {
          importedBoard = EXTERNAL_PARSERS.nullboard(importedBoard);
        } catch (error) {
          throw new Meteor.Error('invalid-import-format', error.message);
        }
        creator = new KanboardCreator(data, 'nullboard');
        break;
      case 'pivotal':
        // A Pivotal Tracker stories CSV - see models/lib/pivotalCsvFormat.js.
        check(board, String);
        try {
          importedBoard = EXTERNAL_PARSERS.pivotal(importedBoard);
        } catch (error) {
          throw new Meteor.Error('invalid-import-format', error.message);
        }
        creator = new KanboardCreator(data, 'pivotal');
        break;
      case 'redmine':
        // Redmine's issues CSV - see models/lib/redmineCsvFormat.js.
        check(board, String);
        try {
          importedBoard = EXTERNAL_PARSERS.redmine(importedBoard);
        } catch (error) {
          throw new Meteor.Error('invalid-import-format', error.message);
        }
        creator = new KanboardCreator(data, 'redmine');
        break;
      case 'tasksorg':
        // A Tasks.org backup (JSON) - see models/lib/tasksorgFormat.js.
        check(board, Object);
        try {
          importedBoard = EXTERNAL_PARSERS.tasksorg(importedBoard);
        } catch (error) {
          throw new Meteor.Error('invalid-import-format', error.message);
        }
        creator = new KanboardCreator(data, 'tasksorg');
        break;
      case 'monday':
        // monday.com's "Export board to Excel" workbook - see
        // models/lib/mondayFormat.js. Like Planner, { excelBase64 }; the
        // parsed tasks are sanitized again below.
        check(board, Object);
        if (!Meteor.isServer) return undefined;
        try {
          importedBoard = await require('/server/lib/mondayWorkbook').readMondayWorkbook(importedBoard.excelBase64);
          importedBoard = EXTERNAL_PARSERS.monday(importedBoard);
        } catch (error) {
          throw new Meteor.Error('invalid-import-format', error.message);
        }
        importedBoard = sanitizeImported(importedBoard, 'monday', this);
        creator = new KanboardCreator(data, 'monday');
        break;
      case 'teamwork':
        // Teamwork.com's Excel task import template - see
        // models/lib/teamworkFormat.js. Like Planner, { excelBase64 }; the
        // parsed tasks are sanitized again below.
        check(board, Object);
        if (!Meteor.isServer) return undefined;
        try {
          importedBoard = await require('/server/lib/teamworkWorkbook').readTeamworkWorkbook(importedBoard.excelBase64);
          importedBoard = EXTERNAL_PARSERS.teamwork(importedBoard);
        } catch (error) {
          throw new Meteor.Error('invalid-import-format', error.message);
        }
        importedBoard = sanitizeImported(importedBoard, 'teamwork', this);
        creator = new KanboardCreator(data, 'teamwork');
        break;
      case 'superproductivity':
        // A Super Productivity backup (sp-backup_*.json), sent as text - see
        // models/lib/superProductivityFormat.js.
        check(board, String);
        try {
          importedBoard = EXTERNAL_PARSERS.superproductivity(importedBoard);
        } catch (error) {
          throw new Meteor.Error('invalid-import-format', error.message);
        }
        creator = new KanboardCreator(data, 'superproductivity');
        break;
      case 'taiga':
        // A Taiga project dump (one JSON object) - see models/lib/taigaFormat.js.
        // The browser sends it without the attachment bytes it embeds.
        check(board, Object);
        try {
          importedBoard = EXTERNAL_PARSERS.taiga(importedBoard);
        } catch (error) {
          throw new Meteor.Error('invalid-import-format', error.message);
        }
        creator = new KanboardCreator(data, 'taiga');
        break;
      case 'vikunja':
        // Vikunja's user data export - see models/lib/vikunjaFormat.js. The
        // import page sends the .zip as { zipBase64 }, or the text of its
        // data.json; server/lib/vikunjaArchive.js opens the zip under size
        // limits, and the parsed tasks are sanitized below.
        check(board, Match.OneOf(Object, String));
        if (!Meteor.isServer) return undefined;
        try {
          importedBoard = await require('/server/lib/vikunjaArchive').readVikunjaImport(importedBoard);
          importedBoard = EXTERNAL_PARSERS.vikunja(importedBoard);
        } catch (error) {
          throw new Meteor.Error('invalid-import-format', error.message);
        }
        importedBoard = sanitizeImported(importedBoard, 'vikunja', this);
        creator = new KanboardCreator(data, 'vikunja');
        break;
      case 'quire':
        // A Quire project CSV - see models/lib/quireCsvFormat.js.
        check(board, String);
        try {
          importedBoard = EXTERNAL_PARSERS.quire(importedBoard);
        } catch (error) {
          throw new Meteor.Error('invalid-import-format', error.message);
        }
        creator = new KanboardCreator(data, 'quire');
        break;
      case 'wrike':
        // Wrike's Excel import template - see models/lib/wrikeFormat.js. Like
        // Planner and monday.com, { excelBase64 }; the parsed tasks are
        // sanitized again below.
        check(board, Object);
        if (!Meteor.isServer) return undefined;
        try {
          importedBoard = await require('/server/lib/wrikeWorkbook').readWrikeWorkbook(importedBoard.excelBase64);
          importedBoard = EXTERNAL_PARSERS.wrike(importedBoard);
        } catch (error) {
          throw new Meteor.Error('invalid-import-format', error.message);
        }
        importedBoard = sanitizeImported(importedBoard, 'wrike', this);
        creator = new KanboardCreator(data, 'wrike');
        break;
      case 'businessmap':
        // A Businessmap (Kanbanize) Excel workbook - see
        // models/lib/businessmapFormat.js. Like monday.com, { excelBase64 };
        // the parsed tasks are sanitized again below.
        check(board, Object);
        if (!Meteor.isServer) return undefined;
        try {
          importedBoard = await require('/server/lib/businessmapWorkbook').readBusinessmapWorkbook(importedBoard.excelBase64);
          importedBoard = EXTERNAL_PARSERS.businessmap(importedBoard);
        } catch (error) {
          throw new Meteor.Error('invalid-import-format', error.message);
        }
        importedBoard = sanitizeImported(importedBoard, 'businessmap', this);
        creator = new KanboardCreator(data, 'businessmap');
        break;
      case 'notion':
        // Notion's Markdown & CSV export - see models/lib/notionFormat.js. The
        // import page sends the .zip as { zipBase64 }, or the text of one
        // database CSV; server/lib/notionArchive.js opens the zip under size
        // limits, and the parsed board is sanitized below.
        check(board, Match.OneOf(Object, String));
        if (!Meteor.isServer) return undefined;
        try {
          importedBoard = await require('/server/lib/notionArchive').readNotionImport(importedBoard);
          importedBoard = EXTERNAL_PARSERS.notion(importedBoard);
        } catch (error) {
          throw new Meteor.Error('invalid-import-format', error.message);
        }
        importedBoard = sanitizeImported(importedBoard, 'notion', this);
        creator = new KanboardCreator(data, 'notion');
        break;
      case 'plane':
        // Plane's issue export - see models/lib/planeFormat.js. The import
        // page sends the export .zip as { zipBase64 }, a workbook from it as
        // { xlsxBase64 }, or the text of its JSON or CSV file;
        // server/lib/planeArchive.js opens the zip and the workbook under size
        // limits, and the parsed tasks are sanitized below.
        check(board, Match.OneOf(Object, String));
        if (!Meteor.isServer) return undefined;
        try {
          importedBoard = await require('/server/lib/planeArchive').readPlaneImport(importedBoard);
          importedBoard = EXTERNAL_PARSERS.plane(importedBoard);
        } catch (error) {
          throw new Meteor.Error('invalid-import-format', error.message);
        }
        importedBoard = sanitizeImported(importedBoard, 'plane', this);
        creator = new KanboardCreator(data, 'plane');
        break;
      case 'planner':
        // Microsoft Planner's "Export plan to Excel" workbook - see
        // models/lib/plannerFormat.js. It arrives like the Excel import, as
        // { excelBase64 }; the cells are only text once the workbook is
        // opened, so the parsed tasks are sanitized again below.
        check(board, Object);
        if (!Meteor.isServer) return undefined;
        try {
          importedBoard = await require('/server/lib/plannerWorkbook').readPlannerWorkbook(importedBoard.excelBase64);
          importedBoard = EXTERNAL_PARSERS.planner(importedBoard);
        } catch (error) {
          throw new Meteor.Error('invalid-import-format', error.message);
        }
        importedBoard = sanitizeImported(importedBoard, 'planner', this);
        creator = new KanboardCreator(data, 'planner');
        break;
      case 'kanri':
        // Kanri's JSON export, one board or all data - see models/lib/kanriFormat.js.
        check(board, Object);
        try {
          importedBoard = EXTERNAL_PARSERS.kanri(importedBoard);
        } catch (error) {
          throw new Meteor.Error('invalid-import-format', error.message);
        }
        creator = new KanboardCreator(data, 'kanri');
        break;
      case 'orgmode':
        // An Org mode outline (Emacs, Orgzly, Beorg) - see models/lib/orgModeFormat.js.
        check(board, String);
        try {
          importedBoard = EXTERNAL_PARSERS.orgmode(importedBoard);
        } catch (error) {
          throw new Meteor.Error('invalid-import-format', error.message);
        }
        creator = new KanboardCreator(data, 'orgmode');
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
      case 'opml':
        // An OPML outline (Workflowy, Dynalist, OmniOutliner, Logseq) - see
        // models/lib/opmlOutline.js.
        check(board, String);
        if (!Meteor.isServer) return undefined;
        try {
          importedBoard = require('/server/lib/opmlImport').parseOpml(board);
        } catch (error) {
          throw new Meteor.Error('invalid-import-format', error.message);
        }
        importedBoard = sanitizeImported(importedBoard, 'opml', this);
        creator = new KanboardCreator(data, 'opml');
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
    // The import runs under a run record written before its first write
    // (server/importRuns.js), so one that stops halfway is listed in Admin
    // Panel -> Problems -> Recovery to keep or discard. When the deadline
    // answers the client, the writer is told to stop at its next stage.
    // The people of the file, for the import page's map-members step, read by
    // the same parser that imports it - nothing is created
    // (models/lib/importMembersMode.js importedPeople).
    if (data.previewPeople === true && creator instanceof KanboardCreator) {
      const { importedPeople } = require('./lib/importMembersMode');
      return importedPeople(Array.isArray(importedBoard) ? importedBoard : importedBoard.tasks);
    }
    // "One board per project" (the import page's checkbox, or splitBy in the
    // REST body): a document of the generalized importer becomes one board per
    // swimlane (models/lib/importSplit.js) - a tool's export that holds several
    // projects then imports as several boards, as a Trello .zip does. Each part
    // is its own tracked import run with its own deadline; the first board's
    // id is returned, and every one is on All Boards.
    // A workbook with several boards - "Export all boards" writes one sheet
    // per board - imports each sheet as its own board, the same way: its own
    // run and deadline, the first board's id returned. The mapping the page
    // confirmed applies to the sheets with the first sheet's header.
    if (Meteor.isServer && excelBoards && excelBoards.length > 1) {
      let firstBoardId = null;
      for (let i = 0; i < excelBoards.length; i += 1) {
        const part = excelBoards[i];
        const partData = { ...data, csvMapping: mappingForSheet(data.csvMapping, excelBoards, i) };
        const partCreator = new CsvCreator(partData, { title: part.title });
        const tracked = require('/server/importRuns').trackImport({ userId: this.userId, source: importSource,
          creator: partCreator, execute: () => partCreator.create(part.rows, null) });
        const boardId = await withDeadline(
          tracked.promise,
          importDeadlineMs(),
          () => { tracked.abort(); return new Meteor.Error('import-timeout', 'Import took too long and was aborted'); },
        );
        if (!firstBoardId) firstBoardId = boardId;
      }
      return firstBoardId;
    }
    if (Meteor.isServer && data.splitBy === 'swimlane' && creator instanceof KanboardCreator) {
      const { splitBySwimlane } = require('./lib/importSplit');
      let parts;
      try {
        parts = splitBySwimlane(importedBoard);
      } catch (error) {
        throw new Meteor.Error('invalid-import-format', error.message);
      }
      if (parts.length > 1) {
        let firstBoardId = null;
        for (const part of parts) {
          const partCreator = new KanboardCreator(data, importSource);
          const tracked = require('/server/importRuns').trackImport({ userId: this.userId, source: importSource,
            creator: partCreator, execute: () => partCreator.create(part, null) });
          const boardId = await withDeadline(
            tracked.promise,
            importDeadlineMs(),
            () => { tracked.abort(); return new Meteor.Error('import-timeout', 'Import took too long and was aborted'); },
          );
          if (!firstBoardId) firstBoardId = boardId;
        }
        return firstBoardId;
      }
    }
    if (Meteor.isServer) {
      const replaceId = await replaceableBoardId(this.userId, currentBoard);
      const tracked = require('/server/importRuns').trackImport({ userId: this.userId, source: importSource, creator,
        execute: () => creator.create(importedBoard, replaceId) });
      return await withDeadline(
        tracked.promise,
        importDeadlineMs(),
        () => { tracked.abort(); return new Meteor.Error('import-timeout', 'Import took too long and was aborted'); },
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
    // The board's export without its file data: the attachments' rows only.
    // Their files are streamed from the source board's own storage into the
    // copy as the importer reaches them, one at a time, instead of every file
    // of the board riding in the document as base64.
    const exporter = new Exporter(sourceBoardId, undefined, { excludeAttachments: true });
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
    if (Meteor.isServer) {
      // The source files, found once: the importer asks for a stream as it
      // reaches each attachment row.
      const Attachments = require('/models/attachments').default;
      const { fileStoreStrategyFactory } = require('/models/attachments.server');
      const sources = new Map((await Attachments.collection.find({ 'meta.boardId': sourceBoardId }).fetchAsync())
        .map(fileObj => [fileObj._id, fileObj]));
      creator.attachmentStream = attachment => {
        const fileObj = attachment && sources.get(attachment._id);
        if (!fileObj) return null;
        try {
          return fileStoreStrategyFactory.getFileStrategy(fileObj, 'original').getReadStream() || null;
        } catch (e) {
          return null;
        }
      };
    }
    //data.title = `${data.title  } - ${  TAPi18n.__('copyCardPopup-title')}`;
    data.title = `${data.title}`;
    const replaceId = await replaceableBoardId(this.userId, currentBoardId);
    if (Meteor.isServer) {
      // A copy writes a board the way an import does, and stops the same way.
      return await require('/server/importRuns').trackImport({ userId: this.userId, source: 'clone', creator,
        execute: () => creator.create(data, replaceId) }).promise;
    }
    return await creator.create(data, replaceId);
  },
});
