import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { formatDateByUserPreference } from '/imports/lib/dateUtils';
import { line, bar, buildPdfBuffer } from '/models/lib/pdfDocument';
import { buildUnicodePdf } from '/models/server/buildUnicodePdf';
import { attachmentDisposition, exportFilename } from '/models/lib/exportFilename';
import { loadBoardChartData } from '/server/lib/boardChartData';
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
  constructor(boardId, chartKey, userLanguage, timezone, dateFormat) {
    this._boardId = boardId;
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

    const lines = [line(`${board.title} - ${title}`, true), ''];
    if (headers.length) lines.push(bar(headers.join('  |  ')));
    rows.forEach(row => lines.push(line(row.map(cell =>
      cell instanceof Date ? this.date(cell) : String(cell ?? '')).join('  |  '))));
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
