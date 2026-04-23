import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { createWorkbook } from './createWorkbook';
import { fileStoreStrategyFactory } from '/models/attachments.server';
import { formatDateByUserPreference } from '/imports/lib/dateUtils';

// ── Constants ────────────────────────────────────────────────────────────────

/** All selectable field section keys (order determines display order). */
const ALL_FIELDS = [
  'labels',
  'people',
  'board-info',
  'dates',
  'description',
  'checklists',
  'subtasks',
  'comments',
  'attachments',
];

/**
 * Map WeKan label color names to opaque ARGB hex strings for ExcelJS.
 * Colours not in this map fall back to a neutral silver.
 */
const LABEL_COLOR_ARGB = {
  white:         'FFFFFFFF',
  green:         'FF008000',
  yellow:        'FFFFFF00',
  orange:        'FFFFA500',
  red:           'FFFF0000',
  purple:        'FF800080',
  blue:          'FF0000FF',
  sky:           'FF87CEEB',
  lime:          'FF00FF00',
  pink:          'FFFFC0CB',
  black:         'FF000000',
  silver:        'FFC0C0C0',
  peachpuff:     'FFFFDAB9',
  crimson:       'FFDC143C',
  plum:          'FFDDA0DD',
  darkgreen:     'FF006400',
  slateblue:     'FF6A5ACD',
  magenta:       'FFFF00FF',
  gold:          'FFFFD700',
  navy:          'FF000080',
  gray:          'FF808080',
  saddlebrown:   'FF8B4513',
  paleturquoise: 'FFAFEEEE',
  mistyrose:     'FFFFE4E1',
  indigo:        'FF4B0082',
};

/** Convert a WeKan color name to ARGB, falling back to silver. */
function labelColorToArgb(colorName) {
  return LABEL_COLOR_ARGB[colorName] || 'FFC0C0C0';
}

/**
 * Return FFFFFFFF (white) or FF000000 (black) text colour based on the
 * relative luminance of the background ARGB string.
 */
function labelTextArgb(bgArgb) {
  const hex = bgArgb.slice(2); // strip leading AA byte
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const toLinear = c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const lum = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return lum > 0.179 ? 'FF000000' : 'FFFFFFFF';
}

/** MIME types that ExcelJS can embed as inline images. */
const EMBEDDABLE_IMAGE_MIME = new Map([
  ['image/jpeg', 'jpeg'],
  ['image/jpg',  'jpeg'],
  ['image/png',  'png'],
  ['image/gif',  'gif'],
  ['image/bmp',  'bmp'],
]);

/**
 * Checklist progress-bar colour per board theme, matching boardColors.css.
 * Values are opaque ARGB strings for ExcelJS (FF + 6-digit hex).
 */
const THEME_PROGRESS_COLOR = {
  nephritis:   'FF27AE60',
  pomegranate: 'FFC0392B',
  belize:      'FF2980B9',
  wisteria:    'FF8E44AD',
  midnight:    'FF2C3E50',
  pumpkin:     'FFE67E22',
  moderatepink:'FFCD5A91',
  strongcyan:  'FF00AECC',
  limegreen:   'FF4BBF6B',
  dark:        'FF2C3E51',
  relax:       'FF27AE61',
  corteza:     'FF568BA2',
  clearblue:   'FF499BEA',
  natural:     'FF596557',
  modern:      'FF2A80B8',
  moderndark:  'FF2A2A2A',
  exodark:     'FF222222',
  cleandark:   'FF23232B',
  cleanlight:  'FFC0C0C0',
};

/** Return the progress-bar ARGB colour for a given board colour/theme name. */
function progressColorArgb(boardColor) {
  return THEME_PROGRESS_COLOR[boardColor] || 'FF2980B9'; // default: belize blue
}

const IMG_WIDTH_PX       = 150;   // embedded image width in pixels
const IMG_HEIGHT_PX      = 115;   // embedded image height in pixels
const IMG_ROW_HEIGHT     = 95;    // row height (pt) for image rows
const IMAGES_PER_ROW     = 4;     // maximum images side-by-side
const IMG_COLS_PER_IMAGE = 1.5;   // fractional column units each image occupies (cols: 0, 1.5, 3.0, 4.5)

// ── Pure helper functions ────────────────────────────────────────────────────

function sanitizeSheetName(value) {
  return String(value || 'Card').replace(/[\\/*?:[\]]/g, '-').slice(0, 31);
}

function sanitizeFilename(value) {
  return (
    String(value || 'export-card')
      .replace(/[^a-z0-9._-]+/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'export-card'
  );
}

function normalizeText(value) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatFileSize(bytes) {
  if (!bytes || bytes < 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log2(bytes) / 10), units.length - 1);
  const val = bytes / Math.pow(1024, i);
  return `${i === 0 ? val : val.toFixed(1)} ${units[i]}`;
}

/** Read an entire readable stream into a Buffer. */
function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(Buffer.from(chunk)));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

// ── ExporterExcelCard ────────────────────────────────────────────────────────

class ExporterExcelCard {
  /**
   * @param {string}        boardId
   * @param {string}        listId
   * @param {string}        cardId
   * @param {string}        userLanguage  BCP-47 tag, e.g. 'en', 'fi'
   * @param {string[]|null} fields        Sections to include; null = all
   * @param {string}        dateFormat    User date format: 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY'
   */
  constructor(boardId, listId, cardId, userLanguage, fields, dateFormat) {
    this._boardId     = boardId;
    this._listId      = listId;
    this._cardId      = cardId;
    this.userLanguage = userLanguage || 'en';
    this._fields      = fields && fields.length > 0 ? new Set(fields) : new Set(ALL_FIELDS);
    this.dateFormat   = dateFormat || 'YYYY-MM-DD';
  }

  __(key) { return TAPi18n.__(key, '', this.userLanguage); }

  /** Format a date value using the user's preferred format, always including time. */
  fmtDate(d) { return d ? formatDateByUserPreference(d, this.dateFormat, true) : ''; }

  hasField(key) { return this._fields.has(key); }

  async canExport(user) {
    const board = await ReactiveCache.getBoard(this._boardId);
    return board && board.isVisibleBy(user);
  }

  // ── Build ────────────────────────────────────────────────────────────────

  async build(res) {
    try {
      await this._buildAndWrite(res);
    } catch (err) {
      console.error('ExporterExcelCard: build error', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`Export failed: ${err.message}`);
      }
    }
  }

  // ── Internal build ───────────────────────────────────────────────────────

  async _buildAndWrite(res) {
    const card = await ReactiveCache.getCard(this._cardId);
    if (!card) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Card not found');
      return;
    }

    const needsLabels      = this.hasField('labels');
    const needsPeople      = this.hasField('people');
    const needsBoardInfo   = this.hasField('board-info');
    const needsDates       = this.hasField('dates');
    const needsDescription = this.hasField('description');
    const needsChecklists  = this.hasField('checklists');
    const needsSubtasks    = this.hasField('subtasks');
    const needsComments    = this.hasField('comments');
    const needsAttachments = this.hasField('attachments');

    // ── Fetch data ───────────────────────────────────────────────────────
    const board    = (needsBoardInfo || needsLabels || needsChecklists) ? await ReactiveCache.getBoard(this._boardId) : null;
    const list     = needsBoardInfo ? await ReactiveCache.getList(card.listId)               : null;
    const swimlane = needsBoardInfo ? await ReactiveCache.getSwimlane(card.swimlaneId)        : null;

    const userMap = {};
    if (needsPeople || needsDates || needsComments || needsAttachments) {
      const userIds = new Set();
      if (card.userId) userIds.add(card.userId);
      if (needsPeople) {
        if (card.members)   card.members.forEach(id => userIds.add(id));
        if (card.assignees) card.assignees.forEach(id => userIds.add(id));
      }
      const uDocs = await ReactiveCache.getUsers(
        { _id: { $in: Array.from(userIds) } },
        { fields: { _id: 1, username: 1 } },
      );
      uDocs.forEach(u => { userMap[u._id] = u.username; });
    }

    const creatorName   = userMap[card.userId] || '';
    const ownerName     = (card.members && card.members.length > 0)
      ? (userMap[card.members[0]] || creatorName)
      : creatorName;
    const memberNames   = (card.members   || []).map(id => userMap[id] || id).join(', ');
    const assigneeNames = (card.assignees || []).map(id => userMap[id] || id).join(', ');

    const checklists    = needsChecklists  ? await ReactiveCache.getChecklists({ cardId: this._cardId })                                 : [];
    const checklistItems= needsChecklists  ? await ReactiveCache.getChecklistItems({ cardId: this._cardId })                             : [];
    const subtasks      = needsSubtasks    ? await ReactiveCache.getCards({ parentId: this._cardId })                                    : [];
    const comments      = needsComments    ? await ReactiveCache.getCardComments({ cardId: this._cardId }, { sort: { createdAt: 1 } })   : [];
    const attachments   = needsAttachments ? await ReactiveCache.getAttachments({ 'meta.cardId': this._cardId }, { sort: { uploadedAt: -1 } }) : [];

    // Batch-load any missing user IDs (comments + attachments uploaders)
    if (needsComments || needsAttachments) {
      const extraIds = new Set();
      if (needsComments)    comments.forEach(c => c.userId && extraIds.add(c.userId));
      if (needsAttachments) attachments.forEach(a => (a.userId || (a.meta && a.meta.userId)) && extraIds.add(a.userId || a.meta.userId));
      // Remove already-fetched
      Object.keys(userMap).forEach(id => extraIds.delete(id));
      if (extraIds.size > 0) {
        const extra = await ReactiveCache.getUsers(
          { _id: { $in: Array.from(extraIds) } },
          { fields: { _id: 1, username: 1 } },
        );
        extra.forEach(u => { userMap[u._id] = u.username; });
      }
    }

    // ── Workbook & worksheet setup ───────────────────────────────────────
    const workbook = createWorkbook();
    workbook.creator  = this.__('export-board');
    workbook.created  = new Date();
    workbook.modified = new Date();

    const sheetName = sanitizeSheetName(card.title || 'Card');
    const ws = workbook.addWorksheet(sheetName, {
      pageSetup: {
        paperSize:   9,          // A4
        orientation: 'portrait',
        fitToPage:   true,
        fitToWidth:  1,
        fitToHeight: 0,
        horizontalCentered: false,
        margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
      },
    });

    const fontName = this.__('excel-font');

    // 6-column layout: alternating label(18) / value(30) triplets
    ws.columns = [
      { key: 'a', width: 18 },
      { key: 'b', width: 30 },
      { key: 'c', width: 18 },
      { key: 'd', width: 30 },
      { key: 'e', width: 18 },
      { key: 'f', width: 30 },
    ];

    // ── Style constants ──────────────────────────────────────────────────
    const fillGray   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
    const fillLight  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } };
    const thickBdr   = { top: { style: 'medium' }, left: { style: 'medium' }, bottom: { style: 'medium' }, right: { style: 'medium' } };
    const thinBdr    = { top: { style: 'thin'   }, left: { style: 'thin'   }, bottom: { style: 'thin'   }, right: { style: 'thin'   } };

    let row = 1;
    const pageBreakRows = []; // collect rows where we want explicit page breaks

    // ── Style helpers (closures capturing ws / fontName / row) ───────────

    /**
     * Merge A–F on current row, set cell properties, advance row counter.
     */
    const mergeRow = (value, opts = {}) => {
      ws.mergeCells(`A${row}:F${row}`);
      const cell = ws.getCell(`A${row}`);
      cell.value     = value;
      cell.font      = Object.assign({ name: fontName, size: 10 }, opts.font      || {});
      cell.alignment = Object.assign(
        { vertical: 'middle', horizontal: 'left', wrapText: true },
        opts.alignment || {},
      );
      if (opts.fill)   cell.fill   = opts.fill;
      if (opts.border) cell.border = opts.border;
      ws.getRow(row).height = opts.height || 20;
      return row++;
    };

    /** Full-width section header with gray background and thick border. */
    const sectionHeader = (text, withPageBreak = false) => {
      if (withPageBreak && row > 15) pageBreakRows.push(row - 1);
      return mergeRow(text, {
        font:      { name: fontName, size: 11, bold: true },
        fill:      fillGray,
        border:    thickBdr,
        alignment: { vertical: 'middle', horizontal: 'left', wrapText: false },
        height:    22,
      });
    };

    const setLabel = (cellRef, text) => {
      const c = ws.getCell(cellRef);
      c.value     = text;
      c.font      = { name: fontName, size: 10, bold: true };
      c.alignment = { vertical: 'middle', horizontal: 'right', wrapText: false };
      c.border    = thinBdr;
    };

    const setValue = (cellRef, text) => {
      const c = ws.getCell(cellRef);
      c.value     = text;
      c.font      = { name: fontName, size: 10 };
      c.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      c.border    = thinBdr;
    };

    /** Three label–value pairs across A–F on one row. */
    const metaRow = (pairs) => {
      const cols = [['A','B'], ['C','D'], ['E','F']];
      pairs.forEach(([labelKey, value], i) => {
        if (!cols[i]) return;
        setLabel(`${cols[i][0]}${row}`, `${this.__(labelKey)}:`);
        setValue(`${cols[i][1]}${row}`, value || '');
      });
      ws.getRow(row).height = 20;
      row++;
    };

    const blankRow = (h = 8) => { ws.getRow(row).height = h; row++; };

    /**
     * Single data row: value is placed in A:B (merged), rest in C:F (merged).
     * Used for comments.
     */
    const splitRow = (leftText, rightText, leftFont = {}, rightFont = {}) => {
      ws.mergeCells(`A${row}:B${row}`);
      ws.mergeCells(`C${row}:F${row}`);
      const lc = ws.getCell(`A${row}`);
      lc.value     = leftText;
      lc.font      = Object.assign({ name: fontName, size: 9, italic: true }, leftFont);
      lc.alignment = { vertical: 'top', horizontal: 'left', wrapText: false };
      lc.border    = thinBdr;
      const rc = ws.getCell(`C${row}`);
      rc.value     = rightText;
      rc.font      = Object.assign({ name: fontName, size: 10 }, rightFont);
      rc.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
      rc.border    = thinBdr;
      // Row height: estimate lines from text length
      ws.getRow(row).height = Math.min(
        Math.max(20, Math.ceil((rightText || '').length / 80) * 14),
        120,
      );
      row++;
    };

    /**
     * Estimate a good row height for word-wrapped text in a merged A:F cell
     * (6 columns ≈ 114 characters at default column widths / typical font).
     */
    const estimateHeight = (text, minH = 20, maxH = 300) =>
      Math.min(Math.max(minH, Math.ceil((text || '').length / 114) * 14), maxH);

    // ════════════════════════════════════════════════════════════════════
    // ROW 1 — Card Title (always included)
    // ════════════════════════════════════════════════════════════════════
    mergeRow(card.title || '', {
      font:      { name: fontName, size: 16, bold: true },
      alignment: { vertical: 'middle', horizontal: 'left', wrapText: true },
      height:    40,
    });

    // ════════════════════════════════════════════════════════════════════
    // LABELS — coloured label badges
    // ════════════════════════════════════════════════════════════════════
    if (needsLabels) {
      const cardLabels = board
        ? (board.labels || []).filter(l => (card.labelIds || []).includes(l._id))
        : [];

      // Up to 5 label cells per row (columns B–F); column A holds the key.
      const labelValueCols = ['B', 'C', 'D', 'E', 'F'];
      const batchSize = labelValueCols.length;

      if (cardLabels.length === 0) {
        // Always render the row so the section is visible even with no labels.
        setLabel(`A${row}`, `${this.__('labels')}:`);
        ws.mergeCells(`B${row}:F${row}`);
        ws.getCell(`B${row}`).border = thinBdr;
        ws.getRow(row).height = 20;
        row++;
      } else {
        for (let batchStart = 0; batchStart < cardLabels.length; batchStart += batchSize) {
          const batch = cardLabels.slice(batchStart, batchStart + batchSize);

          if (batchStart === 0) {
            setLabel(`A${row}`, `${this.__('labels')}:`);
          } else {
            // Continuation row – leave A empty but bordered.
            const ac = ws.getCell(`A${row}`);
            ac.border = thinBdr;
          }

          for (let i = 0; i < batch.length; i++) {
            const label  = batch[i];
            const bgArgb = labelColorToArgb(label.color);
            const fgArgb = labelTextArgb(bgArgb);
            const c = ws.getCell(`${labelValueCols[i]}${row}`);
            c.value     = label.name || '';
            c.font      = { name: fontName, size: 10, bold: true, color: { argb: fgArgb } };
            c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
            c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
            c.border    = thinBdr;
          }

          // Fill any remaining cells in the row with a plain border.
          for (let i = batch.length; i < batchSize; i++) {
            ws.getCell(`${labelValueCols[i]}${row}`).border = thinBdr;
          }

          ws.getRow(row).height = 20;
          row++;
        }
      }
    }

    // ════════════════════════════════════════════════════════════════════
    // PEOPLE — Creator | Owner  /  Assignees  /  Members
    // ════════════════════════════════════════════════════════════════════
    if (needsPeople) {
      // Row 1: Creator (A:B) | Owner (C:D) | E:F merged and empty
      metaRow([
        ['creator', creatorName],
        ['owner',   ownerName],
      ]);
      // metaRow only fills pairs provided — border the unused E:F cells
      ws.mergeCells(`E${row - 1}:F${row - 1}`);
      ws.getCell(`E${row - 1}`).border = thinBdr;

      // Row 2: Assignees spanning B:F
      setLabel(`A${row}`, `${this.__('assignees')}:`);
      ws.mergeCells(`B${row}:F${row}`);
      const ac = ws.getCell(`B${row}`);
      ac.value     = assigneeNames;
      ac.font      = { name: fontName, size: 10 };
      ac.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      ac.border    = thinBdr;
      ws.getRow(row).height = 20;
      row++;

      // Row 3: Members spanning B:F
      setLabel(`A${row}`, `${this.__('members')}:`);
      ws.mergeCells(`B${row}:F${row}`);
      const mc = ws.getCell(`B${row}`);
      mc.value     = memberNames;
      mc.font      = { name: fontName, size: 10 };
      mc.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      mc.border    = thinBdr;
      ws.getRow(row).height = 20;
      row++;
    }

    // ════════════════════════════════════════════════════════════════════
    // BOARD INFO — Board | Swimlane | List
    // ════════════════════════════════════════════════════════════════════
    if (needsBoardInfo) {
      metaRow([
        ['board',    (board    && board.title)    || ''],
        ['swimlane', (swimlane && swimlane.title) || ''],
        ['list',     (list     && list.title)     || ''],
      ]);
    }

    // ════════════════════════════════════════════════════════════════════
    // DATES — Created at | Received | Start  +  Created by | Due | End
    // ════════════════════════════════════════════════════════════════════
    if (needsDates) {
      metaRow([
        ['createdAt',     this.fmtDate(card.createdAt)],
        ['card-received', this.fmtDate(card.receivedAt)],
        ['card-start',    this.fmtDate(card.startAt)],
      ]);
      metaRow([
        ['creator', creatorName],
        ['card-due',   this.fmtDate(card.dueAt)],
        ['card-end',   this.fmtDate(card.endAt)],
      ]);
    }

    blankRow();

    // ════════════════════════════════════════════════════════════════════
    // DESCRIPTION
    // ════════════════════════════════════════════════════════════════════
    if (needsDescription) {
      sectionHeader(this.__('description'));
      const descText = normalizeText(card.description || '');
      ws.mergeCells(`A${row}:F${row}`);
      const dc = ws.getCell(`A${row}`);
      dc.value     = descText;
      dc.font      = { name: fontName, size: 10 };
      dc.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
      dc.border    = thinBdr;
      ws.getRow(row).height = estimateHeight(descText, 30, 300);
      row++;
      blankRow();
    }

    // ════════════════════════════════════════════════════════════════════
    // CHECKLISTS
    // ════════════════════════════════════════════════════════════════════
    if (needsChecklists) {
      sectionHeader(this.__('checklists'), true);
      if (checklists && checklists.length > 0) {
        const fillProgressDone  = { type: 'pattern', pattern: 'solid', fgColor: { argb: progressColorArgb(board && board.color) } };
        const fillProgressEmpty = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }; // gray

        const sorted = [...checklists].sort((a, b) => (a.sort || 0) - (b.sort || 0));
        for (const cl of sorted) {
          // Items (needed for progress calculation before rendering title)
          const items = (checklistItems || [])
            .filter(i => i.checklistId === cl._id)
            .sort((a, b) => (a.sort || 0) - (b.sort || 0));

          const total    = items.length;
          const finished = items.filter(i => i.isFinished).length;
          const percent  = total > 0 ? Math.round(finished / total * 100) : 0;

          // Checklist name
          ws.mergeCells(`A${row}:F${row}`);
          const clc = ws.getCell(`A${row}`);
          clc.value     = cl.title || '';
          clc.font      = { name: fontName, size: 10, bold: true, underline: true };
          clc.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
          clc.border    = thinBdr;
          ws.getRow(row).height = 18;
          row++;

          // Progress row: A = "X/Y (N%)", B–F = 5-segment visual bar (each segment = 20%)
          const pc = ws.getCell(`A${row}`);
          pc.value     = `${finished}/${total} (${percent}%)`;
          pc.font      = { name: fontName, size: 9, italic: true };
          pc.alignment = { vertical: 'middle', horizontal: 'right', wrapText: false };
          pc.border    = thinBdr;
          const barCols  = ['B', 'C', 'D', 'E', 'F'];
          const filledSegs = Math.round(percent / 100 * barCols.length);
          barCols.forEach((col, idx) => {
            const bc  = ws.getCell(`${col}${row}`);
            bc.fill   = idx < filledSegs ? fillProgressDone : fillProgressEmpty;
            bc.border = thinBdr;
          });
          ws.getRow(row).height = 10;
          row++;

          // Items
          for (const item of items) {
            ws.mergeCells(`A${row}:F${row}`);
            const ic = ws.getCell(`A${row}`);
            ic.value     = `  ${item.isFinished ? '[x]' : '[ ]'} ${item.title || ''}`;
            ic.font      = { name: fontName, size: 10, strike: !!item.isFinished };
            ic.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            ic.border    = thinBdr;
            ws.getRow(row).height = 18;
            row++;
          }
        }
      } else {
        ws.mergeCells(`A${row}:F${row}`);
        ws.getCell(`A${row}`).border = thinBdr;
        ws.getRow(row).height = 18;
        row++;
      }
      blankRow();
    }

    // ════════════════════════════════════════════════════════════════════
    // SUBTASKS
    // ════════════════════════════════════════════════════════════════════
    if (needsSubtasks && subtasks && subtasks.length > 0) {
      sectionHeader(this.__('export-card-subtasks'), true);
      for (const sub of subtasks) {
        ws.mergeCells(`A${row}:F${row}`);
        const sc = ws.getCell(`A${row}`);
        sc.value     = `  \u2022 ${sub.title || ''}`;
        sc.font      = { name: fontName, size: 10 };
        sc.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        sc.border    = thinBdr;
        ws.getRow(row).height = 18;
        row++;
      }
      blankRow();
    }

    // ════════════════════════════════════════════════════════════════════
    // COMMENTS
    // ════════════════════════════════════════════════════════════════════
    if (needsComments) {
      sectionHeader(this.__('comments'), true);
      // Sub-header
      ws.mergeCells(`A${row}:B${row}`);
      ws.mergeCells(`C${row}:F${row}`);
      const chL = ws.getCell(`A${row}`);
      chL.value = this.__('createdAt'); chL.font = { name: fontName, size: 9, bold: true };
      chL.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
      chL.border = thinBdr; chL.fill = fillLight;
      const chR = ws.getCell(`C${row}`);
      chR.value = this.__('comment'); chR.font = { name: fontName, size: 9, bold: true };
      chR.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
      chR.border = thinBdr; chR.fill = fillLight;
      ws.getRow(row).height = 18;
      row++;
      if (comments.length > 0) {
        for (const c of comments) {
          const author = userMap[c.userId] || '';
          const text   = normalizeText(c.text || '');
          splitRow(this.fmtDate(c.createdAt), author ? `${author}: ${text}` : text);
        }
      } else {
        ws.mergeCells(`A${row}:F${row}`);
        ws.getCell(`A${row}`).border = thinBdr;
        ws.getRow(row).height = 18;
        row++;
      }
      blankRow();
    }

    // ════════════════════════════════════════════════════════════════════
    // ATTACHMENTS
    // ════════════════════════════════════════════════════════════════════
    if (needsAttachments) {
      sectionHeader(this.__('export-card-attachments'), true);

      if (attachments && attachments.length > 0) {
        // ── Metadata table header ──────────────────────────────────────
        const attHdrCols = [
          ['A', '#'],
          ['B', this.__('export-card-attachment-filename')],
          ['C', this.__('export-card-attachment-size')],
          ['D', this.__('export-card-attachment-type')],
          ['E', this.__('export-card-attachment-uploaded-at')],
          ['F', this.__('export-card-attachment-uploaded-by')],
        ];
        for (const [col, label] of attHdrCols) {
          const hc = ws.getCell(`${col}${row}`);
          hc.value     = label;
          hc.font      = { name: fontName, size: 9, bold: true };
          hc.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
          hc.border    = thinBdr;
          hc.fill      = fillLight;
        }
        ws.getRow(row).height = 18;
        row++;

        // ── One metadata row per attachment ────────────────────────────
        const imageAttachments = [];
        const usedFilenames    = new Set();

        for (let ai = 0; ai < attachments.length; ai++) {
          const att     = attachments[ai];
          const uploader = userMap[att.userId || (att.meta && att.meta.userId)] || '';
          const uploadedAt = this.fmtDate(att.uploadedAt || att.uploadedAtOstrio || att.createdAt);
          const mimeType = att.type || '';

          // Build display filename (unique per export, in-memory dedup)
          const ext      = att.extensionWithDot || (att.extension ? `.${att.extension}` : '');
          const baseName = (att.name || 'file').replace(new RegExp(`${ext.replace('.', '\\.')}$`, 'i'), '') || 'file';
          let dispName   = `${baseName}${ext}`;
          if (usedFilenames.has(dispName)) {
            let i = 1;
            while (usedFilenames.has(`${baseName}_${i}${ext}`)) i++;
            dispName = `${baseName}_${i}${ext}`;
          }
          usedFilenames.add(dispName);

          const cells = [
            [`A${row}`, String(ai + 1)],
            [`B${row}`, dispName],
            [`C${row}`, formatFileSize(att.size)],
            [`D${row}`, mimeType],
            [`E${row}`, uploadedAt],
            [`F${row}`, uploader],
          ];
          for (const [ref, val] of cells) {
            const c = ws.getCell(ref);
            c.value     = val;
            c.font      = { name: fontName, size: 9 };
            c.alignment = { vertical: 'middle', horizontal: ref.startsWith('A') ? 'center' : 'left', wrapText: true };
            c.border    = thinBdr;
          }
          ws.getRow(row).height = 18;
          row++;

          // Collect embeddable image attachments
          if (EMBEDDABLE_IMAGE_MIME.has(mimeType.toLowerCase())) {
            imageAttachments.push({ att, dispName, ext: EMBEDDABLE_IMAGE_MIME.get(mimeType.toLowerCase()) });
          }
        }

        // ── Embedded image previews ────────────────────────────────────
        if (imageAttachments.length > 0) {
          blankRow();
          // Sub-header: "Image Previews"
          ws.mergeCells(`A${row}:F${row}`);
          const imgHdr = ws.getCell(`A${row}`);
          imgHdr.value     = this.__('export-card-attachment-image-previews');
          imgHdr.font      = { name: fontName, size: 10, bold: true, italic: true };
          imgHdr.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
          imgHdr.fill      = fillLight;
          ws.getRow(row).height = 18;
          row++;

          // Process in batches of IMAGES_PER_ROW
          for (let batchStart = 0; batchStart < imageAttachments.length; batchStart += IMAGES_PER_ROW) {
            const batch       = imageAttachments.slice(batchStart, batchStart + IMAGES_PER_ROW);
            const imageRow    = row;     // The tall row where images are anchored
            const labelRow    = row + 1; // Row below for filename labels

            ws.getRow(imageRow).height = IMG_ROW_HEIGHT;
            ws.getRow(labelRow).height = 30; // allow text wrap for filename

            for (let i = 0; i < batch.length; i++) {
              const { att, dispName, ext: imgExt } = batch[i];
              const colPos = i * IMG_COLS_PER_IMAGE; // 0, 1.5, 3.0, 4.5

              // Load image as buffer
              let imageBuffer = null;
              try {
                const strategy = fileStoreStrategyFactory.getFileStrategy(att, 'original');
                if (strategy) {
                  const stream = strategy.getReadStream();
                  if (stream) {
                    imageBuffer = await streamToBuffer(stream);
                  }
                }
              } catch (imgErr) {
                console.warn(`ExporterExcelCard: could not read image ${att._id}: ${imgErr.message}`);
              }

              if (imageBuffer && imageBuffer.length > 0) {
                try {
                  const imageId = workbook.addImage({ buffer: imageBuffer, extension: imgExt });
                  ws.addImage(imageId, {
                    tl: { col: colPos, row: imageRow - 1 },           // 0-based
                    ext: { width: IMG_WIDTH_PX, height: IMG_HEIGHT_PX },
                  });
                } catch (embedErr) {
                  console.warn(`ExporterExcelCard: could not embed image ${att._id}: ${embedErr.message}`);
                }
              }

              // Filename label below the image
              // Each image occupies ~1.5 columns; map to nearest single cell
              const labelColLetters = ['A', 'B', 'C', 'D'][i] || 'A';
              const lc = ws.getCell(`${labelColLetters}${labelRow}`);
              lc.value     = dispName;
              lc.font      = { name: fontName, size: 8 };
              lc.alignment = { vertical: 'top', horizontal: 'center', wrapText: true };
            }

            row += 2; // advance past image row + label row
          }
        }

      } else {
        // No attachments
        ws.mergeCells(`A${row}:F${row}`);
        ws.getCell(`A${row}`).border = thinBdr;
        ws.getRow(row).height = 18;
        row++;
      }
    }

    // ── Apply collected page breaks ──────────────────────────────────────
    if (pageBreakRows.length > 0) {
      // ExcelJS stores row page breaks via the underlying sheet properties
      // rowBreaks is an array of { man: 1, id: rowNumber }
      ws.pageSetup.rowBreaks = pageBreakRows.map(r => ({ man: 1, id: r }));
    }

    // ── Stream workbook directly to HTTP response (no temp file) ────────
    const filename = `${sanitizeFilename(card.title)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
  }
}

export { ExporterExcelCard, ALL_FIELDS };
