// Opens and writes Wrike's Excel import template; what its rows mean is
// models/lib/wrikeFormat.js. Server only: ExcelJS is a server dependency.
const ExcelJS = require('@wekanteam/exceljs');

const DATE_COLUMNS = ['start date', 'end date', 'start date constraint'];

// The rows of the "Tasks" sheet (the first sheet when there is no "Tasks"), as
// arrays of raw cell values at their sheet positions: rows[0] is row 1 and an
// empty row is [], so a reported row number is the one Excel shows. A date
// cell stays a Date, so its day is not lost to String(date)'s local time.
async function readWrikeWorkbook(excelBase64) {
  if (typeof excelBase64 !== 'string' || !excelBase64) throw new Error('Wrike workbook is empty');
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

// A .xlsx Buffer from formatWrikeRows()'s { sheet, rows }. The template's
// dates are real date cells, as in Wrike's sample, so the YYYY-MM-DD text the
// formatter writes in the date columns becomes a date at 00:00 UTC.
async function writeWrikeWorkbook({ sheet, rows }) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheet || 'Tasks');
  const header = Array.isArray(rows && rows[0]) ? rows[0] : [];
  const dateAt = header.map((title, index) => (DATE_COLUMNS.includes(String(title).trim().toLowerCase()) ? index : -1))
    .filter(index => index !== -1);
  (rows || []).forEach((cells, rowIndex) => {
    const values = (cells || []).map((value, index) => {
      const iso = rowIndex > 0 && dateAt.includes(index) && /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
      return iso ? new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3])) : value;
    });
    worksheet.addRow(values);
  });
  dateAt.forEach(index => { worksheet.getColumn(index + 1).numFmt = 'yyyy-mm-dd'; });
  if (header.length) worksheet.getRow(1).font = { bold: true };
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

module.exports = { readWrikeWorkbook, writeWrikeWorkbook };
