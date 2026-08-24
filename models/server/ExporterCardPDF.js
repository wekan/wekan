import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { formatDateByUserPreference } from '/imports/lib/dateUtils';
import { BOARD_EXPORT_FIELD_KEYS } from '/models/lib/exportFields';
import { fileStoreStrategyFactory } from '/models/attachments.server';
// The layout, described once for both formats, and what a page makes of it.
import {
  buildExportCardDocument,
  formatExportFileSize,
} from '/models/lib/cardExportDocument';
import {
  documentToLines,
  wrapTextBlock,
  wrapRichTextBlock,
  line,
  buildPdfBuffer,
} from '/models/lib/pdfDocument';
import { buildUnicodePdf } from '/models/server/buildUnicodePdf';
import { attachmentDisposition, exportFilename } from '/models/lib/exportFilename';

async function unicodeFonts() {
  return {
    main: await Assets.getBinaryAsync('fonts/unifont/unifont-17.0.05.otf'),
    upper: await Assets.getBinaryAsync('fonts/unifont/unifont_upper-17.0.05.otf'),
  };
}

// #6586: the PDF itself - encoding, markdown, wrapping, pagination - lives in
// models/lib/pdfDocument.js, where it can be tested against the bytes a reader's
// viewer sees. This file decides WHAT a card and a board export say.
//
// The reopened half of that report is about exactly this file:
//
//   "Assignee, Labels, due,... these titels should be in the user set language"
//   "There is 'Assignee: ', 'Labels:' and then 'due' (lowercase letter and no ':')"
//   "I think all those other things we set in a card should be also present"
//   "the time is not in the user set timezone (-2h wrong for Europe/Berlin)"
//
// So every label goes through `__()` in the requesting user's language, both
// exports build their labels from the SAME i18n keys - which is what makes the
// board export's "due" become "Due:" like the card export's, rather than being
// fixed twice and drifting again - dates are formatted in the browser's own time
// zone, and the card export carries the rest of what a card holds.

// A card's dates are stored in UTC, and printing them in the SERVER's zone is
// what "-2h wrong for Europe/Berlin" was: 14:00 in Berlin left the server as
// 12:00, and a server started with another TZ would have printed a third time.
// The zone is the browser's own IANA name, sent by the export link, because
// WeKan stores no timezone on a profile.
//
// The formatter is the one the Excel card export uses
// (imports/lib/dateUtils.js), and the FORMAT is the reader's own
// `profile.dateFormat`, so the same card exported twice cannot come out with two
// different dates on it. Without a zone it renders UTC and says UTC - which is
// honest, and does not depend on how the server happens to be started.
function formatDateValue(value, timezone, dateFormat) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return '-';
  }

  const zone = timezone || 'UTC';
  const formatted = formatDateByUserPreference(value, dateFormat || 'YYYY-MM-DD', true, zone);
  if (!formatted) return '-';
  return timezone ? formatted : `${formatted} UTC`;
}

function formatUser(user) {
  if (!user) {
    return 'Unknown';
  }

  return user.profile?.fullname || user.username || user.profile?.initials || user._id;
}

// A custom field's value can be a string, a number, a boolean, a date or a list
// of strings (a dropdown's selection is an item id, resolved by the caller).
function formatCustomFieldValue(value, timezone, dateFormat) {
  if (value === null || value === undefined || value === '') return '-';
  if (value instanceof Date) return formatDateValue(value, timezone, dateFormat);
  if (Array.isArray(value)) return value.length ? value.join(', ') : '-';
  if (typeof value === 'boolean') return value ? 'x' : '-';
  return String(value);
}

const PDF_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png']);

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(Buffer.from(chunk)));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

// Read only image formats the dependency-free PDF writer can embed. A missing,
// remote or corrupt object remains in the attachment list; it must never make
// the rest of the card unexportable.
async function attachmentImages(attachments) {
  const images = [];
  for (const attachment of attachments || []) {
    const type = String(attachment.type || '').toLowerCase();
    if (!PDF_IMAGE_TYPES.has(type)) continue;
    try {
      const strategy = fileStoreStrategyFactory.getFileStrategy(attachment, 'original');
      const stream = strategy && strategy.getReadStream();
      if (!stream) continue;
      const data = await streamToBuffer(stream);
      if (data.length) images.push({
        name: attachment.name || (attachment.meta && attachment.meta.name) || attachment._id,
        size: formatExportFileSize(attachment.size),
        type,
        data,
      });
    } catch (error) {
      console.warn(`ExporterCardPDF: could not read image ${attachment._id}: ${error.message}`);
    }
  }
  return images;
}

// Shared by both exporters, so a label cannot say one thing on a card and another
// on the board it is in. The English text is the fallback for every key, so a
// language that has not translated one shows the word rather than the key.
// "Only those fields that have data should be added". The judgement of what is
// empty lives in models/lib/cardDocument.js and the Excel export asks the same
// function, so a PDF and a spreadsheet of one card contain the same sections.
const { hasSectionData } = require('/models/lib/cardDocument');

class PDFExporterBase {
  constructor(userLanguage, timezone, dateFormat, fields) {
    this.userLanguage = userLanguage || 'en';
    this.timezone = timezone || '';
    this.dateFormat = dateFormat || 'YYYY-MM-DD';
    // #1173: the same `?fields=` the Excel exports read, so the popup's
    // checkboxes mean the same thing whichever format is downloaded. No
    // selection means everything.
    this._fields = fields && fields.length > 0
      ? new Set(fields)
      : new Set(BOARD_EXPORT_FIELD_KEYS);
  }

  hasField(key) { return this._fields.has(key); }

  __(key, fallback) {
    try {
      const translated = TAPi18n.__(key, '', this.userLanguage);
      if (translated && translated !== key) return translated;
    } catch (error) {
      // A missing bundle is not a reason to fail an export.
    }
    return fallback;
  }

  // "Label: value", once, so every caller gets the same colon and spacing - the
  // reported "there is 'Assignee: ', 'Labels:' and then 'due'".
  field(key, fallback, value) {
    return `${this.__(key, fallback)}: ${value === '' || value === undefined || value === null ? '-' : value}`;
  }

  date(value) {
    return formatDateValue(value, this.timezone, this.dateFormat);
  }

  // The vote as a reader can check it: the question, who was for and against, and
  // when it closes. Counts alone would not say who, which is the part a printed
  // card is kept for.
  _voteLines(card, usersById) {
    const vote = card.vote;
    if (!vote || (!vote.question && !(vote.positive || []).length && !(vote.negative || []).length)) {
      return [];
    }

    // The same six values the Excel export's Voting section carries, in the same
    // order and from the same keys.
    const names = ids => (ids || []).map(id => formatUser(usersById[id])).join(', ') || '-';
    const yesNo = value => (value ? this.__('yes', 'Yes') : this.__('no', 'No'));
    return [
      '',
      line(`${this.__('voting', 'Voting')}:`, true),
      this.field('vote-question', 'Voting question', vote.question || '-'),
      this.field('vote-public', 'Show who voted what', yesNo(vote.public)),
      this.field('card-end', 'End', this.date(vote.end)),
      this.field('vote-for-it', 'for it', (vote.positive || []).length),
      this.field('vote-against', 'against', (vote.negative || []).length),
      this.field('positiveVoteMembersPopup-title', 'Proponents', names(vote.positive)),
      this.field('negativeVoteMembersPopup-title', 'Opponents', names(vote.negative)),
    ];
  }

  // Planning Poker keeps its estimation and its deadline; the per-value member
  // lists are a board-side detail and would be a page of ids here.
  _pokerLines(card) {
    const poker = card.poker;
    if (!poker || (poker.estimation === undefined && !poker.end)) return [];

    const lines = ['', line(`${this.__('poker-question', 'Planning Poker')}:`, true)];
    lines.push(this.field('set-estimation', 'Set Estimation', poker.estimation ?? '-'));
    if (poker.end) lines.push(this.field('card-end', 'End', this.date(poker.end)));
    return lines;
  }

  // ONE CARD, as the card export draws it. The board export calls this too, so
  // "what a card looks like when it is exported" is written once (#1173): a
  // board's PDF is its cards in the card export's own layout, not a second,
  // thinner rendering of the same data.
  // A custom field's value as words. A dropdown stores the id of its item,
  // which says nothing on paper - the same translation the Excel exporter does.
  customFieldValue(definition, value) {
    let out = value;
    if (definition && definition.type === 'dropdown') {
      const item = ((definition.settings && definition.settings.dropdownItems) || [])
        .find(entry => entry && entry._id === value);
      if (item) out = item.name;
    }
    return formatCustomFieldValue(out, this.timezone, this.dateFormat);
  }

  cardBlockLines(data) {
    // ONE CARD, drawn from the SHARED document (models/lib/cardDocument.js).
    //
    // This method used to lay the card out itself - a hundred and sixty lines
    // that had to be kept in step, by hand, with the Excel exporter's layout.
    // They were not: the Excel export drew sections under filled headers with
    // label/value columns, and this drew a flat list of monospaced lines. Now
    // both ask for the same document and only the drawing differs, so a section
    // added to one is in the other.
    //
    // What is left here is the MAPPING: turning what this exporter has loaded -
    // Meteor documents, user ids, dates - into the plain names and strings the
    // document takes. That is this file's own business, and it is the only part
    // that knows a Mongo document from a string.
    return documentToLines(this.cardDocumentFrom(data), {
      attachmentHeadings: [
        '#', this.__('name', 'Name'), this.__('size', 'Size'), this.__('type', 'Type'),
        this.__('export-card-attachment-uploaded-at', 'Uploaded At'),
        this.__('export-card-attachment-uploaded-by', 'Uploaded By'),
      ],
    });
  }

  // The card, and the rows that belong to it, as the shared document's `data`.
  cardDocumentFrom(data) {
    return buildExportCardDocument(data, {
      fields: [...this._fields],
      userName: id => formatUser((data.usersById || {})[id]),
      formatDate: value => this.date(value),
      customFieldValue: (definition, value) => this.customFieldValue(definition, value),
      translate: (key, fallback) => this.__(key, fallback),
    });
  }

}

class ExporterCardPDF extends PDFExporterBase {
  constructor(boardId, listId, cardId, userLanguage, timezone, dateFormat, fields) {
    super(userLanguage, timezone, dateFormat, fields);
    this._boardId = boardId;
    this._listId = listId;
    this._cardId = cardId;
  }

  async _getCardData() {
    const board = await ReactiveCache.getBoard(this._boardId);
    const list = await ReactiveCache.getList({
      _id: this._listId,
      boardId: this._boardId,
    });
    const card = await ReactiveCache.getCard({
      _id: this._cardId,
      boardId: this._boardId,
      listId: this._listId,
    });

    if (!board || !list || !card) {
      return null;
    }

    const swimlane = card.swimlaneId
      ? await ReactiveCache.getSwimlane({ _id: card.swimlaneId })
      : null;
    const checklists = await ReactiveCache.getChecklists(
      { cardId: this._cardId },
      { sort: { sort: 1 } },
    );
    const comments = await ReactiveCache.getCardComments(
      { cardId: this._cardId },
      { sort: { createdAt: 1 } },
    );

    const checklistItemsByChecklistId = {};
    for (const checklist of checklists) {
      checklistItemsByChecklistId[checklist._id] = await ReactiveCache.getChecklistItems(
        { checklistId: checklist._id },
        { sort: { sort: 1 } },
      );
    }

    // "I think all those other things we set in a card should be also present in
    // the pdf? Location, Voting, Checklists, Subtasks, Custom Fields,
    // Attachments, Comments,...?" - the three that were not fetched at all.
    const subtasks = await ReactiveCache.getCards(
      { boardId: this._boardId, parentId: this._cardId },
      { sort: { sort: 1 } },
    );
    const attachments = await ReactiveCache.getAttachments(
      { 'meta.cardId': this._cardId },
      { sort: { uploadedAt: 1 } },
    );
    const images = await attachmentImages(attachments);
    const customFieldIds = (card.customFields || [])
      .map(field => field && field._id)
      .filter(Boolean);
    const customFieldsById = {};
    if (customFieldIds.length) {
      const definitions = await ReactiveCache.getCustomFields({
        _id: { $in: customFieldIds },
      });
      for (const definition of definitions || []) {
        customFieldsById[definition._id] = definition;
      }
    }

    const userIds = new Set([
      card.userId,
      ...(card.members || []),
      ...(card.assignees || []),
      ...(card.requesters || []),
      ...(card.assigners || []),
      ...comments.map(comment => comment.userId),
      ...attachments.map(attachment => attachment.userId
        || (attachment.meta && attachment.meta.userId)),
      ...((card.vote && card.vote.positive) || []),
      ...((card.vote && card.vote.negative) || []),
    ]);
    const usersById = {};

    await Promise.all(
      [...userIds]
        .filter(Boolean)
        .map(async userId => {
          usersById[userId] = await ReactiveCache.getUser({ _id: userId });
        }),
    );

    return {
      board,
      list,
      card,
      swimlane,
      checklists,
      checklistItemsByChecklistId,
      comments,
      subtasks,
      attachments,
      images,
      customFieldsById,
      usersById,
    };
  }

  async build(res) {
    const data = await this._getCardData();
    if (!data) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Card not found');
      return;
    }

    const lines = this.cardBlockLines(data);
    const filename = exportFilename(
      'card', key => this.__(key, key), data.card.cardNumber || 1, 'pdf');
    let pdf;
    try {
      pdf = await buildUnicodePdf(lines, await unicodeFonts());
    } catch (error) {
      console.error(`ExporterCardPDF: Unicode PDF failed, using base-font fallback: ${error.message}`);
      pdf = buildPdfBuffer(lines);
    }

    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': attachmentDisposition(filename),
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }

  async canExport(user) {
    const board = await ReactiveCache.getBoard(this._boardId);
    return board && board.isVisibleBy(user);
  }
}

// #395: board-level PDF export, written with the same document builder as the card
// export (models/lib/pdfDocument.js).
//
// #6586: it used to print MARKDOWN - "## List (3)" and "- Card title" - into a PDF,
// where a "##" is just two hash marks: "all the text in this PDF file is markdown
// formatted - this doesn't make sense in a pdf file, does it?" It does not. The
// structure is drawn instead: headings in the bold font, cards as bullets, and the
// card's own markdown rendered rather than reproduced.
//
// The same report asked for what was missing: "I can't see in which swimlane a card
// is in that export, no tags". So the board is walked SWIMLANE by swimlane (when it
// has more than the one every board is created with), and each card carries its
// labels, members, assignees and dates.
class ExporterBoardPDF extends PDFExporterBase {
  // `scope` is {swimlaneId} or {listId}: the same export restricted to one
  // swimlane or one list, because those menus offer it too (#1173).
  constructor(boardId, userLanguage, timezone, dateFormat, fields, scope = {}) {
    super(userLanguage, timezone, dateFormat, fields);
    this._boardId = boardId;
    this._swimlaneId = scope.swimlaneId || '';
    this._listId = scope.listId || '';
  }

  // Everything the board's cards need, in one pass per collection.
  //
  // The obvious way to write this is to ask for a card's checklists, items,
  // subtasks, comments and attachments as each card is drawn - which is what the
  // CARD export does, correctly, for its one card. A board with three hundred
  // cards would make fifteen hundred queries that way. So each collection is
  // read once for the whole board and grouped by card here.
  async _getBoardData() {
    const board = await ReactiveCache.getBoard(this._boardId);
    if (!board) return null;

    const lists = await ReactiveCache.getLists(
      { boardId: this._boardId, archived: false },
      { sort: { sort: 1 } },
    );
    const swimlanes = await ReactiveCache.getSwimlanes(
      { boardId: this._boardId, archived: false },
      { sort: { sort: 1 } },
    );
    const cardSelector = { boardId: this._boardId, archived: false };
    if (this._swimlaneId) cardSelector.swimlaneId = this._swimlaneId;
    if (this._listId) cardSelector.listId = this._listId;
    const cards = await ReactiveCache.getCards(cardSelector, { sort: { sort: 1 } });
    const cardIds = cards.map(card => card._id);

    const byCard = (rows, key = 'cardId') => {
      const map = {};
      for (const row of rows || []) {
        const id = row[key];
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
        { checklistId: { $in: checklists.map(checklist => checklist._id) } },
        { sort: { sort: 1 } })
      : [];
    const subtasks = this.hasField('subtasks')
      ? await ReactiveCache.getCards({ boardId: this._boardId, parentId: { $in: cardIds } }, { sort: { sort: 1 } })
      : [];
    const comments = this.hasField('comments')
      ? await ReactiveCache.getCardComments({ cardId: { $in: cardIds } }, { sort: { createdAt: 1 } })
      : [];
    const attachments = this.hasField('attachments')
      ? await ReactiveCache.getAttachments({ 'meta.cardId': { $in: cardIds } }, { sort: { uploadedAt: 1 } })
      : [];
    const imagesByCard = {};
    if (this.hasField('attachments')) {
      for (const attachment of attachments) {
        const cardId = attachment.meta && attachment.meta.cardId;
        if (!cardId) continue;
        const images = await attachmentImages([attachment]);
        if (images.length) (imagesByCard[cardId] = imagesByCard[cardId] || []).push(...images);
      }
    }

    const customFieldsById = {};
    if (this.hasField('custom-fields')) {
      const ids = [...new Set(cards.flatMap(card =>
        (card.customFields || []).map(field => field && field._id).filter(Boolean)))];
      if (ids.length) {
        const definitions = await ReactiveCache.getCustomFields({ _id: { $in: ids } });
        for (const definition of definitions || []) customFieldsById[definition._id] = definition;
      }
    }

    // Every person named anywhere in the export, resolved once.
    const userIds = new Set((board.members || []).map(member => member.userId));
    for (const card of cards) {
      if (card.userId) userIds.add(card.userId);
      (card.members || []).forEach(id => userIds.add(id));
      (card.assignees || []).forEach(id => userIds.add(id));
      (card.requesters || []).forEach(id => userIds.add(id));
      (card.assigners || []).forEach(id => userIds.add(id));
      ((card.vote && card.vote.positive) || []).forEach(id => userIds.add(id));
      ((card.vote && card.vote.negative) || []).forEach(id => userIds.add(id));
    }
    comments.forEach(comment => comment.userId && userIds.add(comment.userId));
    attachments.forEach(attachment => {
      const userId = attachment.userId || (attachment.meta && attachment.meta.userId);
      if (userId) userIds.add(userId);
    });
    const usersById = {};
    await Promise.all([...userIds].filter(Boolean).map(async userId => {
      usersById[userId] = await ReactiveCache.getUser({ _id: userId });
    }));

    const itemsByChecklist = byCard(checklistItems, 'checklistId');

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
      usersById,
      customFieldsById,
      checklistsByCard: byCard(checklists),
      itemsByChecklist,
      subtasksByCard: byCard(subtasks, 'parentId'),
      commentsByCard: byCard(comments),
      attachmentsByCard: (() => {
        const map = {};
        for (const attachment of attachments) {
          const id = attachment.meta && attachment.meta.cardId;
          if (!id) continue;
          (map[id] = map[id] || []).push(attachment);
        }
        return map;
      })(),
      imagesByCard,
    };
  }

  // The board's own header, before the cards: what the board IS, which the card
  // export shows per card and a board export should say once.
  _boardHeaderLines(data) {
    const { board, usersById, lists, swimlanes } = data;
    // What this export IS: the board, or the one swimlane or list it was asked
    // for - a PDF titled with the board that holds one list is a file nobody can
    // place afterwards.
    const scopeTitle = this._listId
      ? `${board.title} - ${(lists[0] && lists[0].title) || this.__('list', 'List')}`
      : (this._swimlaneId
        ? `${board.title} - ${(swimlanes[0] && swimlanes[0].title) || this.__('swimlane', 'Swimlane')}`
        : (board.title || 'Board'));
    this._scopeTitle = scopeTitle;
    const scopeHeading = this._listId
      ? this.field('list', 'List', (lists[0] && lists[0].title) || '-')
      : (this._swimlaneId
        ? this.field('swimlane', 'Swimlane', (swimlanes[0] && swimlanes[0].title) || '-')
        : scopeTitle);
    const lines = [line(scopeHeading, true), ''];
    if (this._listId || this._swimlaneId || !this.hasField('board-header')) return lines;

    const memberNames = (board.members || [])
      .map(member => formatUser(usersById[member.userId]))
      .filter(Boolean)
      .join(', ');
    lines.push(
      this.field('members', 'Members', memberNames || '-'),
      this.field('createdAt', 'Created at', this.date(board.createdAt)),
      this.field('modifiedAt', 'Modified at', this.date(board.modifiedAt)),
    );
    if (board.description) {
      lines.push('', line(`${this.__('description', 'Description')}:`, true));
      lines.push(...wrapRichTextBlock(board.description));
    }
    lines.push('');
    return lines;
  }

  async build(res) {
    const data = await this._getBoardData();
    if (!data) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Board not found');
      return;
    }

    const { board, lists, swimlanes, cards } = data;
    const lines = this._boardHeaderLines(data);

    const named = swimlanes.filter(swimlane => swimlane && swimlane.type !== 'template-swimlane');
    // Start at the selected level. A board keeps Swimlane -> List -> Card, a
    // swimlane keeps List -> Card, and a list contains its Card blocks.
    const groups = this._listId
      ? [{ swimlane: null, title: null }]
      : (named.length
        ? named.map(swimlane => ({
          swimlane, title: swimlane.title || this.__('swimlane', 'Swimlane'),
        }))
        : [{ swimlane: null, title: this.__('swimlane', 'Swimlane') }]);

    const listById = Object.fromEntries(lists.map(list => [list._id, list]));
    const swimlaneById = Object.fromEntries(swimlanes.map(swimlane => [swimlane._id, swimlane]));

    for (const group of groups) {
      if (group.title && !this._swimlaneId) {
        lines.push(line(this.field('swimlane', 'Swimlane', group.title), true), '');
      }
      for (const list of lists) {
        const listCards = cards.filter(card =>
          String(card.listId) === String(list._id)
          && (!group.swimlane || String(card.swimlaneId) === String(group.swimlane._id)));
        if (!this._listId) {
          lines.push(line(
            this.field('list', 'List', `${list.title || this.__('list', 'List')} (${listCards.length})`),
            true,
          ), '');
        }

        // #1173: every card in the CARD export's own layout, drawn by the card
        // export's own code - a board export used to be a thinner rendering of
        // the same cards, which is how it ended up saying "due" where the card
        // export said "Due:" and leaving out half of what a card holds.
        for (const card of listCards) {
          lines.push(...this.cardBlockLines({
            board,
            list: listById[card.listId] || list,
            card,
            swimlane: swimlaneById[card.swimlaneId] || group.swimlane,
            checklists: data.checklistsByCard[card._id] || [],
            checklistItemsByChecklistId: data.itemsByChecklist,
            comments: data.commentsByCard[card._id] || [],
            subtasks: data.subtasksByCard[card._id] || [],
            attachments: data.attachmentsByCard[card._id] || [],
            images: data.imagesByCard[card._id] || [],
            customFieldsById: data.customFieldsById,
            usersById: data.usersById,
          }));
          // One blank line between cards: the card block already ends with its
          // last section, and a page break per card would waste paper on a board
          // of one-line cards.
          lines.push('', '');
        }
      }
    }

    let pdf;
    try {
      pdf = await buildUnicodePdf(lines, await unicodeFonts());
    } catch (error) {
      console.error(`ExporterBoardPDF: Unicode PDF failed, using base-font fallback: ${error.message}`);
      pdf = buildPdfBuffer(lines);
    }
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': attachmentDisposition(exportFilename(
        this._listId ? 'list' : (this._swimlaneId ? 'swimlane' : 'board'),
        key => this.__(key, key),
        this._listId ? (data.listNumber || 1)
          : (this._swimlaneId ? (data.swimlaneNumber || 1) : board.title),
        'pdf',
      )),
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }

  async canExport(user) {
    const board = await ReactiveCache.getBoard(this._boardId);
    return board && board.isVisibleBy(user);
  }
}

export { ExporterCardPDF, ExporterBoardPDF };
