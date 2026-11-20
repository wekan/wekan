// A one-sheet workbook written to `stream` a page at a time, from an async
// iterable of { sheets: [{ name, rows }] } pages (the formats that write their
// header on the first page: monday.com, Businessmap). ExcelJS's streaming
// writer commits each row as it comes, so only one page of rows is in memory;
// the header row is bold, as the whole writers make it.
async function streamSheetWorkbook(stream, pages) {
  const ExcelJS = require('@wekanteam/exceljs');
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream, useStyles: true });
  let worksheet = null;
  for await (const { sheets } of pages) {
    const sheet = (sheets || [])[0] || { rows: [] };
    let first = false;
    if (!worksheet) {
      worksheet = workbook.addWorksheet(String(sheet.name || 'sheet1').replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'sheet1');
      first = true;
    }
    (sheet.rows || []).forEach((cells, index) => {
      const row = worksheet.addRow(cells);
      if (first && index === 0) row.font = { bold: true };
      row.commit();
    });
  }
  if (!worksheet) workbook.addWorksheet('sheet1');
  else await worksheet.commit();
  await workbook.commit();
}

module.exports = { streamSheetWorkbook };
