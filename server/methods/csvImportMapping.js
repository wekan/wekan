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

// The upload of a CSV/TSV file, its sender's: never removed here, the import
// that follows reads it.
async function uploadedRows(userId, uploadId) {
  const { takeUpload } = require('/server/lib/importUpload');
  const upload = takeUpload(uploadId, userId, 'csv');
  if (!upload) throw new Meteor.Error('import-upload-not-found');
  try {
    return await require('/server/lib/csvUpload').readCsvUploadRows(upload.file);
  } catch (error) {
    throw new Meteor.Error(error.code || 'invalid-import-format', error.message);
  }
}
const uploadIdPattern = Match.Where(id => typeof id === 'string' && /^[0-9a-f]{32}$/.test(id));

Meteor.methods({
  // The mapping step of an uploaded CSV/TSV file: its header, a few rows and
  // the guessed mapping, read from the file on the server.
  async csvUploadPreview(uploadId) {
    check(uploadId, uploadIdPattern);
    if (!this.userId) throw new Meteor.Error('error-notAuthorized');
    await assertImportEnabled();
    const rows = await uploadedRows(this.userId, uploadId);
    if (!rows.length) throw new Meteor.Error('error-csv-schema');
    return {
      header: rows[0],
      samples: rows.slice(1, 1 + SAMPLE_ROWS),
      boards: [],
      skipped: [],
      mapping: guessCsvMapping(rows[0].map(cell => (cell == null ? '' : String(cell))), await importHeaderNames()),
    };
  },
  // The usernames in the people columns chosen, for the map-members step.
  async csvUploadPeople(uploadId, columns) {
    check(uploadId, uploadIdPattern);
    check(columns, Match.ObjectIncluding({}));
    if (!this.userId) throw new Meteor.Error('error-notAuthorized');
    await assertImportEnabled();
    const { csvPeopleNames } = require('/models/lib/csvPeople');
    const clean = Object.fromEntries(Object.entries(columns).filter(([, v]) => Number.isInteger(v) && v >= 0));
    return csvPeopleNames(await uploadedRows(this.userId, uploadId), clean).slice(0, 10000);
  },
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
