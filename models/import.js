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
    // and awaiting first makes later check()s (e.g. `board` in the switch below) not
    // count — throwing "Did not check() all arguments". So check `board` up front
    // here (the per-source switch still does its more specific check).
    check(board, Match.OneOf(Object, Array));
    check(data, Object);
    check(importSource, String);
    check(currentBoard, Match.Maybe(String));
    // Admin Panel / Features / Security: master switch to disable all import.
    await assertImportEnabled();
    let creator;
    let importedBoard = board;
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
        importedBoard = await parseXlsxToRows(board.excelBase64);
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

    // 3. create all elements
    return await creator.create(importedBoard, currentBoard);
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
