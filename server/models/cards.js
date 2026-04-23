import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { check } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import { add, now } from '/imports/lib/dateUtils';
import { Authentication } from '/server/authentication';
import { sendJsonResult } from '/server/apiMiddleware';
import { allowIsBoardMember, allowIsBoardMemberCommentOnly } from '/server/lib/utils';
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

Meteor.methods({
  async createCardWithDueDate(boardId, listId, title, dueDate, swimlaneId) {
    check(boardId, String);
    check(listId, String);
    check(title, String);
    check(dueDate, Date);
    check(swimlaneId, String);
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

    const isMember = allowIsBoardMember(this.userId, board);
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
    if (!allowIsBoardMember(this.userId, board)) throw new Meteor.Error('not-authorized');

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
    if (!allowIsBoardMember(this.userId, board)) throw new Meteor.Error('not-authorized');

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
    if (!allowIsBoardMember(this.userId, board)) throw new Meteor.Error('not-authorized');

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
    if (!allowIsBoardMember(this.userId, board)) throw new Meteor.Error('not-authorized');

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
    if (!allowIsBoardMember(this.userId, board)) throw new Meteor.Error('not-authorized');

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
    if (!allowIsBoardMember(this.userId, board)) throw new Meteor.Error('not-authorized');

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
    if (!allowIsBoardMember(this.userId, board)) throw new Meteor.Error('not-authorized');

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
    if (!allowIsBoardMember(this.userId, board)) throw new Meteor.Error('not-authorized');

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
    if (!allowIsBoardMember(this.userId, board)) throw new Meteor.Error('not-authorized');

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
    if (!allowIsBoardMember(this.userId, board)) throw new Meteor.Error('not-authorized');

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
    if (!allowIsBoardMember(this.userId, board)) throw new Meteor.Error('not-authorized');

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

    const isMember = allowIsBoardMember(this.userId, board);
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

    const card = await ReactiveCache.getCard(cardId);
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
  await Cards._collection.createIndexAsync({ modifiedAt: -1 });
  await Cards._collection.createIndexAsync({ boardId: 1, createdAt: -1 });
  await Cards._collection.createIndexAsync({ parentId: 1 });
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

Cards.after.update(async function(userId, doc, fieldNames) {
  const previous = this.previous || {};
  const oldListId = previous.listId || doc.listId;
  const oldSwimlaneId = previous.swimlaneId || doc.swimlaneId;
  const oldBoardId = previous.boardId || doc.boardId;
  await cardMove(userId, doc, fieldNames, oldListId, oldSwimlaneId, oldBoardId);
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
    const username = user.username;
    await Activities.insertAsync({
      userId,
      username,
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

Cards.before.remove((userId, doc) => {
  cardRemover(userId, doc);
});

WebApp.handlers.get(
  '/api/boards/:boardId/swimlanes/:swimlaneId/cards',
  async function(req, res) {
    const paramBoardId = req.params.boardId;
    const paramSwimlaneId = req.params.swimlaneId;
    Authentication.checkBoardAccess(req.userId, paramBoardId);
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
  Authentication.checkBoardAccess(req.userId, paramBoardId);
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

WebApp.handlers.get('/api/cards/:cardId', async function(req, res) {
  const paramCardId = req.params.cardId;
  const card = await ReactiveCache.getCard(paramCardId);
  Authentication.checkBoardAccess(req.userId, card.boardId);
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
    Authentication.checkBoardAccess(req.userId, paramBoardId);
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
  const addPermission = allowIsBoardMemberCommentOnly(req.userId, board);
  Authentication.checkAdminOrCondition(req.userId, addPermission);
  const paramListId = req.params.listId;
  const paramParentId = req.params.parentId;
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
  const checkUser = await ReactiveCache.getUser(req.body.authorId);
  const members = req.body.members;
  const assignees = req.body.assignees;
  if (typeof checkUser !== 'undefined') {
    const id = await Cards.direct.insertAsync({
      title: req.body.title,
      boardId: paramBoardId,
      listId: paramListId,
      parentId: paramParentId,
      description: req.body.description,
      userId: req.body.authorId,
      swimlaneId: req.body.swimlaneId,
      sort: currentCards.length,
      cardNumber: nextCardNumber,
      customFields: customFieldsArr,
      members,
      assignees,
    });
    sendJsonResult(res, { code: 200, data: { _id: id } });

    const card = await ReactiveCache.getCard(id);
    await cardCreation(req.body.authorId, card);
  } else {
    sendJsonResult(res, { code: 401 });
  }
});

WebApp.handlers.get('/api/boards/:boardId/cards_count', async function(req, res) {
  try {
    const paramBoardId = req.params.boardId;
    Authentication.checkBoardAccess(req.userId, paramBoardId);
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
    Authentication.checkBoardAccess(req.userId, paramBoardId);
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
    const newBoardId = req.body.newBoardId;
    const newSwimlaneId = req.body.newSwimlaneId;
    const newListId = req.body.newListId;
    let updated = false;
    Authentication.checkBoardWriteAccess(req.userId, paramBoardId);

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
    if (req.body.receivedAt) {
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false },
        { $set: { receivedAt: req.body.receivedAt } },
      );
      updated = true;
    }
    if (req.body.startAt) {
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false },
        { $set: { startAt: req.body.startAt } },
      );
      updated = true;
    }
    if (req.body.dueAt) {
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false },
        { $set: { dueAt: req.body.dueAt } },
      );
      updated = true;
    }
    if (req.body.endAt) {
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false },
        { $set: { endAt: req.body.endAt } },
      );
      updated = true;
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
    if (req.body.members) {
      let newmembers = req.body.members;
      if (typeof newmembers === 'string') {
        newmembers = newmembers === '' ? null : [newmembers];
      }
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false },
        { $set: { members: newmembers } },
      );
      updated = true;
    }
    if (req.body.assignees) {
      let newassignees = req.body.assignees;
      if (typeof newassignees === 'string') {
        newassignees = newassignees === '' ? null : [newassignees];
      }
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false },
        { $set: { assignees: newassignees } },
      );
      updated = true;
    }
    if (req.body.swimlaneId) {
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false },
        { $set: { swimlaneId: req.body.swimlaneId } },
      );
      updated = true;
    }
    if (req.body.listId) {
      const newParamListId = req.body.listId;
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false },
        { $set: { listId: newParamListId } },
      );
      updated = true;

      const card = await ReactiveCache.getCard(paramCardId);
      await cardMove(req.body.authorId, card, { fieldName: 'listId' }, paramListId);
    }
    if (newBoardId && newSwimlaneId && newListId) {
      Authentication.checkBoardWriteAccess(req.userId, newBoardId);
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
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: false },
        { $set: { boardId: newBoardId, swimlaneId: newSwimlaneId, listId: newListId } },
      );
      updated = true;

      const card = await ReactiveCache.getCard(paramCardId);
      await cardMove(req.userId, card, ['boardId', 'swimlaneId', 'listId'], newListId, newSwimlaneId, newBoardId);
    }
    if (req.body.archive) {
      const archive = String(req.body.archive).toLowerCase() === 'true';
      await Cards.direct.updateAsync(
        { _id: paramCardId, listId: paramListId, boardId: paramBoardId, archived: !archive },
        { $set: { archived: archive } },
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
    Authentication.checkBoardWriteAccess(req.userId, paramBoardId);

    const card = await ReactiveCache.getCard(paramCardId);
      await Cards.direct.removeAsync({
      _id: paramCardId,
      listId: paramListId,
      boardId: paramBoardId,
    });
    cardRemover(req.body.authorId, card);
    sendJsonResult(res, { code: 200, data: { _id: paramCardId } });
  },
);

WebApp.handlers.get(
  '/api/boards/:boardId/cardsByCustomField/:customFieldId/:customFieldValue',
  async function(req, res) {
    const paramBoardId = req.params.boardId;
    const paramCustomFieldId = req.params.customFieldId;
    const paramCustomFieldValue = req.params.customFieldValue;
    Authentication.checkBoardAccess(req.userId, paramBoardId);
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
    Authentication.checkBoardWriteAccess(req.userId, paramBoardId);
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
    Authentication.checkBoardWriteAccess(req.userId, paramBoardId);
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
    Authentication.checkBoardWriteAccess(req.userId, paramBoardId);
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
