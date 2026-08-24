import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { createWorkbook } from './createWorkbook';
import { formatDateByUserPreference } from '/imports/lib/dateUtils';
import { ExporterExcelCard } from './ExporterExcelCard';
import { attachmentDisposition, exportFilename } from '/models/lib/exportFilename';

// A BOARD in the CARD export's layout (#1173).
//
// "Add Feature: Print Board with Params", open since 2017: print a board, and be
// able to choose what goes in. What existed was two board exports that looked
// nothing like the card export of the same data - the Excel one was a
// spreadsheet table, one row per card and eighteen columns, and neither offered
// a choice of what to include.
//
// So this renders a board the way a card is rendered: the board's own header,
// then every card as the CARD export's own block - drawn by the card export's
// own code (ExporterExcelCard.renderCardBlock), so the two cannot drift into two
// layouts again. What each block contains is the `?fields=` selection the popup
// sends, the same keys the card export uses.
//
// WHY THIS IS A SEPARATE EXPORTER, and models/server/ExporterExcel.js is still
// there: that one STREAMS. It writes rows through exceljs' WorkbookWriter
// straight into the response so a board with thousands of cards costs flat
// memory, and it was written that way on purpose after the old in-memory version
// ate gigabytes. A card block cannot be streamed - it merges cells, styles them
// and comes back to earlier rows - so the card layout is an in-memory workbook,
// and the streaming table is what you get when `card-details` is not selected.
// That is not a fallback nobody can see: it is a checkbox in the popup, and a
// board too big for the card layout is exported as the table by unticking it.

// Excel refuses a sheet name over 31 characters, and one containing : \ / ? * [ ]
function sanitizeSheetName(value) {
  const cleaned = String(value || 'Board').replace(/[:\\/?*[\]]/g, ' ').trim() || 'Board';
  return cleaned.length > 31 ? `${cleaned.slice(0, 28)}...` : cleaned;
}

class ExporterExcelBoard {
  // `scope` is {swimlaneId} or {listId} - the same export, restricted to one
  // swimlane or one list, because those menus offer it too (#1173). Nothing else
  // changes: the same header, the same card blocks, the same selection.
  constructor(boardId, userLanguage, fields, dateFormat, timezone, scope = {}) {
    this._boardId = boardId;
    this._swimlaneId = scope.swimlaneId || '';
    this._listId = scope.listId || '';
    this.userLanguage = userLanguage || 'en';
    this._fields = fields && fields.length > 0 ? new Set(fields) : null;
    this.dateFormat = dateFormat || 'YYYY-MM-DD';
    this.timezone = timezone || '';
  }

  __(key) { return TAPi18n.__(key, '', this.userLanguage); }

  // No selection means everything, the same rule the card export follows.
  hasField(key) { return this._fields === null || this._fields.has(key); }

  fmtDate(d) {
    if (!d) return '';
    const zone = this.timezone || 'UTC';
    const formatted = formatDateByUserPreference(d, this.dateFormat, true, zone);
    if (!formatted) return '';
    return this.timezone ? formatted : `${formatted} UTC`;
  }

  async canExport(user) {
    const board = await ReactiveCache.getBoard(this._boardId);
    return board && board.isVisibleBy(user);
  }

  // One pass per collection for the whole board, grouped by card - the card
  // export's own per-card queries would be one round trip per card per section.
  async _getBoardData() {
    const board = await ReactiveCache.getBoard(this._boardId);
    if (!board) return null;

    const lists = await ReactiveCache.getLists(
      { boardId: this._boardId, archived: false }, { sort: { sort: 1 } });
    const swimlanes = await ReactiveCache.getSwimlanes(
      { boardId: this._boardId, archived: false }, { sort: { sort: 1 } });
    const cardSelector = { boardId: this._boardId, archived: false, linkedId: { $in: ['', null] } };
    if (this._swimlaneId) cardSelector.swimlaneId = this._swimlaneId;
    if (this._listId) cardSelector.listId = this._listId;
    const cards = await ReactiveCache.getCards(cardSelector, { sort: { sort: 1 } });
    const cardIds = cards.map(card => card._id);

    const group = (rows, key) => {
      const map = {};
      for (const row of rows || []) {
        const id = key === 'meta.cardId' ? (row.meta && row.meta.cardId) : row[key];
        if (!id) continue;
        (map[id] = map[id] || []).push(row);
      }
      return map;
    };

    const checklists = this.hasField('checklists')
      ? await ReactiveCache.getChecklists({ cardId: { $in: cardIds } }, { sort: { sort: 1 } })
      : [];
    const checklistItems = this.hasField('checklists')
      ? await ReactiveCache.getChecklistItems(
        { checklistId: { $in: checklists.map(c => c._id) } }, { sort: { sort: 1 } })
      : [];
    const subtasks = this.hasField('subtasks')
      ? await ReactiveCache.getCards({ boardId: this._boardId, parentId: { $in: cardIds } }, { sort: { sort: 1 } })
      : [];
    const comments = this.hasField('comments')
      ? await ReactiveCache.getCardComments({ cardId: { $in: cardIds } }, { sort: { createdAt: 1 } })
      : [];
    const attachments = this.hasField('attachments')
      ? await ReactiveCache.getAttachments({ 'meta.cardId': { $in: cardIds } }, { sort: { uploadedAt: -1 } })
      : [];

    const customFieldsById = {};
    if (this.hasField('custom-fields')) {
      const ids = [...new Set(cards.flatMap(card =>
        (card.customFields || []).map(f => f && f._id).filter(Boolean)))];
      if (ids.length) {
        const definitions = await ReactiveCache.getCustomFields({ _id: { $in: ids } });
        (definitions || []).forEach(d => { customFieldsById[d._id] = d; });
      }
    }

    // Usernames, once for the whole board. The card export keys its people off
    // the same map, so the names read the same in both.
    const userIds = new Set((board.members || []).map(m => m.userId));
    for (const card of cards) {
      if (card.userId) userIds.add(card.userId);
      (card.members || []).forEach(id => userIds.add(id));
      (card.assignees || []).forEach(id => userIds.add(id));
      (card.requesters || []).forEach(id => userIds.add(id));
      (card.assigners || []).forEach(id => userIds.add(id));
      ((card.vote && card.vote.positive) || []).forEach(id => userIds.add(id));
      ((card.vote && card.vote.negative) || []).forEach(id => userIds.add(id));
    }
    comments.forEach(c => c.userId && userIds.add(c.userId));
    attachments.forEach(a => {
      const uploader = a.userId || (a.meta && a.meta.userId);
      if (uploader) userIds.add(uploader);
    });
    const userMap = {};
    const users = await ReactiveCache.getUsers(
      { _id: { $in: [...userIds].filter(Boolean) } },
      { fields: { _id: 1, username: 1 } });
    (users || []).forEach(u => { userMap[u._id] = u.username; });

    return {
      board,
      listNumber: this._listId
        ? lists.findIndex(list => String(list._id) === String(this._listId)) + 1 : 0,
      swimlaneNumber: this._swimlaneId
        ? swimlanes.filter(swimlane => swimlane.type !== 'template-swimlane')
          .findIndex(swimlane => String(swimlane._id) === String(this._swimlaneId)) + 1 : 0,
      lists: this._listId ? lists.filter(list => list._id === this._listId) : lists,
      swimlanes: this._swimlaneId
        ? swimlanes.filter(swimlane => swimlane._id === this._swimlaneId)
        : swimlanes,
      cards,
      userMap,
      customFieldsById,
      checklistsByCard: group(checklists, 'cardId'),
      checklistItems,
      subtasksByCard: group(subtasks, 'parentId'),
      commentsByCard: group(comments, 'cardId'),
      attachmentsByCard: group(attachments, 'meta.cardId'),
    };
  }

  async build(res) {
    try {
      await this._buildAndWrite(res);
    } catch (err) {
      console.error('ExporterExcelBoard: build error', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`Export failed: ${err.message}`);
      }
    }
  }

  async _buildAndWrite(res) {
    const data = await this._getBoardData();
    if (!data) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Board not found');
      return;
    }

    const { board, lists, swimlanes, cards, userMap } = data;
    // What this export IS: the board, or the one swimlane or list it was asked
    // for. A file called "My board.xlsx" that holds one list is a file nobody
    // can find again.
    const scopeTitle = this._listId
      ? `${board.title} - ${(lists[0] && lists[0].title) || this.__('list')}`
      : (this._swimlaneId
        ? `${board.title} - ${(swimlanes[0] && swimlanes[0].title) || this.__('swimlane')}`
        : board.title);

    const workbook = createWorkbook();
    workbook.creator = this.__('export-board');
    workbook.created = new Date();
    workbook.modified = new Date();

    const ws = workbook.addWorksheet(sanitizeSheetName(scopeTitle), {
      pageSetup: {
        paperSize: 9,               // A4
        orientation: 'portrait',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
      },
    });

    // The card export's own 6-column geometry, so a card block lands in the
    // columns it was drawn for.
    ws.columns = [
      { key: 'a', width: 18 }, { key: 'b', width: 30 },
      { key: 'c', width: 18 }, { key: 'd', width: 30 },
      { key: 'e', width: 18 }, { key: 'f', width: 30 },
    ];

    const fontName = this.__('excel-font');
    const thinBdr = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' },
    };
    const fillGray = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };

    let row = 1;
    const pageBreaks = [];

    const mergedRow = (value, opts = {}) => {
      ws.mergeCells(`A${row}:F${row}`);
      const cell = ws.getCell(`A${row}`);
      cell.value = value;
      cell.font = Object.assign({ name: fontName, size: 10 }, opts.font || {});
      cell.alignment = Object.assign(
        { vertical: 'middle', horizontal: 'left', wrapText: true }, opts.alignment || {});
      if (opts.fill) cell.fill = opts.fill;
      if (opts.border) cell.border = opts.border;
      ws.getRow(row).height = opts.height || 20;
      row += 1;
    };

    const labelValue = (label, value) => {
      const lc = ws.getCell(`A${row}`);
      lc.value = `${label}:`;
      lc.font = { name: fontName, size: 10, bold: true };
      lc.alignment = { vertical: 'middle', horizontal: 'right' };
      lc.border = thinBdr;
      ws.mergeCells(`B${row}:F${row}`);
      const vc = ws.getCell(`B${row}`);
      vc.value = value;
      vc.font = { name: fontName, size: 10 };
      vc.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      vc.border = thinBdr;
      ws.getRow(row).height = 20;
      row += 1;
    };

    // Start at the level requested: Board -> Swimlane -> List -> Card. A
    // smaller export does not repeat ancestors that are outside its scope.
    const scopeHeading = this._listId
      ? `${this.__('list')}: ${(lists[0] && lists[0].title) || this.__('list')}`
      : (this._swimlaneId
        ? `${this.__('swimlane')}: ${(swimlanes[0] && swimlanes[0].title) || this.__('swimlane')}`
        : board.title);
    mergedRow(scopeHeading || '', {
      font: { name: fontName, size: 16, bold: true }, height: 40,
    });
    if (!this._listId && !this._swimlaneId && this.hasField('board-header')) {
      const memberNames = (board.members || [])
        .map(member => userMap[member.userId] || member.userId)
        .filter(Boolean).join(', ');
      labelValue(this.__('members'), memberNames);
      labelValue(this.__('createdAt'), this.fmtDate(board.createdAt));
      labelValue(this.__('modifiedAt'), this.fmtDate(board.modifiedAt));
      if (board.description) labelValue(this.__('description'), board.description);
      row += 1;
    }

    // ── Every card, in the CARD export's layout ──────────────────────────
    if (this.hasField('card-details')) {
      const listById = Object.fromEntries(lists.map(list => [list._id, list]));
      const swimlaneById = Object.fromEntries(swimlanes.map(sl => [sl._id, sl]));
      // One renderer, reused: it holds the language, the zone, the date format
      // and the field selection, and draws a block wherever it is told to.
      const renderer = new ExporterExcelCard(
        this._boardId, null, null, this.userLanguage,
        this._fields ? [...this._fields] : null, this.dateFormat, this.timezone);

      const named = swimlanes.filter(sl => sl && sl.type !== 'template-swimlane');
      // A list export starts at List and contains its cards. Board and swimlane
      // exports retain the visible Swimlane -> List -> Card hierarchy even when
      // the board has only one swimlane.
      const groups = this._listId
        ? [{ swimlane: null, title: null }]
        : (named.length
          ? named.map(sl => ({ swimlane: sl, title: sl.title || this.__('swimlane') }))
          : [{ swimlane: null, title: this.__('swimlane') }]);

      for (const group of groups) {
        if (group.title && !this._swimlaneId) {
          mergedRow(`${this.__('swimlane')}: ${group.title}`, {
            font: { name: fontName, size: 12, bold: true }, fill: fillGray, height: 22,
          });
        }
        for (const list of lists) {
          const listCards = cards.filter(card =>
            String(card.listId) === String(list._id)
            && (!group.swimlane || String(card.swimlaneId) === String(group.swimlane._id)));
          if (!this._listId) {
            mergedRow(`${this.__('list')}: ${list.title || this.__('list')} (${listCards.length})`, {
              font: { name: fontName, size: 11, bold: true }, fill: fillGray, height: 20,
            });
          }

          for (const card of listCards) {
            // Each card starts on its own page: a printed board is read a card
            // at a time, which is the whole point of #1173.
            if (row > 2) pageBreaks.push(row - 1);
            const result = await renderer.renderCardBlock(ws, workbook, row, {
              card,
              board,
              list: listById[card.listId] || list,
              swimlane: swimlaneById[card.swimlaneId] || group.swimlane,
              userMap,
              creatorName: userMap[card.userId] || '',
              ownerName: (card.members && card.members.length
                ? userMap[card.members[0]] : userMap[card.userId]) || '',
              memberNames: (card.members || []).map(id => userMap[id] || id).join(', '),
              assigneeNames: (card.assignees || []).map(id => userMap[id] || id).join(', '),
              checklists: data.checklistsByCard[card._id] || [],
              checklistItems: data.checklistItems,
              subtasks: data.subtasksByCard[card._id] || [],
              comments: data.commentsByCard[card._id] || [],
              attachments: data.attachmentsByCard[card._id] || [],
              customFieldsById: data.customFieldsById,
            });
            row = result.row + 1;
            pageBreaks.push(...result.pageBreakRows);
          }
        }
      }
    }

    if (pageBreaks.length > 0) {
      ws.pageSetup.rowBreaks = [...new Set(pageBreaks)].map(r => ({ man: 1, id: r }));
    }

    const type = this._listId ? 'list' : (this._swimlaneId ? 'swimlane' : 'board');
    const identity = this._listId ? data.listNumber
      : (this._swimlaneId ? data.swimlaneNumber : board.title);
    const filename = exportFilename(type, key => this.__(key), identity || 1, 'xlsx');
    res.setHeader('Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', attachmentDisposition(filename));
    await workbook.xlsx.write(res);
    res.end();
  }
}

export { ExporterExcelBoard };
