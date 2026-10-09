// Opens the workbook of an Excel import and finds the boards in it; which row
// is the header and which sheet is a board is decided in
// models/lib/csvImportMapping.js. Server only: ExcelJS is a server dependency.
import { worksheetRows, excelSheetsToBoards } from '/models/lib/csvImportMapping';
import { importHeaderNames } from './importHeaderNames';

const ExcelJS = require('@wekanteam/exceljs');

// { boards: [{ title, sheet, rows }], skipped: [sheet names] } - rows[0] of a
// board is its header, every cell text (dates as ISO 8601).
export async function readExcelBoards(excelBase64) {
  if (typeof excelBase64 !== 'string' || !excelBase64) throw new Error('The workbook is empty');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(excelBase64, 'base64'));
  const sheets = workbook.worksheets.map(worksheet => ({ name: worksheet.name, rows: worksheetRows(worksheet) }));
  const result = excelSheetsToBoards(sheets, await importHeaderNames());
  if (!result.boards.length) throw new Error('The workbook has no rows');
  return result;
}
