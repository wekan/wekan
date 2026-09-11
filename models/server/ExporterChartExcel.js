import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { createWorkbook } from './createWorkbook';
import { attachmentDisposition, exportFilename } from '/models/lib/exportFilename';
import { loadBoardChartData } from '/server/lib/boardChartData';
const { chartExportRows } = require('/models/lib/chartExportRows');

// A board report chart as an .xlsx sheet - same createWorkbook() the board/
// card Excel exports use (models/server/ExporterExcelBoard.js), a bold header
// row, one row of data per line.
class ExporterChartExcel {
  constructor(boardId, chartKey, userLanguage) {
    this._boardId = boardId;
    this._chartKey = chartKey;
    this.userLanguage = userLanguage || 'en';
  }

  __(key, fallback) {
    try {
      const translated = TAPi18n.__(key, '', this.userLanguage);
      if (translated && translated !== key) return translated;
    } catch (error) { /* a missing bundle is not a reason to fail an export */ }
    return fallback;
  }

  async canExport(user) {
    const board = await ReactiveCache.getBoard(this._boardId);
    return board && board.isVisibleBy(user);
  }

  async build(res) {
    const board = await ReactiveCache.getBoard(this._boardId);
    if (!board) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Board not found');
      return;
    }
    const data = await loadBoardChartData(this._boardId, this._chartKey);
    const { title, headers, rows } = chartExportRows(
      this._chartKey, data || {}, (key, fallback) => this.__(key, fallback));

    const workbook = createWorkbook();
    workbook.creator = board.title;
    workbook.created = new Date();
    workbook.modified = new Date();
    const sheetName = title.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Chart';
    const ws = workbook.addWorksheet(sheetName, {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
    });
    ws.columns = (headers.length ? headers : ['']).map(() => ({ width: 20 }));
    ws.mergeCells(1, 1, 1, Math.max(headers.length, 1));
    const titleCell = ws.getCell(1, 1);
    titleCell.value = `${board.title} - ${title}`;
    titleCell.font = { size: 16, bold: true };
    ws.getRow(1).height = 30;

    if (headers.length) {
      const headerRow = ws.getRow(2);
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' },
        };
      });
      headerRow.commit();
    }

    rows.forEach((row, rowIndex) => {
      const sheetRow = ws.getRow(3 + rowIndex);
      row.forEach((cell, cellIndex) => {
        const sheetCell = sheetRow.getCell(cellIndex + 1);
        if (cell instanceof Date) {
          // A real date cell, not an ISO text string: Excel/LibreOffice then
          // show it in the sheet's date format, sort it as a date and accept
          // it in date arithmetic. (Before this it was cell.toISOString(),
          // which rendered as "2026-09-23T09:00:00.000Z" text.)
          sheetCell.value = cell;
          sheetCell.numFmt = 'yyyy-mm-dd hh:mm';
        } else {
          sheetCell.value = cell;
        }
      });
      sheetRow.commit();
    });

    if (typeof ws.commit === 'function') ws.commit();

    res.writeHead(200, {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': attachmentDisposition(exportFilename(
        this._chartKey, key => this.__(key, key), board.title, 'xlsx')),
    });
    await workbook.xlsx.write(res);
    res.end();
  }
}

export { ExporterChartExcel };
