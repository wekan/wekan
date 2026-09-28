import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { formatDateByUserPreference } from '/imports/lib/dateUtils';
import { line, tableRow, wrapTextBlock, buildPdfBuffer } from '/models/lib/pdfDocument';
import { buildUnicodePdf } from '/models/server/buildUnicodePdf';
import { attachmentDisposition, exportFilename } from '/models/lib/exportFilename';
import { loadBoardChartData } from '/server/lib/boardChartData';
import { loadScrumChartData } from '/server/lib/scrumChartData';
const { chartExportRows } = require('/models/lib/chartExportRows');

async function unicodeFonts() {
  return {
    main: await Assets.getBinaryAsync('fonts/unifont/unifont-17.0.05.otf'),
    upper: await Assets.getBinaryAsync('fonts/unifont/unifont_upper-17.0.05.otf'),
  };
}

// A board report chart, drawn as a table - same page setup and font as the
// board/card PDF exports (models/server/ExporterCardPDF.js's
// buildUnicodePdf/buildPdfBuffer), just a title bar plus a header row and data
// rows instead of a card's sections.
class ExporterChartPDF {
  constructor(boardId, chartKey, userLanguage, timezone, dateFormat, options = {}) {
    this._boardId = boardId;
    this.options = options;
    this._chartKey = chartKey;
    this.userLanguage = userLanguage || 'en';
    this.timezone = timezone || '';
    this.dateFormat = dateFormat || 'YYYY-MM-DD';
  }

  __(key, fallback) {
    try {
      const translated = TAPi18n.__(key, '', this.userLanguage);
      if (translated && translated !== key) return translated;
    } catch (error) { /* a missing bundle is not a reason to fail an export */ }
    return fallback;
  }

  date(value) {
    if (!value) return '-';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    const formatted = formatDateByUserPreference(date, this.dateFormat, true, this.timezone || 'UTC');
    return formatted || '-';
  }

  async canExport(user) {
    this._customFieldViewerId = user?._id;
    await require('/server/lib/adminOnlyCustomFields').assertFieldExport(this._boardId, this._customFieldViewerId);
    this.userId = user?._id || null;
    const board = await ReactiveCache.getBoard(this._boardId);
    const { canExportBoardData } = require('/models/lib/exportAccess');
    return canExportBoardData(board, user, this._chartKey);
  }

  async build(res) {
    await require('/server/lib/adminOnlyCustomFields').assertFieldExport(this._boardId, this._customFieldViewerId);
    const board = await ReactiveCache.getBoard(this._boardId);
    if (!board) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Board not found');
      return;
    }
    const data = ['scrumVelocity', 'scrumSprint', 'scrumDaily'].includes(this._chartKey)
      ? await loadScrumChartData(this.userId, this._boardId, this._chartKey, this.options)
      : await loadBoardChartData(this._boardId, this._chartKey, this.options);
    const { title, headers, rows, notices = [] } = chartExportRows(
      this._chartKey, data || {}, (key, fallback) => this.__(key, fallback));
    const details = require('/models/lib/flowAnalyticsRows').flowDetailRows(
      this._chartKey, data || {}, (key, fallback) => this.__(key, fallback));
    if (details.rows.length) rows.push([], details.headers, ...details.rows);

    // One tableRow per header/data row: fixed column widths, one line each,
    // so a long card title clips instead of pushing its dates off the line.
    const lines = [line(`${board.title} - ${title}`, true), ''];
    for (const notice of notices) lines.push(...wrapTextBlock(notice).map(text => line(text)), '');
    if (['scrumVelocity', 'scrumSprint', 'scrumDaily'].includes(this._chartKey)) {
      // A sprint has many metrics. Full-width wrapped labels retain context
      // that a narrow multi-column PDF table would clip away.
      for (const row of rows) {
        headers.forEach((header, index) => {
          const value = row[index] instanceof Date ? this.date(row[index]) : String(row[index] ?? '');
          lines.push(...wrapTextBlock(`${header}: ${value}`).map(text => line(text, index === 0)));
        });
        lines.push('');
      }
    } else {
      if (headers.length) lines.push(tableRow(headers, { header: true }));
      rows.forEach(row => lines.push(tableRow(row.map(cell =>
        cell instanceof Date ? this.date(cell) : String(cell ?? '')))));
    }
    if (!rows.length) lines.push(line(this.__('no-data', 'No data')));

    let pdf;
    try {
      pdf = await buildUnicodePdf(lines, await unicodeFonts());
    } catch (error) {
      console.error(`ExporterChartPDF: Unicode PDF failed, using base-font fallback: ${error.message}`);
      pdf = buildPdfBuffer(lines);
    }
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': attachmentDisposition(exportFilename(
        this._chartKey, key => this.__(key, key), board.title, 'pdf')),
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }
}

export { ExporterChartPDF };
