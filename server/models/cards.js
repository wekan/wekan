import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { ReactiveCache } from '/imports/reactiveCache';
import { add, now } from '/imports/lib/dateUtils';
import { Authentication } from '/server/authentication';
import { sendJsonResult } from '/server/apiMiddleware';
import { allowIsBoardMember, allowIsBoardMemberWithWriteAccess, computeSortForIndex, mergeLabelIds, canAssignCardMember, isCardDateClear } from '/server/lib/utils';
import { computeTopSort, normalizeMoveParams, parseCardDate } from '/server/lib/restCardHelpers';
const { coerceRestArrayParam } = require('/server/lib/restArrayParam');
const { applyCardBoardConsistency } = require('/server/lib/cardBoardConsistency');
import { titleChanged } from '/server/lib/titleChangeActivity';
import { descriptionChanged } from '/server/lib/descriptionChangeActivity';
import { buildDeleteCardActivity } from '/server/lib/deleteActivities';
import { assertParentCardIsVisible } from '/server/lib/visibleBoardIds';
import Activities from '/models/activities';
import Boards from '/models/boards';
import Cards, {
  addCronJob,
  cardAssignees,
  cardCreation,
  cardCustomFields,
  cardLabels,
  cardMembers,
  cardMove,
  cardRemover,
  cardState,
  updateActivities,
} from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import CustomFields from '/models/customFields';
import Checklists from '/models/checklists';
import ChecklistItems from '/models/checklistItems';
import { subtaskCustomFields } from '/imports/lib/subtaskHelpers';
import { ensureIndex } from '/server/lib/mongoStartup';
import { canEditCardOrLinkedCard } from '/server/lib/linkedCardPermission';

Meteor.methods({
  // #6613: create cross-board card links as an acknowledged, authoritative
  // operation. A direct client insert could be rejected after the optimistic
  // write, leaving the Link popup open without creating anything.
  async createLinkedCard(sourceCardId, boardId, swimlaneId, listId, sort) {
    check(sourceCardId, String);
    check(boardId, String);
    check(swimlaneId, String);
    check(listId, String);
    check(sort, Number);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    if (!Number.isFinite(sort)) throw new Meteor.Error('invalid-sort');

    const [sourceCard, destinationBoard, destinationList, destinationSwimlane] =
      await Promise.all([
        Cards.findOneAsync(sourceCardId),
        Boards.findOneAsync(boardId),
        Lists.findOneAsync(listId),
        Swimlanes.findOneAsync(swimlaneId),
      ]);
    if (!sourceCard || !destinationBoard || !destinationList || !destinationSwimlane) {
      throw new Meteor.Error('not-found');
    }
    const sourceBoard = await Boards.findOneAsync(sourceCard.boardId);
    if (!sourceBoard || !allowIsBoardMember(this.userId, sourceBoard)) {
      throw new Meteor.Error('not-authorized');
    }
    if (!allowIsBoardMemberWithWriteAccess(this.userId, destinationBoard)) {
      throw new Meteor.Error('not-authorized');
    }
    if (
      sourceCard.boardId === boardId ||
      sourceCard.archived === true ||
      destinationList.archived === true ||
      destinationSwimlane.archived === true ||
      destinationList.boardId !== boardId ||
      destinationSwimlane.boardId !== boardId ||
      sourceCard.type === 'template-card' ||
      sourceCard.type === 'cardType-linkedCard' ||
      sourceCard.type === 'cardType-linkedBoard'
    ) {
      throw new Meteor.Error('invalid-linked-card');
    }

    return await Cards.insertAsync({
      title: sourceCard.title || '',
      listId,
      swimlaneId,
      boardId,
      sort,
      type: 'cardType-linkedCard',
      linkedId: sourceCardId,
      cardNumber: await destinationBoard.getNextCardNumber(),
      userId: this.userId,
    });
  },

  // #6608: archive one card selection as one acknowledged server operation.
  // The old sidebar loop issued direct client collection updates and closed
  // immediately, so a rejected update looked exactly like a successful action
  // while every selected card stayed put.
  async archiveSelectedCards(boardId, cardIds) {
    check(boardId, String);
    check(cardIds, [String]);
    if (!this.userId) throw new Meteor.Error('not-authorized');

    const ids = [...new Set(cardIds)];
    if (!ids.length || ids.length > 5000) {
      throw new Meteor.Error('invalid-card-selection');
    }

    const board = await Boards.findOneAsync(boardId);
    if (!board || !allowIsBoardMemberWithWriteAccess(this.userId, board)) {
      throw new Meteor.Error('not-authorized');
    }

    const cards = await Cards.find({
      _id: { $in: ids },
      boardId,
      archived: false,
    }).fetchAsync();
    if (cards.length !== ids.length) {
      throw new Meteor.Error('invalid-card-selection');
    }

    // Validate the complete selection before changing the first card. Preserve
    // the board order used by Multi-Selection for deterministic activity order.
    const byId = new Map(cards.map(card => [card._id, card]));
    for (const id of ids) {
      await byId.get(id).archive();
    }
    return { archived: ids.length };
  },

  // #6611: custom-field selection and checkbox values are acknowledged server
  // writes. Direct client collection writes could be refused silently, making
  // a removed field immediately reappear and a checkbox appear inert.
  async setCardCustomFieldAssigned(cardId, customFieldId, assigned) {
    check(cardId, String);
    check(customFieldId, String);
    check(assigned, Boolean);
    if (!this.userId) throw new Meteor.Error('not-authorized');

    const card = await Cards.findOneAsync(cardId);
    if (!card) throw new Meteor.Error('not-found');
    const board = await Boards.findOneAsync(card.boardId);
    if (!(await canEditCardOrLinkedCard(this.userId, card, board))) {
      throw new Meteor.Error('not-authorized');
    }
    const definition = await CustomFields.findOneAsync({
      _id: customFieldId,
      boardIds: card.boardId,
    });
    if (!definition) throw new Meteor.Error('custom-field-not-found');

    if (assigned) {
      await Cards.updateAsync(cardId, {
        $addToSet: { customFields: { _id: customFieldId, value: null } },
      });
    } else {
      // #6611: MongoDB document conditions match fields within each array
      // element. FerretDB must do the same here; exact document equality would
      // not match an element that also contains its custom-field value.
      await Cards.updateAsync(cardId, {
        $pull: { customFields: { _id: customFieldId } },
      });
    }
    return assigned;
  },

  async setCardCustomFieldCheckbox(cardId, customFieldId, value) {
    check(cardId, String);
    check(customFieldId, String);
    check(value, Boolean);
    if (!this.userId) throw new Meteor.Error('not-authorized');

    const card = await Cards.findOneAsync(cardId);
    if (!card) throw new Meteor.Error('not-found');
    const board = await Boards.findOneAsync(card.boardId);
    if (!(await canEditCardOrLinkedCard(this.userId, card, board))) {
      throw new Meteor.Error('not-authorized');
    }
    const definition = await CustomFields.findOneAsync({
      _id: customFieldId,
      boardIds: card.boardId,
      type: 'checkbox',
    });
    if (!definition) throw new Meteor.Error('custom-field-not-found');

    const index = (card.customFields || []).findIndex(field =>
      field && field._id === customFieldId);
    if (index < 0) throw new Meteor.Error('custom-field-not-on-card');
    await Cards.updateAsync(cardId, {
      $set: { [`customFields.${index}.value`]: value },
    });
    return value;
  },

  async setCardCustomFieldCurrency(cardId, customFieldId, value) {
    check(cardId, String);
    check(customFieldId, String);
    check(value, Number);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    if (!Number.isFinite(value)) {
      throw new Meteor.Error('invalid-custom-field-value');
    }

    const card = await Cards.findOneAsync(cardId);
    if (!card) throw new Meteor.Error('not-found');
    const board = await Boards.findOneAsync(card.boardId);
    if (!(await canEditCardOrLinkedCard(this.userId, card, board))) {
      throw new Meteor.Error('not-authorized');
    }
    const definition = await CustomFields.findOneAsync({
      _id: customFieldId,
      boardIds: card.boardId,
      type: 'currency',
    });
    if (!definition) throw new Meteor.Error('custom-field-not-found');

    const index = (card.customFields || []).findIndex(field =>
      field && field._id === customFieldId);
    if (index < 0) throw new Meteor.Error('custom-field-not-on-card');
    await Cards.updateAsync(cardId, {
      $set: { [`customFields.${index}.value`]: value },
    });
    return value;
  },

  // Server-authoritative subtask creation. Fixes:
  //  - #3868 / #5788 / #2256 "extra swimlane / column on subtask creation" and
  //    #4782 "can not create more than one subtask": the default subtasks
  //    board/list/swimlane are resolved (and lazily created ONCE) here on the
  //    server, so the client can no longer create duplicate helper boards.
  //  - #4037 / #3562 "custom fields not assigned to subtask cards": the
  //    destination board's automatic custom fields are applied to the subtask.
  async addSubtaskCard(parentCardId, title) {
    check(parentCardId, String);
    check(title, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const trimmed = title.trim();
    if (!trimmed) return undefined;

    const parentCard =
      (await ReactiveCache.getCard(parentCardId)) ||
      (await Cards.findOneAsync(parentCardId));
    if (!parentCard) throw new Meteor.Error('not-found');
    const parentBoard = await Boards.findOneAsync(parentCard.boardId);
    if (!parentBoard) throw new Meteor.Error('not-found');
    // The author must have write access to the parent card's board.
    if (!(await canEditCardOrLinkedCard(this.userId, parentCard, parentBoard)))
      throw new Meteor.Error('not-authorized');

    // Resolve (and, on the server, lazily create ONCE) the default subtasks
    // board + landing list. These getters never duplicate on the server.
    const targetBoard = await parentBoard.getDefaultSubtasksBoardAsync();
    if (!targetBoard) return undefined;
    const targetList = await targetBoard.getDefaultSubtasksListAsync();
    if (!targetList) return undefined;

    // Reuse a swimlane on the destination board: prefer one whose title matches
    // the parent card's swimlane, otherwise the destination board's default
    // swimlane. Both branches reuse an existing swimlane (no insert here).
    let swimlaneId;
    const parentSwimlane = parentCard.swimlaneId
      ? await Swimlanes.findOneAsync(parentCard.swimlaneId)
      : null;
    const targetSwimlane = parentSwimlane
      ? await Swimlanes.findOneAsync({
          boardId: targetBoard._id,
          title: parentSwimlane.title,
        })
      : null;
    if (targetSwimlane) {
      swimlaneId = targetSwimlane._id;
    } else {
      const defaultSwimlane = await targetBoard.getDefaultSwimlineAsync();
      swimlaneId = defaultSwimlane && defaultSwimlane._id;
    }
    if (!swimlaneId) return undefined;

    // #4037 / #3562: apply the destination board's automatic custom fields.
    const boardCustomFields = await CustomFields.find({
      boardIds: targetBoard._id,
    }).fetchAsync();
    const customFields = subtaskCustomFields(boardCustomFields);

    const cardNumber = await targetBoard.getNextCardNumber();
    // #3826: a constant `sort: -1` made EVERY subtask card tie, so a list full
    // of subtask cards could not be reordered by drag (no number lies strictly
    // between two equal sorts; the computed index equalled the card's own sort
    // and the move was discarded as a no-op). Append with a unique sort at the
    // end of the target list instead — with the old all-ties data the cards
    // effectively rendered in insertion order anyway, so the visible placement
    // is unchanged while new subtasks no longer pile up duplicate sorts.
    const lastCard = await Cards.findOneAsync(
      { listId: targetList._id, archived: false },
      { sort: { sort: -1 }, fields: { sort: 1 } },
    );
    const sort =
      lastCard && Number.isFinite(lastCard.sort) ? lastCard.sort + 1 : 0;
    const _id = await Cards.insertAsync({
      title: trimmed,
      parentId: parentCardId,
      members: [],
      assignees: [],
      labelIds: [],
      customFields,
      listId: targetList._id,
      boardId: targetBoard._id,
      sort,
      swimlaneId,
      type: 'cardType-card',
      cardNumber,
      userId: this.userId,
    });
    return _id;
  },

  async createCardWithDueDate(boardId, listId, title, dueDate, swimlaneId) {
    check(boardId, String);
    check(listId, String);
    check(title, String);
    check(dueDate, Date);
    check(swimlaneId, String);

    if (!this.userId) throw new Meteor.Error('not-authorized');
    const destBoard = await Boards.findOneAsync(boardId);
    if (!destBoard) throw new Meteor.Error('not-found');
    if (!allowIsBoardMemberWithWriteAccess(this.userId, destBoard))
      throw new Meteor.Error('not-authorized');

    const card = {
      title,
      listId,
      boardId,
      swimlaneId,
      createdAt: new Date(),
      dueAt: dueDate,
      sort: 0,
      userId: this.userId,
    };
    const cardId = await Cards.insertAsync(card);
    return cardId;
  },

  async 'cards.pokerVote'(cardId, state) {
    check(cardId, String);
    if (state !== undefined && state !== null) check(state, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');

    const card = (await ReactiveCache.getCard(cardId)) || (await Cards.findOneAsync(cardId));
    if (!card) throw new Meteor.Error('not-found');
    const board = (await ReactiveCache.getBoard(card.boardId)) || (await Boards.findOneAsync(card.boardId));
    if (!board) throw new Meteor.Error('not-found');

    const isMember = allowIsBoardMember(this.userId, board) ||
      await canEditCardOrLinkedCard(this.userId, card, board);
    const allowNBM = !!(card.poker && card.poker.allowNonBoardMembers);
    if (!(isMember || allowNBM)) {
      throw new Meteor.Error('not-authorized');
    }

    let mod = card.setPoker(this.userId, state);
    if (!mod || typeof mod !== 'object') mod = {};
    mod.$set = Object.assign({}, mod.$set, {
      modifiedAt: new Date(),
      dateLastActivity: new Date(),
    });
    return await Cards.updateAsync({ _id: cardId }, mod);
  },

  async 'cards.setPokerQuestion'(cardId, question, allowNonBoardMembers) {
    check(cardId, String);
    check(question, Boolean);
    check(allowNonBoardMembers, Boolean);
    if (!this.userId) throw new Meteor.Error('not-authorized');

    const card = (await ReactiveCache.getCard(cardId)) || (await Cards.findOneAsync(cardId));
    if (!card) throw new Meteor.Error('not-found');
    const board = (await ReactiveCache.getBoard(card.boardId)) || (await Boards.findOneAsync(card.boardId));
    if (!(await canEditCardOrLinkedCard(this.userId, card, board))) throw new Meteor.Error('not-authorized');

    const modifier = {
      $set: {
        poker: {
          question,
          allowNonBoardMembers,
          one: [],
          two: [],
          three: [],
          five: [],
          eight: [],
          thirteen: [],
          twenty: [],
          forty: [],
          oneHundred: [],
          unsure: [],
        },
        modifiedAt: new Date(),
        dateLastActivity: new Date(),
      },
    };
    return await Cards.updateAsync({ _id: cardId }, modifier);
  },

  async 'cards.setPokerEnd'(cardId, end) {
    check(cardId, String);
    check(end, Date);
    if (!this.userId) throw new Meteor.Error('not-authorized');

    const card = (await ReactiveCache.getCard(cardId)) || (await Cards.findOneAsync(cardId));
    if (!card) throw new Meteor.Error('not-found');
    const board = (await ReactiveCache.getBoard(card.boardId)) || (await Boards.findOneAsync(card.boardId));
    if (!(await canEditCardOrLinkedCard(this.userId, card, board))) throw new Meteor.Error('not-authorized');

    return await Cards.updateAsync(
      { _id: cardId },
      {
        $set: {
          'poker.end': end,
          modifiedAt: new Date(),
          dateLastActivity: new Date(),
        },
      },
    );
  },

  async 'cards.unsetPokerEnd'(cardId) {
    check(cardId, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');

    const card = (await ReactiveCache.getCard(cardId)) || (await Cards.findOneAsync(cardId));
    if (!card) throw new Meteor.Error('not-found');
    const board = (await ReactiveCache.getBoard(card.boardId)) || (await Boards.findOneAsync(card.boardId));
    if (!(await canEditCardOrLinkedCard(this.userId, card, board))) throw new Meteor.Error('not-authorized');

    return await Cards.updateAsync(
      { _id: cardId },
      {
        $unset: { 'poker.end': '' },
        $set: { modifiedAt: new Date(), dateLastActivity: new Date() },
      },
    );
  },

  async 'cards.unsetPoker'(cardId) {
    check(cardId, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');

    const card = (await ReactiveCache.getCard(cardId)) || (await Cards.findOneAsync(cardId));
    if (!card) throw new Meteor.Error('not-found');
    const board = (await ReactiveCache.getBoard(card.boardId)) || (await Boards.findOneAsync(card.boardId));
    if (!(await canEditCardOrLinkedCard(this.userId, card, board))) throw new Meteor.Error('not-authorized');

    return await Cards.updateAsync(
      { _id: cardId },
      {
        $unset: { poker: '' },
        $set: { modifiedAt: new Date(), dateLastActivity: new Date() },
      },
    );
  },

  async 'cards.setPokerEstimation'(cardId, estimation) {
    check(cardId, String);
    check(estimation, Number);
    if (!this.userId) throw new Meteor.Error('not-authorized');

    const card = (await ReactiveCache.getCard(cardId)) || (await Cards.findOneAsync(cardId));
    if (!card) throw new Meteor.Error('not-found');
    const board = (await ReactiveCache.getBoard(card.boardId)) || (await Boards.findOneAsync(card.boardId));
    if (!(await canEditCardOrLinkedCard(this.userId, card, board))) throw new Meteor.Error('not-authorized');

    return await Cards.updateAsync(
      { _id: cardId },
      {
        $set: {
          'poker.estimation': estimation,
          modifiedAt: new Date(),
          dateLastActivity: new Date(),
        },
      },
    );
  },

  async 'cards.unsetPokerEstimation'(cardId) {
    check(cardId, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');

    const card = (await ReactiveCache.getCard(cardId)) || (await Cards.findOneAsync(cardId));
    if (!card) throw new Meteor.Error('not-found');
    const board = (await ReactiveCache.getBoard(card.boardId)) || (await Boards.findOneAsync(card.boardId));
    if (!(await canEditCardOrLinkedCard(this.userId, card, board))) throw new Meteor.Error('not-authorized');

    return await Cards.updateAsync(
      { _id: cardId },
      {
        $unset: { 'poker.estimation': '' },
        $set: { modifiedAt: new Date(), dateLastActivity: new Date() },
      },
    );
  },

  async 'cards.replayPoker'(cardId) {
    check(cardId, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');

    const card = (await ReactiveCache.getCard(cardId)) || (await Cards.findOneAsync(cardId));
    if (!card) throw new Meteor.Error('not-found');
    const board = (await ReactiveCache.getBoard(card.boardId)) || (await Boards.findOneAsync(card.boardId));
    if (!(await canEditCardOrLinkedCard(this.userId, card, board))) throw new Meteor.Error('not-authorized');

    return await Cards.updateAsync(
      { _id: cardId },
      {
        $set: {
          'poker.one': [],
          'poker.two': [],
          'poker.three': [],
          'poker.five': [],
          'poker.eight': [],
          'poker.thirteen': [],
          'poker.twenty': [],
          'poker.forty': [],
          'poker.oneHundred': [],
          'poker.unsure': [],
          modifiedAt: new Date(),
          dateLastActivity: new Date(),
        },
        $unset: { 'poker.end': '' },
      },
    );
  },

  async 'cards.setVoteQuestion'(cardId, question, publicVote, allowNonBoardMembers) {
    check(cardId, String);
    check(question, String);
    check(publicVote, Boolean);
    check(allowNonBoardMembers, Boolean);
    if (!this.userId) throw new Meteor.Error('not-authorized');

    const card = (await ReactiveCache.getCard(cardId)) || (await Cards.findOneAsync(cardId));
    if (!card) throw new Meteor.Error('not-found');
    const board = (await ReactiveCache.getBoard(card.boardId)) || (await Boards.findOneAsync(card.boardId));
    if (!(await canEditCardOrLinkedCard(this.userId, card, board))) throw new Meteor.Error('not-authorized');

    return await Cards.updateAsync(
      { _id: cardId },
      {
        $set: {
          vote: {
            question,
            public: publicVote,
            allowNonBoardMembers,
            positive: [],
            negative: [],
          },
          modifiedAt: new Date(),
          dateLastActivity: new Date(),
        },
      },
    );
  },

  async 'cards.setVoteEnd'(cardId, end) {
    check(cardId, String);
    check(end, Date);
    if (!this.userId) throw new Meteor.Error('not-authorized');

    const card = (await ReactiveCache.getCard(cardId)) || (await Cards.findOneAsync(cardId));
    if (!card) throw new Meteor.Error('not-found');
    const board = (await ReactiveCache.getBoard(card.boardId)) || (await Boards.findOneAsync(card.boardId));
    if (!(await canEditCardOrLinkedCard(this.userId, card, board))) throw new Meteor.Error('not-authorized');

    return await Cards.updateAsync(
      { _id: cardId },
      {
        $set: {
          'vote.end': end,
          modifiedAt: new Date(),
          dateLastActivity: new Date(),
        },
      },
    );
  },

  async 'cards.unsetVoteEnd'(cardId) {
    check(cardId, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');

    const card = (await ReactiveCache.getCard(cardId)) || (await Cards.findOneAsync(cardId));
    if (!card) throw new Meteor.Error('not-found');
    const board = (await ReactiveCache.getBoard(card.boardId)) || (await Boards.findOneAsync(card.boardId));
    if (!(await canEditCardOrLinkedCard(this.userId, card, board))) throw new Meteor.Error('not-authorized');

    return await Cards.updateAsync(
      { _id: cardId },
      {
        $unset: { 'vote.end': '' },
        $set: { modifiedAt: new Date(), dateLastActivity: new Date() },
      },
    );
  },

  async 'cards.unsetVote'(cardId) {
    check(cardId, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');

    const card = (await ReactiveCache.getCard(cardId)) || (await Cards.findOneAsync(cardId));
    if (!card) throw new Meteor.Error('not-found');
    const board = (await ReactiveCache.getBoard(card.boardId)) || (await Boards.findOneAsync(card.boardId));
    if (!(await canEditCardOrLinkedCard(this.userId, card, board))) throw new Meteor.Error('not-authorized');

    return await Cards.updateAsync(
      { _id: cardId },
      {
        $unset: { vote: '' },
        $set: { modifiedAt: new Date(), dateLastActivity: new Date() },
      },
    );
  },

  async 'cards.vote'(cardId, forIt) {
    check(cardId, String);
    if (forIt !== undefined && forIt !== null) check(forIt, Boolean);
    if (!this.userId) throw new Meteor.Error('not-authorized');

    const card = (await ReactiveCache.getCard(cardId)) || (await Cards.findOneAsync(cardId));
    if (!card) throw new Meteor.Error('not-found');
    const board = (await ReactiveCache.getBoard(card.boardId)) || (await Boards.findOneAsync(card.boardId));
    if (!board) throw new Meteor.Error('not-found');

    const isMember = allowIsBoardMember(this.userId, board) ||
      await canEditCardOrLinkedCard(this.userId, card, board);
    const allowNBM = !!(card.vote && card.vote.allowNonBoardMembers);
    if (!(isMember || allowNBM)) {
      throw new Meteor.Error('not-authorized');
    }

    let modifier;
    if (forIt === true) {
      modifier = {
        $pull: { 'vote.negative': this.userId },
        $addToSet: { 'vote.positive': this.userId },
        $set: { modifiedAt: new Date(), dateLastActivity: new Date() },
      };
    } else if (forIt === false) {
      modifier = {
        $pull: { 'vote.positive': this.userId },
        $addToSet: { 'vote.negative': this.userId },
        $set: { modifiedAt: new Date(), dateLastActivity: new Date() },
      };
    } else {
      modifier = {
        $pull: {
          'vote.positive': this.userId,
          'vote.negative': this.userId,
        },
        $set: { modifiedAt: new Date(), dateLastActivity: new Date() },
      };
    }

    return await Cards.updateAsync({ _id: cardId }, modifier);
  },

  async copyCard(cardId, boardId, swimlaneId, listId, insertAtTop, mergeCardValues) {
    check(cardId, String);
    check(boardId, String);
    check(swimlaneId, String);
    check(listId, String);
    check(insertAtTop, Boolean);
    check(mergeCardValues, Object);

    if (!this.userId) throw new Meteor.Error('not-authorized');
    const card = await ReactiveCache.getCard(cardId);
    if (!card) throw new Meteor.Error('not-found');
    const sourceBoard = await Boards.findOneAsync(card.boardId);
    if (!allowIsBoardMember(this.userId, sourceBoard))
      throw new Meteor.Error('not-authorized');
    const destBoard = await Boards.findOneAsync(boardId);
    if (!allowIsBoardMemberWithWriteAccess(this.userId, destBoard))
      throw new Meteor.Error('not-authorized');
    Object.assign(card, mergeCardValues);

    const sort = await card.getSort(listId, swimlaneId, insertAtTop);
    if (insertAtTop) {
      card.sort = sort - 1;
    } else {
      card.sort = sort + 1;
    }

    return await card.copy(boardId, swimlaneId, listId);
  },
});

Meteor.startup(async () => {
  await ensureIndex(Cards, { modifiedAt: -1 });
  await ensureIndex(Cards, { updatedAt: 1, deleted: 1 });
  await ensureIndex(Cards, { boardId: 1, createdAt: -1 });
  await ensureIndex(Cards, { boardId: 1, listId: 1 });
  // The board publication's main card cursor filters { boardId, archived }; without
  // archived in the index FerretDB/SQLite could only use the boardId prefix and then
  // scanned archived, which on boards with years of archived+active cards burned CPU
  // and caused SQLITE_BUSY (#6480). This compound index covers that filter.
  await ensureIndex(Cards, { boardId: 1, archived: 1 });
  // Linked-card and parent discovery add one predicate to that common prefix.
  await ensureIndex(Cards, { boardId: 1, archived: 1, type: 1 });
  await ensureIndex(Cards, { boardId: 1, archived: 1, parentId: 1 });
  // Lazy card windows filter one board/list/swimlane, sort by the card order and
  // use _id as a deterministic tie-breaker. MongoDB can answer the projected id
  // window from this index alone (limit included) instead of reading and sorting
  // every card in the list. FerretDB may use a shorter prefix until its SQLite
  // compound-sort pushdown supports this shape, but retains identical semantics.
  await ensureIndex(Cards, {
    boardId: 1,
    archived: 1,
    listId: 1,
    swimlaneId: 1,
    sort: 1,
    _id: 1,
  });
  // Due Cards narrows authorized boards and active ordinary cards, then orders
  // them chronologically. The equality prefix avoids walking every card of each
  // board before applying the due-date range.
  await ensureIndex(Cards, { boardId: 1, archived: 1, type: 1, dueAt: 1 });
  await ensureIndex(Cards, { parentId: 1 });
  // Admin Panel / Problems / Broken cards asks for cards with NO board, swimlane
  // or list, or an unknown type - an $or, which can only use an index if each of
  // its branches has one. `boardId` is covered by { boardId, createdAt } above;
  // these are the other three, so counting the report (and paging it) does not
  // scan every card in the database.
  await ensureIndex(Cards, { swimlaneId: 1 });
  await ensureIndex(Cards, { listId: 1 });
  await ensureIndex(Cards, { type: 1 });
  Meteor.defer(() => {
    addCronJob();
  });
});

Cards.after.insert(async (userId, doc) => {
  await cardCreation(userId, doc);

  Meteor.setTimeout(async () => {
    const card = await Cards.findOneAsync(doc._id);
    if (card) {
      card.trackOriginalPosition();
    }
  }, 100);
});

Cards.after.update(async (userId, doc, fieldNames) => {
  await cardState(userId, doc, fieldNames);
});

// When a card moves to another board, re-sync the denormalized boardId on its
// checklists and checklist items so the board publication — which filters those
// collections by boardId — shows them on the destination board. Uses .direct to
// skip the activity/derivation hooks (the docs' cardId did not change).
Cards.after.update(async (userId, doc, fieldNames) => {
  if (!fieldNames.includes('boardId')) return;
  const boardId = doc.boardId;
  await Checklists.direct.updateAsync({ cardId: doc._id }, { $set: { boardId } }, { multi: true });
  await ChecklistItems.direct.updateAsync({ cardId: doc._id }, { $set: { boardId } }, { multi: true });
});

// #6572 / #3392: "Red Strings" only connect cards on the same board, so a card
// that moves away must also lose the INBOUND links pointing at it from the board
// it left, or those cards keep a dangling line to a card that is no longer there.
//
// The card's own dependencies are cleared by the move itself (cardDependencies:
// [] is part of the by-_id update). The inbound ones live on OTHER cards, so they
// need a multi-document update with a compound selector - and that used to sit in
// Cards.move() in models/cards.js, which the client calls directly. Meteor only
// lets untrusted code updateAsync BY ID, so the selector made every cross-board
// move fail with "Not permitted. Untrusted code may only updateAsync documents by
// ID" before the move ran at all, whether or not the card had any dependencies.
//
// Server-side the selector is allowed, and this covers every path that moves a
// card - the client helper, the REST API, and import - rather than only the one
// that happened to call the model helper. .direct like the hook above: this is a
// denormalization cleanup on other documents, not an edit anyone is watching.
//
// Two pulls, because an entry may be either shape: dependencies are stored as
// { cardId, type, color, icon } objects, and data written before #3392's rewrite
// can still hold bare card-id strings (normalizeDependencies upgrades those on
// read, so they are invisible until something has to delete one).
Cards.after.update(async function(userId, doc, fieldNames) {
  if (!fieldNames.includes('boardId')) return;
  const oldBoardId = (this.previous || {}).boardId;
  if (!oldBoardId || oldBoardId === doc.boardId) return;
  await Cards.direct.updateAsync(
    { boardId: oldBoardId, 'cardDependencies.cardId': doc._id },
    { $pull: { cardDependencies: { cardId: doc._id } } },
    { multi: true },
  );
  await Cards.direct.updateAsync(
    { boardId: oldBoardId, cardDependencies: doc._id },
    { $pull: { cardDependencies: doc._id } },
    { multi: true },
  );
});

Cards.after.update(async function(userId, doc, fieldNames) {
  const previous = this.previous || {};
  const oldListId = previous.listId || doc.listId;
  const oldSwimlaneId = previous.swimlaneId || doc.swimlaneId;
  const oldBoardId = previous.boardId || doc.boardId;
  await cardMove(userId, doc, fieldNames, oldListId, oldSwimlaneId, oldBoardId);
});

// #5874: a cross-board move must never leave the card pointing at the *source*
// board's swimlane/list. The move/copy dialog resolves its target board's
// swimlanes/lists from the client cache, which can still be empty when the user
// confirms, so it can send boardId=B while swimlaneId/listId still belong to
// board A — leaving the card invisible on both boards (data loss). This guard
// runs server-side (where the destination board's swimlanes/lists are always
// available) and rewrites the modifier so the card's swimlane/list always belong
// to the destination board, falling back to its default swimlane / first list.
// Corrective only: a move whose targets already belong to the destination board
// is left untouched. Server-only (uses the pure helper in server/lib).
async function enforceCardBoardConsistency(doc, fieldNames, modifier) {
  await applyCardBoardConsistency(doc, fieldNames, modifier, {
    swimlaneBelongs: async (swimlaneId, boardId) =>
      !!(await ReactiveCache.getSwimlane({ _id: swimlaneId, boardId })),
    listBelongs: async (listId, boardId) =>
      !!(await ReactiveCache.getList({ _id: listId, boardId })),
    getDefaultSwimlaneId: async boardId => {
      const board = await ReactiveCache.getBoard(boardId);
      if (!board) return undefined;
      const swimlane = await board.getDefaultSwimlineAsync();
      return swimlane && swimlane._id;
    },
    getFirstListId: async boardId => {
      const list = await ReactiveCache.getList(
        { boardId, archived: false },
        { sort: { sort: 1 } },
      );
      return list && list._id;
    },
  });
}

// Registered first so the corrected modifier is what every later before/after
// hook (and the persisted update) sees.
Cards.before.update(async (userId, doc, fieldNames, modifier) => {
  await enforceCardBoardConsistency(doc, fieldNames, modifier);
});

Cards.before.update(async (userId, doc, fieldNames, modifier) => {
  await cardMembers(userId, doc, fieldNames, modifier);
  await updateActivities(doc, fieldNames, modifier);
});

Cards.before.update(async (userId, doc, fieldNames, modifier) => {
  await cardAssignees(userId, doc, fieldNames, modifier);
  await updateActivities(doc, fieldNames, modifier);
});

Cards.before.update((userId, doc, fieldNames, modifier) => {
  cardLabels(userId, doc, fieldNames, modifier);
});

Cards.before.update((userId, doc, fieldNames, modifier) => {
  cardCustomFields(userId, doc, fieldNames, modifier);
});

Cards.before.update(async (userId, doc, fieldNames, modifier) => {
  const fields = fieldNames.filter(name => name !== 'dateLastActivity');
  const timingaction = ['receivedAt', 'dueAt', 'startAt', 'endAt'];
  const action = fields[0];
  if (fields.length > 0 && timingaction.includes(action)) {
    const value = modifier.$set[action];
    const oldvalue = doc[action] || '';
    const activityType = `a-${action}`;
    const card = await ReactiveCache.getCard(doc._id);
    if (!card) {
      console.warn('[Cards.before.update] Card not found for cardId:', doc._id, '— skipping timing activity.');
      return;
    }
    const list = await card.list();
    if (list) {
      const modifiedAt = add(now(), -1, 'year').toISOString();
      const boardId = list.boardId;
      await Lists.direct.updateAsync(
        { _id: list._id },
        { $set: { modifiedAt, boardId } },
      );
    }
    const user = await ReactiveCache.getUser(userId);
    await Activities.insertAsync({
      userId,
      username: user && user.username,
      activityType,
      boardId: doc.boardId,
      cardId: doc._id,
      cardTitle: doc.title,
      timeKey: action,
      timeValue: value,
      timeOldValue: oldvalue,
      listId: card.listId,
      swimlaneId: card.swimlaneId,
    });
  }
});

// Issue #3619: changing a card's title must log an activity so the
// Activities.after.insert outgoing-webhook hook fires (like description/dueAt do).
Cards.before.update(async (userId, doc, fieldNames, modifier) => {
  if (!titleChanged(doc, modifier)) {
    return;
  }
  const oldValue = doc.title || '';
  const newValue = modifier.$set.title;
  const card = await ReactiveCache.getCard(doc._id);
  if (!card) {
    console.warn('[Cards.before.update] Card not found for cardId:', doc._id, '— skipping title activity.');
    return;
  }
  const user = await ReactiveCache.getUser(userId);
  await Activities.insertAsync({
    userId,
    username: user && user.username,
    activityType: 'a-changedTitle',
    boardId: doc.boardId,
    cardId: doc._id,
    cardTitle: newValue,
    oldValue,
    value: newValue,
    listId: card.listId,
    swimlaneId: card.swimlaneId,
  });
});

// Issue #5482: adding or editing a card's description must log an activity so the
// Activities.after.insert outgoing-webhook hook fires (like title/dueAt do). Fires
// for both first-time set and later edits, but not for no-op / empty->empty saves.
Cards.before.update(async (userId, doc, fieldNames, modifier) => {
  if (!descriptionChanged(doc, modifier)) {
    return;
  }
  const oldValue = doc.description || '';
  const newValue = modifier.$set.description || '';
  const card = await ReactiveCache.getCard(doc._id);
  if (!card) {
    console.warn('[Cards.before.update] Card not found for cardId:', doc._id, '— skipping description activity.');
    return;
  }
  const user = await ReactiveCache.getUser(userId);
  await Activities.insertAsync({
    userId,
    username: user && user.username,
    activityType: 'a-changedDescription',
    boardId: doc.boardId,
    cardId: doc._id,
    cardTitle: doc.title,
    oldValue,
    value: newValue,
    listId: card.listId,
    swimlaneId: card.swimlaneId,
  });
});

Cards.before.remove(async (userId, doc) => {
  // Must be awaited: cardRemover deletes the card's checklists, checklist items,
  // comments and attachments. If not awaited, the card document is removed first
  // and those cascade removals then run with the parent card already gone, whose
  // before.remove hooks dereference an undefined card and crash SyncedCron with
  // an unhandled rejection (TypeError: ... reading 'boardId'). Awaiting here
  // removes the sub-items while the card still exists.
  await cardRemover(userId, doc);

  // Issue #1587: permanently deleting a card must log an activity so the
  // Activities.after.insert outgoing-webhook hook fires (archiving already logs
  // an archivedCard activity, but a real delete previously logged nothing). The
  // card document still exists here (it is removed after this before.remove
  // hook), so the notify hook can resolve the card title.
  await Activities.insertAsync(
    buildDeleteCardActivity({
      userId,
      cardId: doc._id,
      boardId: doc.boardId,
      listId: doc.listId,
      swimlaneId: doc.swimlaneId,
      cardTitle: doc.title,
    }),
  );
});

WebApp.handlers.get(
  '/api/boards/:boardId/swimlanes/:swimlaneId/cards',
  async function(req, res) {
    const paramBoardId = req.params.boardId;
    const paramSwimlaneId = req.params.swimlaneId;
    await Authentication.checkBoardAccess(req.userId, paramBoardId);
    const cards = await ReactiveCache.getCards(
      {
        boardId: paramBoardId,
        swimlaneId: paramSwimlaneId,
        archived: false,
      },
      { sort: ['sort'] },
    );
    sendJsonResult(res, {
      code: 200,
      data: cards.map(doc => ({
        _id: doc._id,
        title: doc.title,
        description: doc.description,
        listId: doc.listId,
        receivedAt: doc.receivedAt,
        startAt: doc.startAt,
        dueAt: doc.dueAt,
        endAt: doc.endAt,
        assignees: doc.assignees,
        sort: doc.sort,
      })),
    });
  },
);

WebApp.handlers.get('/api/boards/:boardId/lists/:listId/cards', async function(req, res) {
  const paramBoardId = req.params.boardId;
  const paramListId = req.params.listId;
  await Authentication.checkBoardAccess(req.userId, paramBoardId);
  const cards = await ReactiveCache.getCards(
    {
      boardId: paramBoardId,
      listId: paramListId,
      archived: false,
    },
    { sort: ['sort'] },
  );
  sendJsonResult(res, {
    code: 200,
    data: cards.map(doc => ({
      _id: doc._id,
      title: doc.title,
      description: doc.description,
      swimlaneId: doc.swimlaneId,
      receivedAt: doc.receivedAt,
      startAt: doc.startAt,
      dueAt: doc.dueAt,
      endAt: doc.endAt,
      assignees: doc.assignees,
      sort: doc.sort,
    })),
  });
});

// Issue #5546: this single-card GET looks up by id ONLY (no archived filter),
// so it returns archived cards too — letting a caller inspect an archived card
// (e.g. to read its listId) and then de-archive it via PUT archive=false.
WebApp.handlers.get('/api/cards/:cardId', async function(req, res) {
  const paramCardId = req.params.cardId;
  const card = await ReactiveCache.getCard(paramCardId);
  if (!card) {
    sendJsonResult(res, { code: 404, data: { error: 'Card not found' } });
    return;
  }
  await Authentication.checkBoardAccess(req.userId, card.boardId);
  sendJsonResult(res, {
    code: 200,
    data: card,
  });
});

WebApp.handlers.get(
  '/api/boards/:boardId/lists/:listId/cards/:cardId',
  async function(req, res) {
    const paramBoardId = req.params.boardId;
    const paramListId = req.params.listId;
    const paramCardId = req.params.cardId;
    await Authentication.checkBoardAccess(req.userId, paramBoardId);
    sendJsonResult(res, {
      code: 200,
      data: await ReactiveCache.getCard({
        _id: paramCardId,
        listId: paramListId,
        boardId: paramBoardId,
        archived: false,
      }),
    });
  },
);

WebApp.handlers.post('/api/boards/:boardId/lists/:listId/cards', async function(req, res) {
  Authentication.checkLoggedIn(req.userId);
  const paramBoardId = req.params.boardId;
  const board = await ReactiveCache.getBoard(paramBoardId);
  const addPermission = allowIsBoardMemberWithWriteAccess(req.userId, board);
  // Must be awaited: checkAdminOrCondition is async, so without await a denied
  // (non board member) caller's rejection never blocks and the card was created
  // anyway — an auth bypass (CWE-862). Awaiting enforces the membership check.
  await Authentication.checkAdminOrCondition(req.userId, addPermission);
  const paramListId = req.params.listId;
  const paramParentId = req.params.parentId;

  // Issue #5897: create a Linked Card. When linkedId is provided, the new card
  // references an existing card (via Card.link, type cardType-linkedCard)
  // instead of holding its own content. Linking across boards is allowed: the
  // caller must have read access to the linked card's board.
  if (req.body.linkedId) {
    const sourceCard = await ReactiveCache.getCard(req.body.linkedId);
    if (!sourceCard) {
      sendJsonResult(res, { code: 404, data: { error: 'linkedId card not found' } });
      return;
    }
    await Authentication.checkBoardAccess(req.userId, sourceCard.boardId);
    const siblingCards = await ReactiveCache.getCards(
      { listId: paramListId, archived: false },
      { sort: ['sort'] },
    );
    const linkedSort = siblingCards.length;
    const linkedNewId = await sourceCard.link(paramBoardId, req.body.swimlaneId, paramListId);
    const linkedNextCardNumber = await board.getNextCardNumber();
    await Cards.direct.updateAsync(
      { _id: linkedNewId },
      { $set: { cardNumber: linkedNextCardNumber, sort: linkedSort } },
    );
    sendJsonResult(res, { code: 200, data: { _id: linkedNewId } });
    const linkedCard = await ReactiveCache.getCard(linkedNewId);
    // GHSA-6jr3-42jf-vhm5: attribution comes from the session, not the body.
    noteAuthorSpoof(req, 'POST cards (linked)');
    await cardCreation(req.userId, linkedCard);
    return;
  }

  // GHSA-jvv9-498p-hxrg: the same read check the linked-card branch above makes
  // for `linkedId`, for the parent card. A parent on another board is only
  // allowed when the caller may see that board; otherwise creating one card
  // would publish that board's ancestor cards to everyone subscribed here.
  await assertParentCardIsVisible(req.userId, paramParentId);

  const nextCardNumber = await board.getNextCardNumber();

  const customFields = await ReactiveCache.getCustomFields({ boardIds: paramBoardId });
  const customFieldsArr = [];
  (customFields || []).forEach(field => {
    if (field.automaticallyOnCard || field.alwaysOnCard) {
      customFieldsArr.push({ _id: field._id, value: null });
    }
  });

  const currentCards = await ReactiveCache.getCards(
    { listId: paramListId, archived: false },
    { sort: ['sort'] },
  );
  // GHSA-6jr3-42jf-vhm5: attribution comes from the SESSION, not from the
  // request body. `authorId` was taken as given after checking only that such a
  // user exists, so any board member could record a card creation, a card
  // deletion or a custom field as somebody else's - the board's own history,
  // written by whoever called the endpoint. The same spoofing was fixed for
  // comments in 8.19 and for the card PUT handler, and these paths were missed.
  const checkUser = await ReactiveCache.getUser(req.userId);
  // #2875: normalize members/assignees so a card can be created with none, and so
  // a `null`/`""` payload never persists as null (which breaks UI editing — see
  // #3697). Omit the field entirely when not provided so the schema default ([])
  // applies. Same coercion the card PUT handler uses.
  // GHSA-whxm-pxgj-7wqv: only ACTIVE members of this board may be named, the
  // same rule the merge endpoint has enforced since #5998.
  const postBoard = await ReactiveCache.getBoard(paramBoardId);
  const members = req.body.members !== undefined
    ? await assignableOnBoard(postBoard, coerceRestArrayParam(req.body.members))
    : undefined;
  const assignees = req.body.assignees !== undefined
    ? await assignableOnBoard(postBoard, coerceRestArrayParam(req.body.assignees))
    : undefined;
  if (typeof checkUser !== 'undefined') {
    // Issue #5537: accept card dates on create. These schema fields are typed
    // as Date, so a raw request string is stripped by schema cleaning and the
    // date never persists. Parse each into a real Date and only include the
    // ones that parsed, so an invalid/absent date simply leaves the field unset.
    const dateFieldsOnCreate = {};
    ['receivedAt', 'startAt', 'dueAt', 'endAt'].forEach(dateField => {
      if (Object.prototype.hasOwnProperty.call(req.body, dateField)) {
        const parsed = parseCardDate(req.body[dateField]);
        if (parsed) {
          dateFieldsOnCreate[dateField] = parsed;
        }
      }
    });
    const id = await Cards.direct.insertAsync({
      title: req.body.title,
      boardId: paramBoardId,
      listId: paramListId,
      parentId: paramParentId,
      description: req.body.description,
      userId: req.userId,
      swimlaneId: req.body.swimlaneId,
      sort: currentCards.length,
      cardNumber: nextCardNumber,
      customFields: customFieldsArr,
      members,
      assignees,
      ...dateFieldsOnCreate,
    });
    sendJsonResult(res, { code: 200, data: { _id: id } });

    const card = await ReactiveCache.getCard(id);
    noteAuthorSpoof(req, 'POST cards');
    await cardCreation(req.userId, card);
  } else {
    sendJsonResult(res, { code: 401 });
  }
});

// Issue #4743: deleting and recreating hundreds of cards via one HTTP request
// per card pegs the CPU and makes WeKan unreachable. This bulk endpoint creates
// many cards in a single request, so a sync job no longer has to fan out
// hundreds of POST calls. Card numbers come from the atomic per-board counter
// (see Board.getNextCardNumber, Issue #5813), so they stay unique even here.
//
// Body: { authorId, swimlaneId, cards: [ { title, description, swimlaneId?,
//         authorId?, members?, assignees? }, ... ] }
// authorId/swimlaneId at the top level are defaults; each card may override them.
const BULK_CARDS_MAX = 500;
WebApp.handlers.post(
  '/api/boards/:boardId/lists/:listId/cards/bulk',
  async function(req, res) {
    Authentication.checkLoggedIn(req.userId);
    const paramBoardId = req.params.boardId;
    const board = await ReactiveCache.getBoard(paramBoardId);
    const addPermission = allowIsBoardMemberWithWriteAccess(req.userId, board);
    await Authentication.checkAdminOrCondition(req.userId, addPermission);
    const paramListId = req.params.listId;

    const cardsInput = req.body.cards;
    if (!Array.isArray(cardsInput) || cardsInput.length === 0) {
      sendJsonResult(res, { code: 400, data: { error: 'cards must be a non-empty array' } });
      return;
    }
    if (cardsInput.length > BULK_CARDS_MAX) {
      sendJsonResult(res, {
        code: 400,
        data: { error: `cards array too large (max ${BULK_CARDS_MAX} per request)` },
      });
      return;
    }

    const customFields = await ReactiveCache.getCustomFields({ boardIds: paramBoardId });
    const customFieldsArr = [];
    (customFields || []).forEach(field => {
      if (field.automaticallyOnCard || field.alwaysOnCard) {
        customFieldsArr.push({ _id: field._id, value: null });
      }
    });

    const currentCards = await ReactiveCache.getCards(
      { listId: paramListId, archived: false },
      { sort: ['sort'] },
    );
    const baseSort = currentCards.length;

    const results = [];
    for (let i = 0; i < cardsInput.length; i++) {
      const input = cardsInput[i] || {};
      // GHSA-6jr3-42jf-vhm5: the session identity, not the body's - per card,
      // because the bulk form let each entry name its own author too.
      noteAuthorSpoof(req, 'POST cards/bulk');
      const authorId = req.userId;
      const swimlaneId = input.swimlaneId || req.body.swimlaneId;
      const checkUser = await ReactiveCache.getUser(authorId);
      if (typeof checkUser === 'undefined') {
        results.push({ index: i, error: 'authorId not found' });
        continue;
      }
      // getNextCardNumber() is an atomic per-board counter, so calling it once
      // per card in this loop still yields unique, sequential numbers.
      const nextCardNumber = await board.getNextCardNumber();
      const id = await Cards.direct.insertAsync({
        title: input.title,
        boardId: paramBoardId,
        listId: paramListId,
        parentId: input.parentId,
        description: input.description,
        userId: authorId,
        swimlaneId,
        sort: baseSort + i,
        cardNumber: nextCardNumber,
        customFields: customFieldsArr,
        // #2875: same normalization as the single-card create above.
        // GHSA-whxm-pxgj-7wqv: and the same board-membership rule.
        members: input.members !== undefined
          ? await assignableOnBoard(board, coerceRestArrayParam(input.members))
          : undefined,
        assignees: input.assignees !== undefined
          ? await assignableOnBoard(board, coerceRestArrayParam(input.assignees))
          : undefined,
      });
      const card = await ReactiveCache.getCard(id);
      await cardCreation(authorId, card);
      results.push({ index: i, _id: id });
    }

    sendJsonResult(res, { code: 200, data: results });
  },
);

WebApp.handlers.get('/api/boards/:boardId/cards_count', async function(req, res) {
  try {
    const paramBoardId = req.params.boardId;
    await Authentication.checkBoardAccess(req.userId, paramBoardId);
    const cards = await ReactiveCache.getCards({
      boardId: paramBoardId,
      archived: false,
    });
    sendJsonResult(res, {
      code: 200,
      data: { board_cards_count: cards.length },
    });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});

WebApp.handlers.get('/api/boards/:boardId/lists/:listId/cards_count', async function(req, res) {
  try {
    const paramBoardId = req.params.boardId;
    const paramListId = req.params.listId;
    await Authentication.checkBoardAccess(req.userId, paramBoardId);
    const cards = await ReactiveCache.getCards({
      boardId: paramBoardId,
      listId: paramListId,
      archived: false,
    });
    sendJsonResult(res, {
      code: 200,
      data: { list_cards_count: cards.length },
    });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});

WebApp.handlers.put(
  '/api/boards/:boardId/lists/:listId/cards/:cardId',
  async function(req, res) {
    const paramBoardId = req.params.boardId;
    const paramCardId = req.params.cardId;
    const paramListId = req.params.listId;
    // Issue #5398: consolidate the board-move parameters into one consistent set
    // instead of re-reading them under several inconsistent names. The external
    // API contract is unchanged: full move uses newBoardId/newSwimlaneId/
    // newListId, a same-board move uses listId/swimlaneId.
    const moveParams = normalizeMoveParams(req.body);
    const { newBoardId, newSwimlaneId, newListId } = moveParams;
    let updated = false;
    await Authentication.checkBoardWriteAccess(req.userId, paramBoardId);

    if (req.body.title) {
      const newTitle =
        req.body.title.length > 1000 ? req.body.title.substring(0, 1000) : req.body.title;
      if (process.env.DEBUG === 'true' && newTitle !== req.body.title) {
        console.warn('Sanitized card title input:', req.body.title, '->', newTitle);
      }
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false },
        { $set: { title: newTitle } },
      );
      updated = true;
    }
    if (req.body.sort) {
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false },
        { $set: { sort: req.body.sort } },
      );
      updated = true;
    }
    if (req.body.parentId) {
      // GHSA-jvv9-498p-hxrg: a parent card may live on another board, and write
      // access HERE says nothing about read access THERE. Without this check a
      // board member could name a card on a private board as the parent and the
      // board publication would then hand that private card to everyone
      // subscribed to this board.
      await assertParentCardIsVisible(req.userId, req.body.parentId);
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false },
        { $set: { parentId: req.body.parentId } },
      );
      updated = true;
    }
    if (req.body.description) {
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false },
        { $set: { description: req.body.description } },
      );
      updated = true;
    }
    if (req.body.color) {
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false },
        { $set: { color: req.body.color } },
      );
      updated = true;
    }
    if (req.body.vote) {
      const newVote = req.body.vote;
      newVote.positive = [];
      newVote.negative = [];
      if (!Object.prototype.hasOwnProperty.call(newVote, 'public')) newVote.public = false;
      if (!Object.prototype.hasOwnProperty.call(newVote, 'allowNonBoardMembers')) {
        newVote.allowNonBoardMembers = false;
      }
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false },
        { $set: { vote: newVote } },
      );
      updated = true;
    }
    if (req.body.poker) {
      const newPoker = req.body.poker;
      newPoker.one = [];
      newPoker.two = [];
      newPoker.three = [];
      newPoker.five = [];
      newPoker.eight = [];
      newPoker.thirteen = [];
      newPoker.twenty = [];
      newPoker.forty = [];
      newPoker.oneHundred = [];
      newPoker.unsure = [];
      if (!Object.prototype.hasOwnProperty.call(newPoker, 'allowNonBoardMembers')) {
        newPoker.allowNonBoardMembers = false;
      }
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false },
        { $set: { poker: newPoker } },
      );
      updated = true;
    }
    if (req.body.labelIds) {
      let newlabelIds = req.body.labelIds;
      if (typeof newlabelIds === 'string') {
        newlabelIds = newlabelIds === '' ? null : [newlabelIds];
      }
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false },
        { $set: { labelIds: newlabelIds } },
      );
      updated = true;
    }
    if (req.body.requestedBy) {
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false },
        { $set: { requestedBy: req.body.requestedBy } },
      );
      updated = true;
    }
    if (req.body.assignedBy) {
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false },
        { $set: { assignedBy: req.body.assignedBy } },
      );
      updated = true;
    }
    // Issue #5846: add/remove card dates. Previously each date was only written
    // when the body value was truthy (if (req.body.receivedAt)), so an empty
    // string / null could not CLEAR a date via the API. Now, whenever the field
    // is present in the request body, an empty string or null unsets the date
    // ($unset) and any other value sets it ($set).
    const dateFields = ['receivedAt', 'startAt', 'dueAt', 'endAt'];
    for (const dateField of dateFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, dateField)) {
        const value = req.body[dateField];
        const isClear = isCardDateClear(value);
        // Issue #5537: these schema fields are typed as Date, so a raw request
        // string is stripped by schema cleaning and the date reverts. Parse a
        // non-clear value into a real Date so it persists. An unparseable value
        // is skipped rather than written (which would have silently dropped it).
        let modifier;
        if (isClear) {
          modifier = { $unset: { [dateField]: '' } };
        } else {
          const parsed = parseCardDate(value);
          if (!parsed) {
            continue;
          }
          modifier = { $set: { [dateField]: parsed } };
        }
        await Cards.direct.updateAsync(
          { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false },
          modifier,
        );
        updated = true;
      }
    }
    if (req.body.spentTime) {
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false },
        { $set: { spentTime: req.body.spentTime } },
      );
      updated = true;
    }
    if (req.body.isOverTime) {
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false },
        { $set: { isOverTime: req.body.isOverTime } },
      );
      updated = true;
    }
    if (req.body.customFields) {
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false },
        { $set: { customFields: req.body.customFields } },
      );
      updated = true;
    }
    // #3697: accept any "clear" payload (null / "" / [] / a single id) and always
    // store a String[] — never null — so removing the last member/assignee over
    // REST works and never leaves a value the UI cannot edit. Use `!== undefined`
    // so an explicit null/"" clears instead of being skipped by a truthiness guard.
    if (req.body.members !== undefined) {
      // GHSA-whxm-pxgj-7wqv: only active members of this board may be named.
      const putBoard = await ReactiveCache.getBoard(paramBoardId);
      const newmembers = await assignableOnBoard(
        putBoard,
        coerceRestArrayParam(req.body.members),
      );
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false },
        { $set: { members: newmembers } },
      );
      updated = true;
    }
    if (req.body.assignees !== undefined) {
      // GHSA-whxm-pxgj-7wqv: same rule for assignees.
      const putAssignBoard = await ReactiveCache.getBoard(paramBoardId);
      const newassignees = await assignableOnBoard(
        putAssignBoard,
        coerceRestArrayParam(req.body.assignees),
      );
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false },
        { $set: { assignees: newassignees } },
      );
      updated = true;
    }
    // #6572: a body that names a swimlane or list belonging to ANOTHER board is
    // refused, and a cross-board move is only ever done by the isBoardMove
    // branch below.
    //
    // The reporter of #6572 tried to work around the client-side move by sending
    // boardId/listId/swimlaneId of the DESTINATION board to this route. Those are
    // not the board-move parameters - isBoardMove needs newBoardId, newSwimlaneId
    // and newListId - so the board move never ran, while these two branches did:
    // the card kept its old boardId and got the destination board's listId and
    // swimlaneId written onto it, which points it at a list and a swimlane that
    // belong to a different board than the card does. It shows on neither board,
    // and it took a hand-written database update to undo.
    //
    // These two branches are for moving WITHIN the board in the URL, so that is
    // what they now enforce; anything else says which parameters to use instead.
    // They are also skipped entirely during a board move: they would rewrite
    // listId before the isBoardMove update runs, and that update's selector pins
    // the card's original listId, so it would then match nothing and silently do
    // nothing - the same inconsistent card, by a different route.
    if (moveParams.swimlaneId && !moveParams.isBoardMove) {
      const sameBoardSwimlane = await ReactiveCache.getSwimlane({
        _id: moveParams.swimlaneId,
        boardId: paramBoardId,
      });
      if (!sameBoardSwimlane) {
        sendJsonResult(res, {
          code: 400,
          data: {
            error: 'swimlaneId does not belong to this board. To move a card to '
              + 'another board, send newBoardId, newSwimlaneId and newListId.',
          },
        });
        return;
      }
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false },
        { $set: { swimlaneId: moveParams.swimlaneId } },
      );
      updated = true;
    }
    if (moveParams.listId && !moveParams.isBoardMove) {
      const sameBoardList = await ReactiveCache.getList({
        _id: moveParams.listId,
        boardId: paramBoardId,
      });
      if (!sameBoardList) {
        sendJsonResult(res, {
          code: 400,
          data: {
            error: 'listId does not belong to this board. To move a card to '
              + 'another board, send newBoardId, newSwimlaneId and newListId.',
          },
        });
        return;
      }
      // Issue #5399: a same-board list move must land the card on TOP of the
      // destination list (like the Move Card dialog: getMinSort then
      // minSort - 1), otherwise it only $set listId and the card landed at a
      // random position. Issue #5398: use the consolidated moveParams.listId and
      // req.userId consistently (it previously read req.body.authorId here).
      const destListId = moveParams.listId;
      const destSiblings = await ReactiveCache.getCards(
        { boardId: paramBoardId, listId: destListId, archived: false },
        { sort: ['sort'] },
      );
      const topSort = computeTopSort((destSiblings || []).map(c => c.sort));
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false },
        { $set: { listId: destListId, sort: topSort } },
      );
      updated = true;

      const card = await ReactiveCache.getCard(paramCardId);
      // cardMove() does fieldNames.includes(...), so this MUST be an array of
      // changed field names — not an object. Passing { fieldName: 'listId' }
      // threw "fieldNames.includes is not a function" (HTTP 500). See #6423.
      await cardMove(req.userId, card, ['listId'], paramListId);
    }
    if (moveParams.isBoardMove) {
      await Authentication.checkBoardWriteAccess(req.userId, newBoardId);
      const destList = await ReactiveCache.getList({
        _id: newListId,
        boardId: newBoardId,
        archived: false,
      });
      if (!destList) {
        sendJsonResult(res, {
          code: 404,
          data: { error: 'Destination list not found or does not belong to destination board' },
        });
        return;
      }
      const destSwimlane = await ReactiveCache.getSwimlane({
        _id: newSwimlaneId,
        boardId: newBoardId,
        archived: false,
      });
      if (!destSwimlane) {
        sendJsonResult(res, {
          code: 404,
          data: { error: 'Destination swimlane not found or does not belong to destination board' },
        });
        return;
      }
      // Issue #5399: land the moved card on TOP of the destination list (like
      // the Move Card dialog) instead of leaving sort unchanged at a random
      // position.
      const destSiblings = await ReactiveCache.getCards(
        { boardId: newBoardId, listId: newListId, archived: false },
        { sort: ['sort'] },
      );
      const topSort = computeTopSort((destSiblings || []).map(c => c.sort));
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false },
        { $set: { boardId: newBoardId, swimlaneId: newSwimlaneId, listId: newListId, sort: topSort } },
      );
      updated = true;

      const card = await ReactiveCache.getCard(paramCardId);
      await cardMove(req.userId, card, ['boardId', 'swimlaneId', 'listId'], newListId, newSwimlaneId, newBoardId);
    }
    // Issue #5546: archive / de-archive a card. The selector intentionally does
    // NOT pin listId: a caller who only wants to set archived=false cannot
    // reliably supply the archived card's listId (the list-scoped GET hides
    // archived cards), so matching on board + card id is enough. `archived:
    // !archive` still guards against a redundant no-op write.
    if ('archive' in req.body) {
      const archive = String(req.body.archive).toLowerCase() === 'true';
      await Cards.direct.updateAsync(
        { _id: paramCardId, boardId: paramBoardId, archived: !archive },
        { $set: { archived: archive } },
      );
      updated = true;
    }
    // Trello-style "complete" checkbox (independent of the due date).
    if ('dueComplete' in req.body) {
      const dueComplete = String(req.body.dueComplete).toLowerCase() === 'true';
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId },
        { $set: { dueComplete } },
      );
      updated = true;
    }
    // Stickers: an array of { icon, highlight } (JSON, or a JSON string when
    // sent form-encoded).
    if (req.body.stickers) {
      let stickers = req.body.stickers;
      if (typeof stickers === 'string') stickers = JSON.parse(stickers);
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId },
        { $set: { stickers } },
      );
      updated = true;
    }
    // Locations: an array of { name, address, latitude, longitude } (JSON, or a
    // JSON string when sent form-encoded).
    if (req.body.locations) {
      let locations = req.body.locations;
      if (typeof locations === 'string') locations = JSON.parse(locations);
      // Each location entry requires an `_id` (schema), and coordinates must be
      // numbers (form-encoded values arrive as strings).
      locations = locations.map(loc => {
        const out = {
          _id: loc._id || Random.id(),
          name: loc.name || '',
          address: loc.address || '',
        };
        if (loc.latitude !== undefined && loc.latitude !== '')
          out.latitude = Number(loc.latitude);
        if (loc.longitude !== undefined && loc.longitude !== '')
          out.longitude = Number(loc.longitude);
        return out;
      });
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId },
        { $set: { locations } },
      );
      updated = true;
    }

    if (!updated) {
      sendJsonResult(res, { code: 404, data: { message: 'Error' } });
      return;
    }

    sendJsonResult(res, { code: 200, data: { _id: paramCardId } });
  },
);

WebApp.handlers.delete(
  '/api/boards/:boardId/lists/:listId/cards/:cardId',
  async function(req, res) {
    const paramBoardId = req.params.boardId;
    const paramListId = req.params.listId;
    const paramCardId = req.params.cardId;
    await Authentication.checkBoardWriteAccess(req.userId, paramBoardId);

    // GHSA-8cqr-x6m5-v4w6: the card is fetched with the BOARD the caller was
    // authorised on, not by its id alone. A bare primary-key lookup answered
    // with any board's card, and cardRemover below then destroyed that card's
    // checklists, comments, activities and subcard tree - irreversibly, on a
    // board the caller could not even read - while the triple-key removal that
    // follows quietly matched nothing and the endpoint still answered 200. The
    // bulk endpoint has always constrained its lookup this way; this one did
    // not. A card that is not on this board is now simply not found.
    const card = await ReactiveCache.getCard({
      _id: paramCardId,
      boardId: paramBoardId,
    });
    // An id that names a card, but not one on the board the caller was
    // authorised for, is the attempt this fix refuses - so it is recorded and
    // shows in Admin Panel / Problems. A card id that names nothing at all is
    // an ordinary 404 and is not logged.
    if (!card) {
      const elsewhere = await ReactiveCache.getCard(paramCardId);
      if (elsewhere) {
        try {
          require('/server/lib/securityLog').record({
            key: 'authz.card-delete', action: 'blocked', source: 'DELETE /api/boards/:boardId/lists/:listId/cards/:cardId',
            userId: req.userId,
            detail: `refused delete of card ${paramCardId} on board ${elsewhere.boardId} via board ${paramBoardId}`,
          });
        } catch (e) { /* logging must never break the guard */ }
      }
    }
    // Remove the card's checklists, checklist items, comments and attachments
    // BEFORE removing the card itself, so their before.remove hooks still find
    // the parent card (otherwise they dereference an undefined card and crash
    // SyncedCron with an unhandled rejection). `Cards.direct.removeAsync`
    // bypasses Cards.before.remove, so cardRemover is not run twice.
    if (card) {
      noteAuthorSpoof(req, 'DELETE card');
      await cardRemover(req.userId, card);
    }
    await Cards.direct.removeAsync({
      _id: paramCardId,
      listId: paramListId,
      boardId: paramBoardId,
    });
    // Issue #1587: Cards.direct.removeAsync bypasses Cards.before.remove, so log
    // the deleteCard activity here too (outgoing-webhook fires on delete).
    if (card) {
      await Activities.insertAsync(
        buildDeleteCardActivity({
          userId: req.userId,
          cardId: card._id,
          boardId: card.boardId,
          listId: card.listId,
          swimlaneId: card.swimlaneId,
          cardTitle: card.title,
        }),
      );
    }
    sendJsonResult(res, { code: 200, data: { _id: paramCardId } });
  },
);

// Issue #4743: bulk delete cards in one request instead of one DELETE per card.
// Body: { cardIds: [ ... ], authorId? }
// Only cards that belong to :boardId are removed; unknown/foreign ids are
// reported back in notFound so the caller can reconcile.
WebApp.handlers.delete('/api/boards/:boardId/cards/bulk', async function(req, res) {
  const paramBoardId = req.params.boardId;
  await Authentication.checkBoardWriteAccess(req.userId, paramBoardId);

  const cardIds = req.body.cardIds;
  if (!Array.isArray(cardIds) || cardIds.length === 0) {
    sendJsonResult(res, { code: 400, data: { error: 'cardIds must be a non-empty array' } });
    return;
  }
  if (cardIds.length > BULK_CARDS_MAX) {
    sendJsonResult(res, {
      code: 400,
      data: { error: `cardIds array too large (max ${BULK_CARDS_MAX} per request)` },
    });
    return;
  }

  const deleted = [];
  const notFound = [];
  for (const cardId of cardIds) {
    const card = await ReactiveCache.getCard({ _id: cardId, boardId: paramBoardId });
    if (!card) {
      notFound.push(cardId);
      continue;
    }
    // Remove sub-items (checklists, items, comments, attachments) before the
    // card itself so their before.remove hooks still find the parent card.
    noteAuthorSpoof(req, 'DELETE cards/bulk');
    await cardRemover(req.userId, card);
    await Cards.direct.removeAsync({ _id: cardId, boardId: paramBoardId });
    // Issue #1587: Cards.direct.removeAsync bypasses Cards.before.remove, so log
    // the deleteCard activity here too (outgoing-webhook fires on delete).
    await Activities.insertAsync(
      buildDeleteCardActivity({
        userId: req.userId,
        cardId: card._id,
        boardId: card.boardId,
        listId: card.listId,
        swimlaneId: card.swimlaneId,
        cardTitle: card.title,
      }),
    );
    deleted.push(cardId);
  }

  sendJsonResult(res, { code: 200, data: { deleted, notFound } });
});

// Issue #5819: bulk add/remove labels across many cards in one request, MERGING
// (add labels without dropping existing ones, remove specific labels) instead
// of the replace-the-whole-array behavior of PUT card labelIds.
// Body: { cardIds: [ ... ], addLabelIds: [ ... ], removeLabelIds: [ ... ] }
WebApp.handlers.post('/api/boards/:boardId/cards/labels', async function(req, res) {
  const paramBoardId = req.params.boardId;
  await Authentication.checkBoardWriteAccess(req.userId, paramBoardId);

  const cardIds = req.body.cardIds;
  if (!Array.isArray(cardIds) || cardIds.length === 0) {
    sendJsonResult(res, { code: 400, data: { error: 'cardIds must be a non-empty array' } });
    return;
  }
  if (cardIds.length > BULK_CARDS_MAX) {
    sendJsonResult(res, {
      code: 400,
      data: { error: `cardIds array too large (max ${BULK_CARDS_MAX} per request)` },
    });
    return;
  }
  const addLabelIds = Array.isArray(req.body.addLabelIds) ? req.body.addLabelIds : [];
  const removeLabelIds = Array.isArray(req.body.removeLabelIds) ? req.body.removeLabelIds : [];
  if (addLabelIds.length === 0 && removeLabelIds.length === 0) {
    sendJsonResult(res, {
      code: 400,
      data: { error: 'provide at least one of addLabelIds or removeLabelIds' },
    });
    return;
  }

  // Validate that every label being added actually exists on this board.
  const board = await ReactiveCache.getBoard(paramBoardId);
  const boardLabelIds = new Set((board.labels || []).map(label => label._id));
  const invalidLabelIds = addLabelIds.filter(labelId => !boardLabelIds.has(labelId));
  if (invalidLabelIds.length > 0) {
    sendJsonResult(res, {
      code: 400,
      data: { error: 'addLabelIds contains labels not on this board', invalidLabelIds },
    });
    return;
  }

  // ONE read for every card, not one per card.
  //
  // This used to await a getCard per id and then an update per id - at the
  // BULK_CARDS_MAX of 500 that is a thousand round-trips, issued one at a time,
  // for a single request. The reads are all the same question, so they are one
  // `$in` query; the writes genuinely differ (each card merges its own labels),
  // so they stay individual, but they are issued TOGETHER instead of each
  // waiting for the last.
  const cards = await ReactiveCache.getCards(
    { _id: { $in: cardIds }, boardId: paramBoardId, archived: false },
    { fields: { _id: 1, labelIds: 1 } },
  );
  const cardById = new Map((cards || []).map(card => [card._id, card]));

  const updated = [];
  const notFound = [];
  const writes = [];
  // Iterate cardIds, not the query result: the response has to preserve the
  // caller's order and report the ids that matched nothing.
  for (const cardId of cardIds) {
    const card = cardById.get(cardId);
    if (!card) {
      notFound.push(cardId);
      continue;
    }
    // Merge: keep existing minus removed, then add new ones, de-duplicated.
    const merged = mergeLabelIds(card.labelIds, addLabelIds, removeLabelIds);
    writes.push(
      Cards.direct.updateAsync(
        { _id: cardId, boardId: paramBoardId, archived: false },
        { $set: { labelIds: merged } },
      ),
    );
    updated.push({ _id: cardId, labelIds: merged });
  }

  // Every write must land before the 200 says they did.
  await Promise.all(writes);

  sendJsonResult(res, { code: 200, data: { updated, notFound } });
});

WebApp.handlers.get(
  '/api/boards/:boardId/cardsByCustomField/:customFieldId/:customFieldValue',
  async function(req, res) {
    const paramBoardId = req.params.boardId;
    const paramCustomFieldId = req.params.customFieldId;
    const paramCustomFieldValue = req.params.customFieldValue;
    await Authentication.checkBoardAccess(req.userId, paramBoardId);
    sendJsonResult(res, {
      code: 200,
      data: await ReactiveCache.getCards({
        boardId: paramBoardId,
        customFields: {
          $elemMatch: { _id: paramCustomFieldId, value: paramCustomFieldValue },
        },
        archived: false,
      }),
    });
  },
);

WebApp.handlers.post(
  '/api/boards/:boardId/lists/:listId/cards/:cardId/customFields/:customFieldId',
  async function(req, res) {
    const paramBoardId = req.params.boardId;
    const paramCardId = req.params.cardId;
    const paramListId = req.params.listId;
    const paramCustomFieldId = req.params.customFieldId;
    const paramCustomFieldValue = req.body.value;
    await Authentication.checkBoardWriteAccess(req.userId, paramBoardId);
    const card = await ReactiveCache.getCard({
      _id: paramCardId,
      listId: paramListId,
      boardId: paramBoardId,
      archived: false,
    });
    if (!card) {
      throw new Meteor.Error(404, 'Card not found');
    }
    const updatedCustomFields = (card.customFields || []).map(cf =>
      cf._id === paramCustomFieldId ? { _id: cf._id, value: paramCustomFieldValue } : cf,
    );
    await Cards.direct.updateAsync(
      { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false },
      { $set: { customFields: updatedCustomFields } },
    );
    sendJsonResult(res, {
      code: 200,
      data: { _id: paramCardId, customFields: updatedCustomFields },
    });
  },
);

WebApp.handlers.post(
  '/api/boards/:boardId/lists/:listId/cards/:cardId/archive',
  async function(req, res) {
    const paramBoardId = req.params.boardId;
    const paramCardId = req.params.cardId;
    const paramListId = req.params.listId;
    await Authentication.checkBoardWriteAccess(req.userId, paramBoardId);
    const card = await ReactiveCache.getCard({
      _id: paramCardId,
      listId: paramListId,
      boardId: paramBoardId,
      archived: false,
    });
    if (!card) {
      throw new Meteor.Error(404, 'Card not found');
    }
    await card.archive();
    sendJsonResult(res, {
      code: 200,
      data: { _id: paramCardId, archived: true, archivedAt: new Date() },
    });
  },
);

WebApp.handlers.post(
  '/api/boards/:boardId/lists/:listId/cards/:cardId/unarchive',
  async function(req, res) {
    const paramBoardId = req.params.boardId;
    const paramCardId = req.params.cardId;
    const paramListId = req.params.listId;
    await Authentication.checkBoardWriteAccess(req.userId, paramBoardId);
    const card = await ReactiveCache.getCard({
      _id: paramCardId,
      listId: paramListId,
      boardId: paramBoardId,
      archived: true,
    });
    if (!card) {
      throw new Meteor.Error(404, 'Card not found');
    }
    await card.restore();
    sendJsonResult(res, {
      code: 200,
      data: { _id: paramCardId, archived: false },
    });
  },
);

// Issue #5998: add/remove a single board member to/from a card as a card member
// or assignee, MERGE-style ($addToSet/$pull via Card.assignMember etc.), so
// callers don't have to read-modify-write the whole members/assignees array.
// The userId must be an active member of the card's board, otherwise 400.
async function cardMemberFieldHandler(req, res, field, paramUserKey, addNotRemove) {
  const paramBoardId = req.params.boardId;
  const paramListId = req.params.listId;
  const paramCardId = req.params.cardId;
  const targetUserId = req.params[paramUserKey];
  await Authentication.checkBoardWriteAccess(req.userId, paramBoardId);

  const card = await ReactiveCache.getCard({
    _id: paramCardId,
    listId: paramListId,
    boardId: paramBoardId,
    archived: false,
  });
  if (!card) {
    sendJsonResult(res, { code: 404, data: { error: 'Card not found' } });
    return;
  }

  if (addNotRemove) {
    // Only validate board membership when ADDING; removing a stale id is allowed.
    const board = await ReactiveCache.getBoard(paramBoardId);
    if (!canAssignCardMember(board, targetUserId)) {
      sendJsonResult(res, {
        code: 400,
        data: { error: 'userId is not an active member of this board' },
      });
      return;
    }
  }

  if (field === 'members') {
    await (addNotRemove ? card.assignMember(targetUserId) : card.unassignMember(targetUserId));
  } else {
    await (addNotRemove ? card.assignAssignee(targetUserId) : card.unassignAssignee(targetUserId));
  }

  const updated = await ReactiveCache.getCard(paramCardId);
  sendJsonResult(res, {
    code: 200,
    data: { _id: paramCardId, members: updated.members || [], assignees: updated.assignees || [] },
  });
}

WebApp.handlers.post(
  '/api/boards/:boardId/lists/:listId/cards/:cardId/members/:memberId',
  async function(req, res) {
    await cardMemberFieldHandler(req, res, 'members', 'memberId', true);
  },
);
WebApp.handlers.delete(
  '/api/boards/:boardId/lists/:listId/cards/:cardId/members/:memberId',
  async function(req, res) {
    await cardMemberFieldHandler(req, res, 'members', 'memberId', false);
  },
);
WebApp.handlers.post(
  '/api/boards/:boardId/lists/:listId/cards/:cardId/assignees/:assigneeId',
  async function(req, res) {
    await cardMemberFieldHandler(req, res, 'assignees', 'assigneeId', true);
  },
);
WebApp.handlers.delete(
  '/api/boards/:boardId/lists/:listId/cards/:cardId/assignees/:assigneeId',
  async function(req, res) {
    await cardMemberFieldHandler(req, res, 'assignees', 'assigneeId', false);
  },
);

// Copy a card to the same or a different board/swimlane/list, at a 0-based
// `position` counted from the top of the destination list. Deep copy is handled
// by Card.copy (comments, checklists, attachments, custom field values).
// Body: { toBoardId?, toSwimlaneId?, toListId?, position? }
WebApp.handlers.post(
  '/api/boards/:boardId/lists/:listId/cards/:cardId/copy',
  async function(req, res) {
    const paramBoardId = req.params.boardId;
    const paramListId = req.params.listId;
    const paramCardId = req.params.cardId;
    await Authentication.checkBoardWriteAccess(req.userId, paramBoardId);

    const toBoardId = req.body.toBoardId || paramBoardId;
    const toSwimlaneId = req.body.toSwimlaneId;
    const toListId = req.body.toListId || paramListId;
    if (!toSwimlaneId) {
      sendJsonResult(res, { code: 400, data: { error: 'toSwimlaneId is required' } });
      return;
    }
    // Require write access on the destination board too (may differ from source).
    await Authentication.checkBoardWriteAccess(req.userId, toBoardId);

    const card = await ReactiveCache.getCard({
      _id: paramCardId,
      listId: paramListId,
      boardId: paramBoardId,
    });
    if (!card) {
      sendJsonResult(res, { code: 404, data: { error: 'Card not found' } });
      return;
    }

    const newId = await card.copy(toBoardId, toSwimlaneId, toListId);

    if (Object.prototype.hasOwnProperty.call(req.body, 'position')) {
      const siblings = await ReactiveCache.getCards(
        { listId: toListId, archived: false, _id: { $ne: newId } },
        { sort: ['sort'] },
      );
      const newSort = computeSortForIndex(siblings, Number(req.body.position));
      await Cards.direct.updateAsync({ _id: newId }, { $set: { sort: newSort } });
    }

    sendJsonResult(res, { code: 200, data: { _id: newId } });
  },
);

// GHSA-6jr3-42jf-vhm5: a request body that still carries `authorId` naming
// somebody OTHER than the session is the attempt this fix refuses - the value is
// ignored either way now, and naming yourself is what an old client does, so only
// the mismatch is recorded. Shows in Admin Panel / Problems.
function noteAuthorSpoof(req, source) {
  try {
    const claimed = req.body && req.body.authorId;
    if (!claimed || String(claimed) === String(req.userId)) return;
    require('/server/lib/securityLog').record({
      key: 'spoofing.author', action: 'ignored', source,
      userId: req.userId,
      detail: `ignored authorId "${claimed}" from the body; recorded the session instead`,
    });
  } catch (e) { /* logging must never break the guard */ }
}

// GHSA-whxm-pxgj-7wqv: who may be put on a card, in the ARRAY form.
//
// `POST .../cards` and `PUT .../cards/{cardId}` take `members` and `assignees`
// as arrays and stored them exactly as given. The merge endpoint
// `POST .../cards/{cardId}/members/{memberId}` has enforced since #5998 that the
// user must be an ACTIVE member of the card's board; the array form bypassed
// that, so a member of a private board could put any user id on a card - and
// `GET /api/user/cards`, which lists by card membership, then handed that
// outsider the private board's card titles, ids and dates, while their direct
// read of the board stayed Forbidden.
//
// One rule for every shape. An id that may not be assigned is dropped rather
// than refused, so a bulk edit does not fail over one stale id, and the caller
// sees what was kept in the answer.
async function assignableOnBoard(board, ids, source) {
  const out = [];
  const refused = [];
  for (const id of Array.isArray(ids) ? ids : []) {
    if (canAssignCardMember(board, id)) out.push(id);
    else if (id) refused.push(id);
  }
  // Naming somebody who is not on this board is the attempt, so it is recorded
  // and shows in Admin Panel / Problems rather than being dropped in silence.
  if (refused.length) {
    try {
      require('/server/lib/securityLog').record({
        key: 'authz.card-member', action: 'blocked', source: source || 'card members/assignees',
        detail: `refused ${refused.length} id(s) not active on board ${board && board._id}: ${refused.join(' ')}`,
      });
    } catch (e) { /* logging must never break the guard */ }
  }
  return out;
}

// Issue #4815: get the current user's cards (cards where they are a member or
// assignee). ?due=true returns only cards that have a due date; ?from= and ?to=
// (ISO 8601) restrict due cards to a date range. Returns a compact field set.
WebApp.handlers.get('/api/user/cards', async function(req, res) {
  // Return a clean 401 rather than letting checkLoggedIn throw (which under
  // Express 4 would leave the request hanging instead of responding).
  if (!req.userId) {
    sendJsonResult(res, { code: 401, data: { error: 'Unauthorized' } });
    return;
  }
  const userId = req.userId;

  const selector = {
    archived: false,
    $or: [
      { members: userId }, { assignees: userId },
      { requesters: userId }, { assigners: userId },
    ],
  };

  const url = new URL(req.url, 'http://localhost');
  const dueOnly = ['true', '1', 'yes'].includes(
    String(url.searchParams.get('due') || '').toLowerCase(),
  );
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  if (dueOnly || from || to) {
    selector.dueAt = { $exists: true, $ne: null };
    if (from) {
      selector.dueAt.$gte = new Date(from);
    }
    if (to) {
      selector.dueAt.$lte = new Date(to);
    }
  }

  const cards = await ReactiveCache.getCards(selector, { sort: { dueAt: 1 } });

  // GHSA-whxm-pxgj-7wqv: card membership is not board access. This listed every
  // card naming the caller, so being placed on a card of a board they cannot
  // read - which the array form above used to allow - disclosed that private
  // board's card titles, ids and dates. Both halves are fixed: nobody outside a
  // board can be put on its cards any more, and the answer is filtered here as
  // well, so a card placed before this release stops leaking too.
  const boardIds = [...new Set((cards || []).map(card => card.boardId).filter(Boolean))];
  const visible = boardIds.length
    ? await ReactiveCache.getBoards(
        {
          _id: { $in: boardIds },
          members: { $elemMatch: { userId, isActive: true } },
        },
        { fields: { _id: 1 } },
      )
    : [];
  const allowed = new Set((visible || []).map(board => board._id));
  const readable = (cards || []).filter(card => allowed.has(card.boardId));

  sendJsonResult(res, {
    code: 200,
    data: readable.map(card => ({
      _id: card._id,
      title: card.title,
      boardId: card.boardId,
      swimlaneId: card.swimlaneId,
      listId: card.listId,
      dueAt: card.dueAt,
      startAt: card.startAt,
      endAt: card.endAt,
      members: card.members || [],
      assignees: card.assignees || [],
    })),
  });
});
