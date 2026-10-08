// Opens and writes Businessmap (Kanbanize) Excel workbooks; what their rows
// mean is models/lib/businessmapFormat.js. Server only: ExcelJS is a server
// dependency.
const ExcelJS = require('@wekanteam/exceljs');

// Every sheet, in order, as { name, rows }: the card sheet, then any "Links"
// or "Subtasks" tab an export added. Rows keep their sheet positions
// (rows[0] is row 1, an empty row is []), and a date cell stays a Date, so
// its day is not lost to String(date)'s local time.
async function readBusinessmapWorkbook(excelBase64) {
  if (typeof excelBase64 !== 'string' || !excelBase64) throw new Error('Businessmap workbook is empty');
  const buffer = Buffer.from(excelBase64, 'base64');
  // Businessmap also reads the old binary .xls; ExcelJS reads .xlsx only.
  if (buffer.length >= 4 && buffer.readUInt32BE(0) === 0xd0cf11e0) {
    throw new Error('Businessmap workbook is an .xls file; open it in a spreadsheet program and save it as .xlsx');
  }
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook.worksheets.map(sheet => {
    const rows = [];
    sheet.eachRow((row, number) => {
      while (rows.length < number - 1) rows.push([]);
      rows.push(Array.from(row.values.slice(1), cell => (cell === undefined ? null : cell)));
    });
    return { name: sheet.name, rows };
  });
}

// A .xlsx Buffer from formatBusinessmapSheets()'s { sheets }.
async function writeBusinessmapWorkbook({ sheets }) {
  const workbook = new ExcelJS.Workbook();
  (sheets || []).forEach((sheet, index) => {
    const worksheet = workbook.addWorksheet(String(sheet.name || `sheet${index + 1}`).replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || `sheet${index + 1}`);
    (sheet.rows || []).forEach(cells => worksheet.addRow(cells));
    if ((sheet.rows || []).length) worksheet.getRow(1).font = { bold: true };
  });
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

module.exports = { readBusinessmapWorkbook, writeBusinessmapWorkbook };
