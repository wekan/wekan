// Opens and writes monday.com's Excel workbook; what its rows mean is
// models/lib/mondayFormat.js. Server only: ExcelJS is a server dependency.
const ExcelJS = require('@wekanteam/exceljs');

// Every sheet, in order, as { name, rows }: the board sheet first, then the
// "<board>-updates" sheet when the export has one. Rows keep their sheet
// positions (rows[0] is row 1, an empty row is []), and a date cell stays a
// Date, so its day is not lost to String(date)'s local time.
async function readMondayWorkbook(excelBase64) {
  if (typeof excelBase64 !== 'string' || !excelBase64) throw new Error('monday.com workbook is empty');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(excelBase64, 'base64'));
  return workbook.worksheets.map(sheet => {
    const rows = [];
    sheet.eachRow((row, number) => {
      while (rows.length < number - 1) rows.push([]);
      rows.push(row.values.slice(1));
    });
    return { name: sheet.name, rows };
  });
}

// A .xlsx Buffer from formatMondaySheets()'s { sheets }.
async function writeMondayWorkbook({ sheets }) {
  const workbook = new ExcelJS.Workbook();
  (sheets || []).forEach((sheet, index) => {
    const worksheet = workbook.addWorksheet(String(sheet.name || `sheet${index + 1}`).replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || `sheet${index + 1}`);
    (sheet.rows || []).forEach(cells => worksheet.addRow(cells));
    if ((sheet.rows || []).length) worksheet.getRow(1).font = { bold: true };
  });
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

module.exports = { readMondayWorkbook, writeMondayWorkbook };
