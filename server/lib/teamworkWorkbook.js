// Opens and writes Teamwork.com's Excel task import template; what its rows
// mean is models/lib/teamworkFormat.js. Server only: ExcelJS is a server
// dependency.

// The first sheet as { name, rows }: rows at their sheet positions (rows[0] is
// row 1, an empty row is []), so a reported row number is the one Excel
// shows, and a date cell stays a Date, so its day is not lost to
// String(date)'s local time. Teamwork also accepts the older .xls; ExcelJS
// reads only .xlsx, so an .xls file is refused with what to do instead.
async function readTeamworkWorkbook(excelBase64) {
  if (typeof excelBase64 !== 'string' || !excelBase64) throw new Error('Teamwork.com workbook is empty');
  const buffer = Buffer.from(excelBase64, 'base64');
  if (buffer.length >= 4 && buffer.readUInt32BE(0) === 0xd0cf11e0) {
    throw new Error('Teamwork.com workbook is an .xls file; save it as .xlsx and import that');
  }
  const ExcelJS = require('@wekanteam/exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  const rows = [];
  if (sheet) {
    sheet.eachRow((row, number) => {
      while (rows.length < number - 1) rows.push([]);
      rows.push(row.values.slice(1));
    });
  }
  return { name: sheet ? sheet.name : '', rows };
}

// A .xlsx Buffer from formatTeamworkSheet()'s { name, rows }.
async function writeTeamworkWorkbook({ name, rows }) {
  const ExcelJS = require('@wekanteam/exceljs');
  const workbook = new ExcelJS.Workbook();
  const title = String(name || 'Tasks').replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 31) || 'Tasks';
  const worksheet = workbook.addWorksheet(title);
  (rows || []).forEach(cells => worksheet.addRow(cells));
  if ((rows || []).length) {
    worksheet.getRow(1).font = { bold: true };
    // Start date and Due date, as dates Excel shows in the reader's format.
    const header = rows[0] || [];
    for (const columnName of ['Start date', 'Due date']) {
      const index = header.indexOf(columnName);
      if (index !== -1) worksheet.getColumn(index + 1).numFmt = 'yyyy-mm-dd';
    }
  }
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

// The same workbook written to `stream` a page at a time, from an async
// iterable of formatTeamworkSheet()'s pages ({ name, rows }, the header on
// the first): ExcelJS's streaming writer commits each row as it comes, so
// only one page of rows is in memory.
async function streamTeamworkWorkbook(stream, pages) {
  const ExcelJS = require('@wekanteam/exceljs');
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream, useStyles: true });
  let worksheet = null;
  for await (const { name, rows } of pages) {
    for (const cells of rows || []) {
      if (!worksheet) {
        const title = String(name || 'Tasks').replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 31) || 'Tasks';
        worksheet = workbook.addWorksheet(title);
        for (const columnName of ['Start date', 'Due date']) {
          const index = cells.indexOf(columnName);
          if (index !== -1) worksheet.getColumn(index + 1).numFmt = 'yyyy-mm-dd';
        }
        const header = worksheet.addRow(cells);
        header.font = { bold: true };
        header.commit();
        continue;
      }
      worksheet.addRow(cells).commit();
    }
  }
  if (!worksheet) workbook.addWorksheet('Tasks');
  else await worksheet.commit();
  await workbook.commit();
}

module.exports = { readTeamworkWorkbook, writeTeamworkWorkbook, streamTeamworkWorkbook };
