// The column mapping step of the CSV/TSV and Excel imports
// (client/components/import/csvMapping.js) asks the server two things before
// anything is imported: which field each column of a header is, by every
// language's names for WeKan's export columns, and - for a workbook, which
// only the server opens - which sheets are boards and what their header says.
// Neither writes anything; both answer only a signed-in user, and only while
// import is enabled, like the import they lead to.
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { assertImportEnabled } from '/models/lib/importExportSecurity';
import { guessCsvMapping } from '/models/lib/csvImportMapping';
import { importHeaderNames } from '/server/lib/importHeaderNames';
import { readExcelBoards } from '/server/lib/excelBoardWorkbook';

const MAX_HEADER_CELLS = 10000;
const SAMPLE_ROWS = 3;

const headerCell = Match.Where(value => value == null || typeof value === 'string'
  || typeof value === 'number' || typeof value === 'boolean');

Meteor.methods({
  async csvImportGuessMapping(header) {
    check(header, [headerCell]);
    if (!this.userId) throw new Meteor.Error('error-notAuthorized');
    if (header.length > MAX_HEADER_CELLS) throw new Meteor.Error('invalid-import-format', 'Too many columns');
    await assertImportEnabled();
    return guessCsvMapping(header.map(cell => (cell == null ? '' : String(cell))), await importHeaderNames());
  },

  async excelImportPreview(excelBase64) {
    check(excelBase64, String);
    if (!this.userId) throw new Meteor.Error('error-notAuthorized');
    await assertImportEnabled();
    let result;
    try {
      result = await readExcelBoards(excelBase64);
    } catch (error) {
      throw new Meteor.Error('invalid-import-format', error.message);
    }
    const first = result.boards[0];
    return {
      header: first.rows[0],
      samples: first.rows.slice(1, 1 + SAMPLE_ROWS),
      boards: result.boards.map(board => ({ title: board.title, sheet: board.sheet, cards: board.rows.length - 1 })),
      skipped: result.skipped,
      mapping: guessCsvMapping(first.rows[0], await importHeaderNames()),
    };
  },
});
