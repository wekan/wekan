import { ReactiveCache } from '/imports/reactiveCache';
import Boards from '/models/boards';
import Swimlanes from '/models/swimlanes';
import Lists from '/models/lists';
import Cards from '/models/cards';
import CardComments from '/models/cardComments';
import Checklists from '/models/checklists';
import ChecklistItems from '/models/checklistItems';
import CustomFields from '/models/customFields';
import { sortsAfter } from '/models/lib/insertPosition';
import { CARD_EXPORT_FIELD_KEYS } from '/models/lib/exportFields';

// Import a WeKan export INTO an existing board, beside the thing whose menu it
// was started from (#1173).
//
// The board importer creates a whole new board from a document. This does the
// other half: a swimlane's menu imports a swimlane BELOW that swimlane, a list's
// menu imports a list after it, a card's menu imports a card below it - into the
// board that is already open, with what is already in it left where it is.
//
// It reads the same document the export writes - `wekan-board-1.0.0`, whatever
// scope it was exported at - so exporting a list and importing it into another
// board is one round trip and not a conversion. It obeys the same `fields`
// selection, and on this side that selection means WHAT TO BRING IN: a document
// full of comments imported with `comments` unticked brings the cards and leaves
// the comments behind.
//
// What it does NOT do is merge. Everything it creates is new, with new ids: an
// import is never an edit of what is already there, so importing the same file
// twice gives two copies rather than a half-updated board nobody can undo.

const isPlainObject = value =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

class ScopedImporter {
  // target: { boardId, swimlaneId?, listId?, cardId? } - what the menu was
  // opened on. The kind of target decides what is imported and where it goes.
  constructor(target, doc, options = {}) {
    this._target = target || {};
    this._doc = doc || {};
    this._userId = options.userId;
    this._fields = options.fields && options.fields.length > 0
      ? new Set(options.fields)
      : null;
    // #1173: given by the .zip upload route - a function that opens a read
    // stream for one attachment, so a large file is piped from the archive
    // instead of arriving as base64 in the document.
    this._attachmentStream = options.attachmentStream || null;
    // Old id -> new id, so a card's checklists and comments find it again.
    this._cardIdMap = {};
    // Where each new card landed, so an attachment's meta points at the list and
    // swimlane it is in NOW rather than the ones it was exported from.
    this._cardListId = {};
    this._cardSwimlaneId = {};
    this._listIdMap = {};
    this._swimlaneIdMap = {};
    this._counts = {
      swimlanes: 0, lists: 0, cards: 0, checklists: 0, comments: 0, attachments: 0,
    };
  }

  hasField(key) { return this._fields === null || this._fields.has(key); }

  _now() { return new Date(); }

  // The document's arrays, defensively: a hand-edited file is a file somebody
  // will import, and an undefined `cards` should not be a stack trace.
  _rows(key) {
    const value = this._doc[key];
    return Array.isArray(value) ? value : [];
  }

  async run() {
    const board = await ReactiveCache.getBoard(this._target.boardId);
    if (!board) throw new Meteor.Error('board-not-found', 'Board not found');

    if (this._target.cardId) await this._importCards(board);
    else if (this._target.listId) await this._importLists(board);
    else if (this._target.swimlaneId) await this._importSwimlanes(board);
    else await this._importSwimlanes(board);

    return this._counts;
  }

  // ── swimlanes ─────────────────────────────────────────────────────────────
  async _importSwimlanes(board) {
    const swimlanes = this._rows('swimlanes');
    if (!swimlanes.length) {
      // A document with no swimlane of its own still has cards to place; put
      // them in the swimlane whose menu was used, or the board's first.
      await this._importLists(board);
      return;
    }

    const existing = await ReactiveCache.getSwimlanes({ boardId: board._id });
    const target = this._target.swimlaneId
      ? existing.find(swimlane => swimlane._id === this._target.swimlaneId)
      : null;
    const sorts = sortsAfter(
      existing.map(swimlane => swimlane.sort),
      target ? target.sort : undefined,
      swimlanes.length,
    );

    for (const [index, swimlane] of swimlanes.entries()) {
      const newId = await Swimlanes.direct.insertAsync({
        archived: false,
        boardId: board._id,
        createdAt: this._now(),
        updatedAt: this._now(),
        title: swimlane.title || 'Swimlane',
        sort: sorts[index],
        ...(swimlane.color ? { color: swimlane.color } : {}),
        ...(swimlane.type ? { type: swimlane.type } : {}),
      });
      this._swimlaneIdMap[swimlane._id] = newId;
      this._counts.swimlanes += 1;
    }

    await this._importLists(board);
  }

  // ── lists ─────────────────────────────────────────────────────────────────
  async _importLists(board) {
    const lists = this._rows('lists');
    const existing = await ReactiveCache.getLists({ boardId: board._id });

    // A swimlane import brings its cards' lists with it, and those lists are
    // usually the board's own - matching by TITLE keeps the cards in the columns
    // they were in instead of adding a second "Doing" beside the first.
    const byTitle = new Map(existing.map(list => [String(list.title || ''), list._id]));

    const target = this._target.listId
      ? existing.find(list => list._id === this._target.listId)
      : null;

    // Only the lists that are not already here get created, and only a LIST
    // import places them relative to the target - a swimlane import is about
    // rows, not columns.
    const toCreate = lists.filter(list =>
      !byTitle.has(String(list.title || '')) || Boolean(this._target.listId));
    const sorts = sortsAfter(
      existing.map(list => list.sort),
      target ? target.sort : undefined,
      toCreate.length,
    );

    let created = 0;
    for (const list of lists) {
      const title = String(list.title || 'List');
      if (!this._target.listId && byTitle.has(title)) {
        this._listIdMap[list._id] = byTitle.get(title);
        continue;
      }
      const newId = await Lists.direct.insertAsync({
        archived: false,
        boardId: board._id,
        createdAt: this._now(),
        updatedAt: this._now(),
        title,
        sort: sorts[created],
        ...(list.color ? { color: list.color } : {}),
        ...(typeof list.width === 'number' ? { width: list.width } : {}),
        ...(typeof list.collapsed === 'boolean' ? { collapsed: list.collapsed } : {}),
      });
      this._listIdMap[list._id] = newId;
      this._counts.lists += 1;
      created += 1;
    }

    await this._importCards(board);
  }

  // ── cards ─────────────────────────────────────────────────────────────────
  async _importCards(board) {
    const cards = this._rows('cards');
    if (!cards.length) return;

    // Where a card lands when the document does not say, or says something this
    // board does not have: the list and swimlane the menu was opened in.
    const targetCard = this._target.cardId
      ? await ReactiveCache.getCard(this._target.cardId)
      : null;
    const fallbackListId = this._target.listId
      || (targetCard && targetCard.listId)
      || (await ReactiveCache.getLists({ boardId: board._id }, { sort: { sort: 1 } }))[0]?._id;
    const fallbackSwimlaneId = this._target.swimlaneId
      || (targetCard && targetCard.swimlaneId)
      || (await ReactiveCache.getSwimlanes({ boardId: board._id }, { sort: { sort: 1 } }))[0]?._id;

    // A card import goes BELOW the card whose menu was used; everything else
    // lands at the end of the list it belongs to.
    const siblings = await ReactiveCache.getCards({
      boardId: board._id,
      listId: fallbackListId,
      swimlaneId: fallbackSwimlaneId,
      archived: false,
    });
    const sorts = sortsAfter(
      siblings.map(card => card.sort),
      targetCard ? targetCard.sort : undefined,
      cards.length,
    );

    const customFieldMap = await this._customFieldMap(board);

    for (const [index, card] of cards.entries()) {
      const listId = this._listIdMap[card.listId] || fallbackListId;
      const swimlaneId = this._swimlaneIdMap[card.swimlaneId] || fallbackSwimlaneId;
      if (!listId || !swimlaneId) continue;

      const toCreate = {
        archived: false,
        boardId: board._id,
        listId,
        swimlaneId,
        title: card.title || '',
        sort: sorts[index],
        createdAt: this._now(),
        dateLastActivity: this._now(),
        userId: this._userId,
        labelIds: [],
        members: [],
        assignees: [],
      };
      if (this.hasField('description') && card.description) {
        toCreate.description = card.description;
      }
      // Who asked for the card and who assigned it: exported with it, so
      // imported with it. `people` is the section they belong to.
      if (this.hasField('people')) {
        if (card.requestedBy) toCreate.requestedBy = card.requestedBy;
        if (card.assignedBy) toCreate.assignedBy = card.assignedBy;
        const boardMemberIds = new Set((board.members || []).map(member => member.userId));
        toCreate.requesters = (card.requesters || []).filter(userId => boardMemberIds.has(userId));
        toCreate.assigners = (card.assigners || []).filter(userId => boardMemberIds.has(userId));
      }
      if (this.hasField('dates')) {
        for (const key of ['receivedAt', 'startAt', 'dueAt', 'endAt']) {
          if (card[key]) toCreate[key] = new Date(card[key]);
        }
        if (typeof card.spentTime === 'number') toCreate.spentTime = card.spentTime;
        if (typeof card.isOvertime === 'boolean') toCreate.isOvertime = card.isOvertime;
      }
      if (this.hasField('voting') && isPlainObject(card.vote)) toCreate.vote = card.vote;
      if (this.hasField('poker') && isPlainObject(card.poker)) toCreate.poker = card.poker;
      if (this.hasField('custom-fields') && Array.isArray(card.customFields)) {
        const mapped = card.customFields
          .map(field => {
            const newId = customFieldMap[field && field._id];
            return newId ? { _id: newId, value: field.value } : null;
          })
          .filter(Boolean);
        if (mapped.length) toCreate.customFields = mapped;
      }

      const newCardId = await Cards.direct.insertAsync(toCreate);
      this._cardIdMap[card._id] = newCardId;
      this._cardListId[newCardId] = listId;
      this._cardSwimlaneId[newCardId] = swimlaneId;
      this._counts.cards += 1;
    }

    await this._importChecklists();
    await this._importComments();
    await this._importAttachments();
  }

  // The FILES, from the same document. A WeKan export carries each attachment's
  // bytes as base64 under `file` (or, for an old export, a `url` to fetch), and
  // a .zip carries them as files beside the document - the client puts those
  // back on the same `file` field before calling, so there is one path here.
  //
  // This is the board importer's own approach (models/wekanCreator.js): the
  // server-side Meteor-Files `writeAsync`, one attachment at a time, and a
  // failure on one attachment must never abort the rest of the import - a card
  // that arrives without one of its files is worth more than no import at all.
  async _importAttachments() {
    if (!this.hasField('attachments')) return;
    const rows = this._rows('attachments');
    if (!rows.length) return;

    // Default export, like models/wekanCreator.js imports it.
    const Attachments = require('/models/attachments').default;
    for (const attachment of rows) {
      const cardId = this._cardIdMap[attachment.cardId];
      if (!cardId) continue;
      try {
        // A stream if the caller has one: nothing is held whole in memory, and
        // `addFile` underneath it fires the collection's onAfterUpload, so the
        // file lands in the default storage configured in the Admin Panel just
        // as an ordinary upload does.
        if (this._attachmentStream) {
          const stream = this._attachmentStream(attachment);
          if (stream) {
            const { addAttachmentFromStream } = require('/models/lib/fileStoreStrategy');
            const { fileStoreStrategyFactory } = require('/models/attachments.server');
            await addAttachmentFromStream(stream, {
              fileName: attachment.name || 'attachment',
              type: attachment.type,
              userId: this._userId,
              size: attachment.size,
              meta: {
                boardId: this._target.boardId,
                cardId,
                listId: this._cardListId[cardId],
                swimlaneId: this._cardSwimlaneId[cardId],
                source: 'import',
              },
            }, fileStoreStrategyFactory);
            this._counts.attachments += 1;
            continue;
          }
        }

        let buffer = null;
        if (attachment.file) {
          buffer = Buffer.from(attachment.file, 'base64');
        } else if (attachment.url) {
          // FollowBleed (GHSA-j9p2-jm73-p549): a validated public URL can 302
          // to an internal address, so the download is validated and pinned at
          // every hop by the same helper the board import uses.
          const { fetchImportedAttachment } = require('/models/lib/importAttachmentDownload');
          const downloaded = await fetchImportedAttachment(attachment.url);
          if (downloaded.blocked) continue;
          buffer = downloaded.buffer;
        }
        if (!buffer || !buffer.length) continue;

        await Attachments.writeAsync(
          buffer,
          {
            fileName: attachment.name || 'attachment',
            type: attachment.type || 'application/octet-stream',
            userId: this._userId,
            meta: {
              boardId: this._target.boardId,
              cardId,
              // The board and the swimlane the card actually landed in, not the
              // ones it came from: the file belongs where the card is now.
              listId: this._cardListId[cardId],
              swimlaneId: this._cardSwimlaneId[cardId],
              source: 'import',
            },
          },
          true,
        );
        this._counts.attachments += 1;
      } catch (error) {
        // One unreadable attachment is not a reason to lose the rest.
        console.warn('scoped import: could not import attachment',
          attachment.name, error && error.message);
      }
    }
  }

  // A custom field is a BOARD's, so an imported card's values only survive when
  // this board has a field of the same name. Matching by name rather than by id
  // is what makes an export from another board import at all.
  async _customFieldMap(board) {
    if (!this.hasField('custom-fields')) return {};
    const incoming = this._rows('customFields');
    if (!incoming.length) return {};
    const existing = await ReactiveCache.getCustomFields({ boardIds: board._id });
    const byName = new Map((existing || []).map(field => [String(field.name || ''), field._id]));
    const map = {};
    for (const field of incoming) {
      const match = byName.get(String(field.name || ''));
      if (match) map[field._id] = match;
    }
    return map;
  }

  async _importChecklists() {
    if (!this.hasField('checklists')) return;
    const checklists = this._rows('checklists');
    const items = this._rows('checklistItems');
    const checklistIdMap = {};

    for (const checklist of checklists) {
      const cardId = this._cardIdMap[checklist.cardId];
      if (!cardId) continue;
      const newId = await Checklists.direct.insertAsync({
        cardId,
        title: checklist.title || 'Checklist',
        sort: typeof checklist.sort === 'number' ? checklist.sort : 0,
        createdAt: this._now(),
        ...(typeof checklist.hideCheckedItems === 'boolean'
          ? { hideCheckedItems: checklist.hideCheckedItems } : {}),
      });
      checklistIdMap[checklist._id] = newId;
      this._counts.checklists += 1;
    }

    for (const item of items) {
      const checklistId = checklistIdMap[item.checklistId];
      const cardId = this._cardIdMap[item.cardId];
      if (!checklistId || !cardId) continue;
      await ChecklistItems.direct.insertAsync({
        cardId,
        checklistId,
        title: item.title || '',
        isFinished: Boolean(item.isFinished),
        sort: typeof item.sort === 'number' ? item.sort : 0,
        createdAt: this._now(),
      });
    }
  }

  async _importComments() {
    if (!this.hasField('comments')) return;
    for (const comment of this._rows('comments')) {
      const cardId = this._cardIdMap[comment.cardId];
      if (!cardId) continue;
      await CardComments.direct.insertAsync({
        boardId: this._target.boardId,
        cardId,
        text: comment.text || '',
        // The importing user, not the original author: the original may not
        // exist on this server, and a comment attributed to nobody is worse
        // than one attributed to whoever brought it in.
        userId: this._userId,
        createdAt: this._now(),
        modifiedAt: this._now(),
      });
      this._counts.comments += 1;
    }
  }
}

export { ScopedImporter, CARD_EXPORT_FIELD_KEYS };
