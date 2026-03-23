import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { createWorkbook } from './createWorkbook';
import { fileStoreStrategyFactory } from '/models/attachments.server';
import fs from 'fs';
import path from 'path';
import { execSync } from 'node:child_process';

// ── Constants ────────────────────────────────────────────────────────────────

/** All selectable field section keys (order determines display order). */
const ALL_FIELDS = [
  'people',
  'board-info',
  'dates',
  'description',
  'checklists',
  'subtasks',
  'comments',
  'attachments',
];

/** MIME types that ExcelJS can embed as inline images. */
const EMBEDDABLE_IMAGE_MIME = new Map([
  ['image/jpeg', 'jpeg'],
  ['image/jpg',  'jpeg'],
  ['image/png',  'png'],
  ['image/gif',  'gif'],
  ['image/bmp',  'bmp'],
]);

const IMG_WIDTH_PX       = 150;   // embedded image width in pixels
const IMG_HEIGHT_PX      = 115;   // embedded image height in pixels
const IMG_ROW_HEIGHT     = 95;    // row height (pt) for image rows
const IMAGES_PER_ROW     = 4;     // maximum images side-by-side
const IMG_COLS_PER_IMAGE = 1.5;   // fractional column units each image occupies (cols: 0, 1.5, 3.0, 4.5)

const MIN_FREE_BYTES   = 100 * 1024 * 1024; // 100 MB minimum free disk space

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

/** Build a filesystem-safe ASCII username from a user object. */
function sanitizeUsername(user) {
  if (!user) return 'anonymous';
  const raw =
    user.username ||
    (user.profile && (user.profile.fullname || user.profile.name)) ||
    (user.emails && user.emails[0] && user.emails[0].address) ||
    'anonymous';
  return (
    String(raw)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // strip diacritics
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 60) || 'anonymous'
  );
}

function normalizeText(value) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0, 10);
}

function formatDateTime(d) {
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0, 16).replace('T', ' ');
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

/**
 * Return free bytes on the filesystem containing dirPath.
 * Falls back to Infinity if it cannot be determined.
 */
function getFreeDiskSpaceBytes(dirPath) {
  // Try Node 18.15+ statfsSync
  try {
    if (typeof fs.statfsSync === 'function') {
      const st = fs.statfsSync(dirPath);
      return (st.bavail ?? st.bfree ?? 0) * (st.bsize ?? 4096);
    }
  } catch (_) { /* fall through */ }

  // Try POSIX df command (Linux / macOS)
  try {
    const out = execSync(
      `df -k -- "${dirPath.replace(/"/g, '\\"')}" 2>/dev/null`,
      { timeout: 4000 },
    ).toString();
    const lines = out.trim().split('\n');
    const parts = lines[lines.length - 1].trim().split(/\s+/);
    // df -k output: Filesystem 1K-blocks Used Available Use% Mountpoint
    const availKB = parseInt(parts[3], 10);
    if (!isNaN(availKB) && availKB >= 0) return availKB * 1024;
  } catch (_) { /* fall through */ }

  return Infinity; // Cannot determine – allow export
}

/**
 * Ensure a directory (and all parents) exist.
 * Returns the resolved path.
 */
function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

/**
 * Build a unique file path inside dir for a given basename + ext.
 * If `base.ext` is already used, tries `base_1.ext`, `base_2.ext`, etc.
 */
function uniqueFilePath(dir, base, ext, usedNames) {
  const candidate = (suffix) => path.join(dir, suffix ? `${base}_${suffix}${ext}` : `${base}${ext}`);
  let name = `${base}${ext}`;
  if (!usedNames.has(name) && !fs.existsSync(candidate())) {
    usedNames.add(name);
    return candidate();
  }
  let i = 1;
  while (true) {
    name = `${base}_${i}${ext}`;
    if (!usedNames.has(name) && !fs.existsSync(candidate(i))) {
      usedNames.add(name);
      return candidate(i);
    }
    i++;
  }
}

// ── ExporterExcelCard ────────────────────────────────────────────────────────

class ExporterExcelCard {
  /**
   * @param {string}     boardId
   * @param {string}     listId
   * @param {string}     cardId
   * @param {string}     userLanguage  BCP-47 tag, e.g. 'en', 'de'
   * @param {string[]|null} fields     Sections to include; null = all
   * @param {object|null}   user       Meteor user object (for temp path naming)
   */
  constructor(boardId, listId, cardId, userLanguage, fields, user) {
    this._boardId     = boardId;
    this._listId      = listId;
    this._cardId      = cardId;
    this.userLanguage = userLanguage || 'en';
    this._fields      = fields && fields.length > 0 ? new Set(fields) : new Set(ALL_FIELDS);
    this._user        = user || null;
  }

  __(key) { return TAPi18n.__(key, '', this.userLanguage); }

  hasField(key) { return this._fields.has(key); }

  async canExport(user) {
    const board = await ReactiveCache.getBoard(this._boardId);
    return board && board.isVisibleBy(user);
  }

  // ── Build ────────────────────────────────────────────────────────────────

  async build(res) {
    const writablePath = process.env.WRITABLE_PATH || process.cwd();

    // ── Temp directory ───────────────────────────────────────────────────
    const now = new Date();
    const ts = now.toISOString()
      .slice(0, 19)
      .replace(/:/g, '-')
      .replace('T', '_');
    const safeUser = sanitizeUsername(this._user);
    const tempDir  = path.join(writablePath, 'files', 'export-to-excel', ts);
    const tempFile = path.join(tempDir, `${safeUser}.xlsx`);

    // ── Disk-space check ─────────────────────────────────────────────────
    // Check against parent dirs that already exist
    const checkDir = [tempDir, path.dirname(tempDir), writablePath].find(p => {
      try { return fs.existsSync(p); } catch (_) { return false; }
    }) || writablePath;

    let estimatedBytes = MIN_FREE_BYTES;
    if (this.hasField('attachments')) {
      try {
        const attSizes = await ReactiveCache.getAttachments(
          { 'meta.cardId': this._cardId },
          { fields: { size: 1 } },
        );
        const totalAttSize = (attSizes || []).reduce((s, a) => s + (a.size || 0), 0);
        estimatedBytes = Math.max(MIN_FREE_BYTES, totalAttSize * 2 + 20 * 1024 * 1024);
      } catch (_) { /* ignore */ }
    }

    const freeBytes = getFreeDiskSpaceBytes(checkDir);
    if (freeBytes < estimatedBytes) {
      const mbNeeded = Math.ceil(estimatedBytes / (1024 * 1024));
      const mbFree   = Math.floor(freeBytes / (1024 * 1024));
      res.writeHead(507, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(
        `${this.__('export-card-excel-no-disk-space')} ` +
        `(${this.__('export-card-excel-free')}: ${mbFree} MB, ` +
        `${this.__('export-card-excel-needed')}: ~${mbNeeded} MB)`,
      );
      return;
    }

    // ── Ensure temp dir exists ───────────────────────────────────────────
    try {
      ensureDir(tempDir);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Failed to create export directory: ${err.message}`);
      return;
    }

    try {
      await this._buildAndWrite(res, tempDir, tempFile);
    } catch (err) {
      console.error('ExporterExcelCard: build error', err);
      // Clean up on error
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`Export failed: ${err.message}`);
      }
    }
  }

  // ── Internal build ───────────────────────────────────────────────────────

  async _buildAndWrite(res, tempDir, tempFile) {
    const card = await ReactiveCache.getCard(this._cardId);
    if (!card) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Card not found');
      return;
    }

    const needsPeople      = this.hasField('people');
    const needsBoardInfo   = this.hasField('board-info');
    const needsDates       = this.hasField('dates');
    const needsDescription = this.hasField('description');
    const needsChecklists  = this.hasField('checklists');
    const needsSubtasks    = this.hasField('subtasks');
    const needsComments    = this.hasField('comments');
    const needsAttachments = this.hasField('attachments');

    // ── Fetch data ───────────────────────────────────────────────────────
    const board    = needsBoardInfo ? await ReactiveCache.getBoard(this._boardId)            : null;
    const list     = needsBoardInfo ? await ReactiveCache.getList(card.listId)               : null;
    const swimlane = needsBoardInfo ? await ReactiveCache.getSwimlane(card.swimlaneId)        : null;

    const userMap = {};
    if (needsPeople || needsComments || needsAttachments) {
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
    // PEOPLE — Creator | Owner | Assignee + Members
    // ════════════════════════════════════════════════════════════════════
    if (needsPeople) {
      metaRow([
        ['creator',  creatorName],
        ['owner',    ownerName],
        ['assignee', assigneeNames],
      ]);
      // Members: A = label, B:F = value (could be a long comma-separated list)
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
    // BOARD INFO — Board | List | Swimlane
    // ════════════════════════════════════════════════════════════════════
    if (needsBoardInfo) {
      metaRow([
        ['board',    (board    && board.title)    || ''],
        ['list',     (list     && list.title)     || ''],
        ['swimlane', (swimlane && swimlane.title) || ''],
      ]);
    }

    // ════════════════════════════════════════════════════════════════════
    // DATES — Start | Due | End  +  Received | Created
    // ════════════════════════════════════════════════════════════════════
    if (needsDates) {
      metaRow([
        ['card-start',    formatDate(card.startAt)],
        ['card-due',      formatDate(card.dueAt)],
        ['card-end',      formatDate(card.endAt)],
      ]);
      metaRow([
        ['card-received', formatDate(card.receivedAt)],
        ['createdAt',     formatDate(card.createdAt)],
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
      sectionHeader(this.__('checklist'), true);
      if (checklists && checklists.length > 0) {
        const sorted = [...checklists].sort((a, b) => (a.sort || 0) - (b.sort || 0));
        for (const cl of sorted) {
          // Checklist name
          ws.mergeCells(`A${row}:F${row}`);
          const clc = ws.getCell(`A${row}`);
          clc.value     = cl.title || '';
          clc.font      = { name: fontName, size: 10, bold: true, underline: true };
          clc.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
          clc.border    = thinBdr;
          ws.getRow(row).height = 18;
          row++;
          // Items
          const items = (checklistItems || [])
            .filter(i => i.checklistId === cl._id)
            .sort((a, b) => (a.sort || 0) - (b.sort || 0));
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
      sectionHeader(this.__('comment'), true);
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
          splitRow(formatDateTime(c.createdAt), author ? `${author}: ${text}` : text);
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
          ['E', this.__('export-card-attachment-uploaded-by')],
          ['F', this.__('export-card-attachment-uploaded-at')],
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
          const uploadedAt = formatDate(att.uploadedAt || att.uploadedAtOstrio || att.createdAt);
          const mimeType = att.type || '';

          // Build display filename (unique per export)
          const ext      = att.extensionWithDot || (att.extension ? `.${att.extension}` : '');
          const baseName = (att.name || 'file').replace(new RegExp(`${ext.replace('.', '\\.')}$`, 'i'), '') || 'file';
          const dispName = uniqueFilePath('', baseName, ext, usedFilenames).replace(/^[/\\]/, '');

          const cells = [
            [`A${row}`, String(ai + 1)],
            [`B${row}`, dispName],
            [`C${row}`, formatFileSize(att.size)],
            [`D${row}`, mimeType],
            [`E${row}`, uploader],
            [`F${row}`, uploadedAt],
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

    // ── Write workbook to temp file ──────────────────────────────────────
    await workbook.xlsx.writeFile(tempFile);

    // ── Stream temp file to HTTP response ───────────────────────────────
    const filename = `${sanitizeFilename(card.title)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const fileStream = fs.createReadStream(tempFile);
    fileStream.pipe(res);

    // Cleanup temp directory after response finishes
    res.on('finish', () => {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
    });
    res.on('close', () => {
      // Also clean up if client disconnects
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
    });
  }
}

export { ExporterExcelCard, ALL_FIELDS };
