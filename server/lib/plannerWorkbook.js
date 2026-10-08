// Opens and writes Microsoft Planner's Excel workbook; what its rows mean is
// models/lib/plannerFormat.js. Server only: ExcelJS is a server dependency.
const ExcelJS = require('@wekanteam/exceljs');

// The rows of the "Tasks" sheet (the first sheet when there is no "Tasks"), as
// arrays of raw cell values, at their sheet positions: rows[0] is row 1 and an
// empty row is [], so a reported row number is the one Excel shows. Unlike
// the generic Excel import, a date cell stays a Date, so its day is not lost
// to String(date)'s local time.
async function readPlannerWorkbook(excelBase64) {
  if (typeof excelBase64 !== 'string' || !excelBase64) throw new Error('Planner workbook is empty');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(excelBase64, 'base64'));
  const sheet = workbook.getWorksheet('Tasks') || workbook.worksheets[0];
  const rows = [];
  if (sheet) {
    sheet.eachRow((row, number) => {
      while (rows.length < number - 1) rows.push([]);
      rows.push(row.values.slice(1));
    });
  }
  return rows;
}

// A .xlsx Buffer from formatPlannerRows()'s { sheet, rows }.
async function writePlannerWorkbook({ sheet, rows }) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheet || 'Tasks');
  (rows || []).forEach(cells => worksheet.addRow(cells));
  const header = (rows || []).findIndex(cells => Array.isArray(cells) && cells.includes('Task Name'));
  if (header !== -1) worksheet.getRow(header + 1).font = { bold: true };
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

module.exports = { readPlannerWorkbook, writePlannerWorkbook };
