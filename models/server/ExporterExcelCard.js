import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { CARD_EXPORT_FIELD_KEYS } from '/models/lib/exportFields';
import { createWorkbook } from './createWorkbook';
import { fileStoreStrategyFactory } from '/models/attachments.server';
import { formatDateByUserPreference } from '/imports/lib/dateUtils';
import { buildExportCardDocument, formatExportFileSize } from '/models/lib/cardExportDocument';
import { renderCardDocumentExcel } from './renderCardDocumentExcel';
import { accentOf } from '/models/lib/themeAccents';
import { attachmentDisposition, exportFilename } from '/models/lib/exportFilename';

// ── Constants ────────────────────────────────────────────────────────────────

/** All selectable field section keys (order determines display order). */
// #1173: ONE list, shared with the popup that offers these as checkboxes and
// with the PDF export that gates the same sections - see models/lib/exportFields.js
// for why a "must match" comment is not a mechanism.
const ALL_FIELDS = CARD_EXPORT_FIELD_KEYS;

/** MIME types that ExcelJS can embed as inline images. */
const EMBEDDABLE_IMAGE_MIME = new Map([
  ['image/jpeg', 'jpeg'],
  ['image/jpg',  'jpeg'],
  ['image/png',  'png'],
  ['image/gif',  'gif'],
  ['image/bmp',  'bmp'],
]);

// ── Pure helper functions ────────────────────────────────────────────────────

function sanitizeSheetName(value) {
  return String(value || 'Card').replace(/[\\/*?:[\]]/g, '-').slice(0, 31);
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
  constructor(boardId, listId, cardId, userLanguage, fields, dateFormat, timezone) {
    this._boardId     = boardId;
    this._listId      = listId;
    this._cardId      = cardId;
    this.userLanguage = userLanguage || 'en';
    this._fields      = fields && fields.length > 0 ? new Set(fields) : new Set(ALL_FIELDS);
    this.dateFormat   = dateFormat || 'YYYY-MM-DD';
    this.timezone     = timezone || '';
  }

  __(key) { return TAPi18n.__(key, '', this.userLanguage); }

  /**
   * Format a date value using the user's preferred format, always including time.
   *
   * #6586: in the READER's time zone, sent by the export link, because the dates
   * are stored in UTC and this runs on the server - `getHours()` here answers in
   * whatever zone the server was started with, which is nobody's. Without a zone
   * it renders UTC and says so, rather than silently printing the server's.
   */
  fmtDate(d) {
    if (!d) return '';
    const zone = this.timezone || 'UTC';
    const formatted = formatDateByUserPreference(d, this.dateFormat, true, zone);
    if (!formatted) return '';
    return this.timezone ? formatted : `${formatted} UTC`;
  }

  hasField(key) { return this._fields.has(key); }

  /**
   * A custom field's value as text: a dropdown stores the ITEM ID it selected,
   * which says nothing on paper, so the definition is asked for the name (#6586).
   */
  customFieldValueText(definition, value) {
    if (value === null || value === undefined || value === '') return '';
    if (definition && definition.type === 'dropdown') {
      const items = (definition.settings && definition.settings.dropdownItems) || [];
      const item = items.find(entry => entry && entry._id === value);
      if (item) return item.name || '';
    }
    if (value instanceof Date) return this.fmtDate(value);
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? this.__('yes') : this.__('no');
    return String(value);
  }

  async canExport(user) {
    const board = await ReactiveCache.getBoard(this._boardId);
    return board && board.isVisibleBy(user);
  }

  /**
   * ONE CARD, drawn as the card export draws it, onto a worksheet the caller
   * owns - which is how the BOARD export renders every card in the same layout
   * (#1173) instead of carrying a second, thinner rendering of the same data.
   *
   * Everything it needs is passed in rather than fetched: the card export reads
   * one card's checklists, comments and attachments per card, which is right for
   * one card and would be fifteen hundred queries for a board of three hundred.
   * The board export reads each collection once and hands the slices in here.
   *
   * @returns {{row: number, pageBreakRows: number[]}} where the next block starts
   */
  async renderCardBlock(ws, workbook, startRow, data) {
    const {
      card, board, list, swimlane, userMap = {}, checklists = [],
      checklistItems = [], subtasks = [], comments = [], attachments = [],
      customFieldsById = {},
    } = data;

    const imageAttachments = [];
    for (const attachment of attachments) {
      const type = String(attachment.type || '').toLowerCase();
      const ext = EMBEDDABLE_IMAGE_MIME.get(type);
      if (!ext) continue;
      try {
        const strategy = fileStoreStrategyFactory.getFileStrategy(attachment, 'original');
        const stream = strategy && strategy.getReadStream();
        if (!stream) continue;
        const image = await streamToBuffer(stream);
        if (image.length) imageAttachments.push({
          name: attachment.name || (attachment.meta && attachment.meta.name) || attachment._id,
          size: formatExportFileSize(attachment.size),
          ext,
          data: image,
        });
      } catch (error) {
        console.warn(`ExporterExcelCard: could not read image ${attachment._id}: ${error.message}`);
      }
    }

    const document = buildExportCardDocument({
      card, board, list, swimlane, checklists, checklistItems, subtasks,
      comments, attachments, images: imageAttachments, customFieldsById,
    }, {
      fields: [...this._fields],
      userName: id => userMap[id] || id || '',
      formatDate: value => this.fmtDate(value),
      customFieldValue: (definition, value) => this.customFieldValueText(definition, value),
      translate: (key, fallback) => this.__(key) || fallback,
    });

    return renderCardDocumentExcel(ws, workbook, startRow, document, {
      fontName: this.__('excel-font'),
      progressColor: accentOf((board && board.color) || '').replace('#', '').toUpperCase(),
      attachmentHeadings: [
        '#', this.__('name'), this.__('size'), this.__('type'),
        this.__('export-card-attachment-uploaded-at'),
        this.__('export-card-attachment-uploaded-by'),
      ],
    });
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
    // GHSA-6p5m-f9p2-wqm5: the card must be looked up INSIDE the board and list
    // the caller was authorised for, not by its id alone.
    //
    // canExport() above answers "may this user see the board in :boardId?" - it
    // never sees :cardId. So with a bare primary-key lookup here the two
    // identifiers came apart: :boardId decided the authorisation and :cardId
    // decided the data. Any authenticated user could create their own public
    // board (POST /api/boards takes `permission` straight from the body), name
    // it as :boardId, and pass the id of a card in somebody's private board as
    // :cardId. The export then returned that card's title, description, members,
    // every comment with its author, checklists, subtasks, attachment metadata -
    // and, because image attachments are read through getReadStream() and
    // embedded in the workbook further down, the attachment BYTES.
    //
    // The same route shape for PDF has always been right
    // (ExporterCardPDF._getCardData: getCard({ _id, boardId, listId })), which is
    // what makes this an omission rather than a decision. Constraining the query
    // is the fix rather than a check bolted on after it: a card outside the
    // authorised board now does not resolve at all, so nothing downstream - the
    // checklist, subtask, comment and attachment fan-out, all keyed on the same
    // card id - can read anything either.
    const card = await ReactiveCache.getCard({
      _id: this._cardId,
      boardId: this._boardId,
      listId: this._listId,
    });
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
    const needsCustomFields = this.hasField('custom-fields');
    const needsVoting      = this.hasField('voting');
    const needsPoker       = this.hasField('poker');

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
        if (card.requesters) card.requesters.forEach(id => userIds.add(id));
        if (card.assigners) card.assigners.forEach(id => userIds.add(id));
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
    const subtasks      = needsSubtasks    ? await ReactiveCache.getCards({ boardId: this._boardId, parentId: this._cardId })            : [];
    const comments      = needsComments    ? await ReactiveCache.getCardComments({ cardId: this._cardId }, { sort: { createdAt: 1 } })   : [];
    const attachments   = needsAttachments ? await ReactiveCache.getAttachments({ 'meta.cardId': this._cardId }, { sort: { uploadedAt: -1 } }) : [];

    // A card stores a custom field as { _id, value }; the NAME - and, for a
    // dropdown, the name behind the item id it stores - is on the definition.
    const customFieldsById = {};
    if (needsCustomFields) {
      const customFieldIds = (card.customFields || []).map(f => f && f._id).filter(Boolean);
      if (customFieldIds.length > 0) {
        const definitions = await ReactiveCache.getCustomFields({ _id: { $in: customFieldIds } });
        (definitions || []).forEach(d => { customFieldsById[d._id] = d; });
      }
    }

    // Batch-load any missing user IDs (comments + attachments uploaders, voters)
    if (needsComments || needsAttachments || needsVoting) {
      const extraIds = new Set();
      if (needsComments)    comments.forEach(c => c.userId && extraIds.add(c.userId));
      if (needsAttachments) attachments.forEach(a => (a.userId || (a.meta && a.meta.userId)) && extraIds.add(a.userId || a.meta.userId));
      // Who voted is the part of a vote worth printing; a count alone is a
      // number nobody can check afterwards.
      if (needsVoting && card.vote) {
        (card.vote.positive || []).forEach(id => extraIds.add(id));
        (card.vote.negative || []).forEach(id => extraIds.add(id));
      }
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

    const data = {
      card, board, list, swimlane, userMap,
      creatorName, ownerName, memberNames, assigneeNames,
      checklists, checklistItems, subtasks, comments, attachments,
      customFieldsById,
    };
    const { pageBreakRows } = await this.renderCardBlock(ws, workbook, 1, data);

    // ── Apply collected page breaks ──────────────────────────────────────
    if (pageBreakRows.length > 0) {
      // ExcelJS stores row page breaks via the underlying sheet properties
      // rowBreaks is an array of { man: 1, id: rowNumber }
      ws.pageSetup.rowBreaks = pageBreakRows.map(r => ({ man: 1, id: r }));
    }

    // ── Stream workbook directly to HTTP response (no temp file) ────────
    const filename = exportFilename('card', key => this.__(key), card.cardNumber || 1, 'xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', attachmentDisposition(filename));
    await workbook.xlsx.write(res);
    res.end();
  }
}

export { ExporterExcelCard, ALL_FIELDS };
