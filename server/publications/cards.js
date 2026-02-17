import { ReactiveCache } from '/imports/reactiveCache';
import { publishComposite } from 'meteor/reywood:publish-composite';
import escapeForRegex from 'escape-string-regexp';
import Users from '../../models/users';
import {
  formatDateTime,
  formatDate,
  formatTime,
  getISOWeek,
  isValidDate,
  isBefore,
  isAfter,
  isSame,
  add,
  subtract,
  startOf,
  endOf,
  format,
  parseDate,
  now,
  createDate,
  fromNow,
  calendar
} from '/imports/lib/dateUtils';
import Boards from '../../models/boards';
import Lists from '../../models/lists';
import Swimlanes from '../../models/swimlanes';
import Cards from '../../models/cards';
import CardComments from '../../models/cardComments';
import Attachments from '../../models/attachments';
import Checklists from '../../models/checklists';
import ChecklistItems from '../../models/checklistItems';
import SessionData from '../../models/usersessiondata';
import CustomFields from '../../models/customFields';
import {
  DEFAULT_LIMIT,
  OPERATOR_ASSIGNEE,
  OPERATOR_BOARD,
  OPERATOR_COMMENT,
  OPERATOR_CREATED_AT,
  OPERATOR_CREATOR,
  OPERATOR_DEBUG,
  OPERATOR_DUE,
  OPERATOR_HAS,
  OPERATOR_LABEL,
  OPERATOR_LIMIT,
  OPERATOR_LIST,
  OPERATOR_MEMBER,
  OPERATOR_MODIFIED_AT, OPERATOR_ORG,
  OPERATOR_SORT,
  OPERATOR_STATUS,
  OPERATOR_SWIMLANE, OPERATOR_TEAM,
  OPERATOR_USER,
  ORDER_ASCENDING,
  PREDICATE_ALL,
  PREDICATE_ARCHIVED,
  PREDICATE_ASSIGNEES,
  PREDICATE_ATTACHMENT,
  PREDICATE_CHECKLIST,
  PREDICATE_CREATED_AT,
  PREDICATE_DESCRIPTION,
  PREDICATE_DUE_AT,
  PREDICATE_END_AT,
  PREDICATE_ENDED,
  PREDICATE_MEMBERS,
  PREDICATE_MODIFIED_AT,
  PREDICATE_PRIVATE,
  PREDICATE_PUBLIC,
  PREDICATE_START_AT,
  PREDICATE_SYSTEM,
} from '/config/search-const';
import { QueryErrors, QueryParams, Query } from '/config/query-classes';
import { CARD_TYPES } from '../../config/const';
import Org from "../../models/org";
import Team from "../../models/team";

Meteor.publish('card', async cardId => {
  check(cardId, String);

  const userId = Meteor.userId();
  const card = await ReactiveCache.getCard({ _id: cardId });

  if (!card || !card.boardId) {
    return [];
  }

  const board = await ReactiveCache.getBoard({ _id: card.boardId });
  if (!board || !board.isVisibleBy(userId)) {
    return [];
  }

  // If user has assigned-only permissions, check if they're assigned to this card
  if (userId && board.members) {
    const member = _.findWhere(board.members, { userId: userId, isActive: true });
    if (member && (member.isNormalAssignedOnly || member.isCommentAssignedOnly || member.isReadAssignedOnly)) {
      // User with assigned-only permissions can only view cards assigned to them
      if (!card.assignees || !card.assignees.includes(userId)) {
        return []; // Don't publish if user is not assigned
      }
    }
  }

  const ret = await ReactiveCache.getCards(
    { _id: cardId },
    {},
    true,
  );
  return ret;
});

/** publish all data which is necessary to display card details as popup
 * @returns array of cursors
 */
publishComposite('popupCardData', async function(cardId) {
  check(cardId, String);

  const userId = this.userId;
  const card = await ReactiveCache.getCard({ _id: cardId });

  if (!card || !card.boardId) {
    return [];
  }

  const board = await ReactiveCache.getBoard({ _id: card.boardId });
  if (!board || !board.isVisibleBy(userId)) {
    return [];
  }

  // If user has assigned-only permissions, check if they're assigned to this card
  if (userId && board.members) {
    const member = _.findWhere(board.members, { userId: userId, isActive: true });
    if (member && (member.isNormalAssignedOnly || member.isCommentAssignedOnly || member.isReadAssignedOnly)) {
      // User with assigned-only permissions can only view cards assigned to them
      if (!card.assignees || !card.assignees.includes(userId)) {
        return []; // Don't publish if user is not assigned
      }
    }
  }

  return {
    async find() {
      return await ReactiveCache.getCards({ _id: cardId }, {}, true);
    },
    children: [
      {
        async find(card) {
          return await ReactiveCache.getBoards({ _id: card.boardId }, {}, true);
        }
      },
      {
        async find(card) {
          return await ReactiveCache.getLists({ boardId: card.boardId }, {}, true);
        }
      }
    ]
  };
});

Meteor.publish('myCards', async function(sessionId) {
  check(sessionId, String);

  const queryParams = new QueryParams();
  queryParams.addPredicate(OPERATOR_USER, (await ReactiveCache.getCurrentUser()).username);
  queryParams.setPredicate(OPERATOR_LIMIT, 200);

  const query = buildQuery(queryParams);
  query.projection.sort = {
    boardId: 1,
    swimlaneId: 1,
    listId: 1,
  };

  const ret = findCards(sessionId, query);
  return ret;
});

// Optimized due cards publication for better performance
Meteor.publish('dueCards', async function(allUsers = false) {
  check(allUsers, Boolean);

  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }

  if (process.env.DEBUG === 'true') {
    console.log('dueCards publication called for user:', userId, 'allUsers:', allUsers);
  }

  // Get user's board memberships for efficient filtering
  const userBoards = (await ReactiveCache.getBoards({
    $or: [
      { permission: 'public' },
      { members: { $elemMatch: { userId, isActive: true } } }
    ]
  })).map(board => board._id);

  if (process.env.DEBUG === 'true') {
    console.log('dueCards userBoards:', userBoards);
    console.log('dueCards userBoards count:', userBoards.length);

    // Also check if there are any cards with due dates in the system at all
    const allCardsWithDueDates = Cards.find({
      type: 'cardType-card',
      archived: false,
      dueAt: { $exists: true, $nin: [null, ''] }
    }).count();
    console.log('dueCards: total cards with due dates in system:', allCardsWithDueDates);
  }

  if (userBoards.length === 0) {
    if (process.env.DEBUG === 'true') {
      console.log('dueCards: No boards found for user, returning ready');
    }
    return this.ready();
  }

  // Build optimized selector
  const selector = {
    type: 'cardType-card',
    archived: false,
    dueAt: { $exists: true, $nin: [null, ''] },
    boardId: { $in: userBoards }
  };

  // Add user filtering if not showing all users
  if (!allUsers) {
    selector.$or = [
      { members: userId },
      { assignees: userId },
      { userId: userId }
    ];
  }

  const options = {
    sort: { dueAt: 1 }, // Sort by due date ascending (oldest first)
    limit: 100, // Limit results for performance
    fields: {
      title: 1,
      dueAt: 1,
      boardId: 1,
      listId: 1,
      swimlaneId: 1,
      members: 1,
      assignees: 1,
      userId: 1,
      archived: 1,
      type: 1
    }
  };

  if (process.env.DEBUG === 'true') {
    console.log('dueCards selector:', JSON.stringify(selector, null, 2));
    console.log('dueCards options:', JSON.stringify(options, null, 2));
  }

  const result = Cards.find(selector, options);

  if (process.env.DEBUG === 'true') {
    const count = result.count();
    console.log('dueCards publication: returning', count, 'cards');
    if (count > 0) {
      const sampleCards = result.fetch().slice(0, 3);
      console.log('dueCards publication: sample cards:', sampleCards.map(c => ({
        id: c._id,
        title: c.title,
        dueAt: c.dueAt,
        boardId: c.boardId
      })));
    }
  }

  return result;
});

Meteor.publish('globalSearch', async function(sessionId, params, text) {
  check(sessionId, String);
  check(params, Object);
  check(text, String);

  if (process.env.DEBUG === 'true') {
    console.log('globalSearch publication called with:', { sessionId, params, text });
  }

  const ret = findCards(sessionId, await buildQuery(new QueryParams(params, text)));
  if (process.env.DEBUG === 'true') {
    console.log('globalSearch publication returning:', ret);
  }
  return ret;
});

Meteor.publish('sessionData', function(sessionId) {
  check(sessionId, String);
  const userId = Meteor.userId();
  if (process.env.DEBUG === 'true') {
    console.log('sessionData publication called with:', { sessionId, userId });
  }

  const cursor = SessionData.find({ userId, sessionId });
  if (process.env.DEBUG === 'true') {
    console.log('sessionData publication returning cursor with count:', cursor.count());
  }
  return cursor;
});

async function buildSelector(queryParams) {
  const userId = Meteor.userId();

  const errors = new QueryErrors();

  let selector = {};

  // eslint-disable-next-line no-console
  // console.log('queryParams:', queryParams);

  if (queryParams.selector) {
    selector = queryParams.selector;
  } else {
    const boardsSelector = {};

    let archived = false;
    let endAt = null;
    if (queryParams.hasOperator(OPERATOR_STATUS)) {
      queryParams.getPredicates(OPERATOR_STATUS).forEach(status => {
        if (status === PREDICATE_ARCHIVED) {
          archived = true;
        } else if (status === PREDICATE_ALL) {
          archived = null;
        } else if (status === PREDICATE_ENDED) {
          endAt = { $nin: [null, ''] };
        } else if ([PREDICATE_PRIVATE, PREDICATE_PUBLIC].includes(status)) {
          boardsSelector.permission = status;
        }
      });
    }

    if (queryParams.hasOperator(OPERATOR_ORG)) {
      const orgs = [];
      for (const name of queryParams.getPredicates(OPERATOR_ORG)) {
        const org = await ReactiveCache.getOrg({
          $or: [
            { orgDisplayName: name },
            { orgShortName: name }
          ]
        });
        if (org) {
          orgs.push(org._id);
        } else {
          errors.addNotFound(OPERATOR_ORG, name);
        }
      }
      if (orgs.length) {
        boardsSelector.orgs = {
          $elemMatch: { orgId: { $in: orgs }, isActive: true }
        };
      }
    }

    if (queryParams.hasOperator(OPERATOR_TEAM)) {
      const teams = [];
      for (const name of queryParams.getPredicates(OPERATOR_TEAM)) {
        const team = await ReactiveCache.getTeam({
          $or: [
            { teamDisplayName: name },
            { teamShortName: name }
          ]
        });
        if (team) {
          teams.push(team._id);
        } else {
          errors.addNotFound(OPERATOR_TEAM, name);
        }
      }
      if (teams.length) {
        boardsSelector.teams = {
          $elemMatch: { teamId: { $in: teams }, isActive: true }
        };
      }
    }

    selector = {
      type: 'cardType-card',
      // boardId: { $in: Boards.userBoardIds(userId) },
      $and: [],
    };

    if (archived !== null) {
      if (archived) {
        selector.boardId = {
          $in: Boards.userBoardIds(userId, null, boardsSelector),
        };
        selector.$and.push({
          $or: [
            {
              boardId: {
                $in: Boards.userBoardIds(userId, archived, boardsSelector),
              },
            },
            { swimlaneId: { $in: Swimlanes.userArchivedSwimlaneIds(userId) } },
            { listId: { $in: Lists.userArchivedListIds(userId) } },
            { archived: true },
          ],
        });
      } else {
        selector.boardId = {
          $in: Boards.userBoardIds(userId, false, boardsSelector),
        };
        selector.swimlaneId = { $nin: Swimlanes.archivedSwimlaneIds() };
        selector.listId = { $nin: Lists.archivedListIds() };
        selector.archived = false;
      }
    } else {
      const userBoardIds = Boards.userBoardIds(userId, null, boardsSelector);
      if (process.env.DEBUG === 'true') {
        console.log('buildSelector - userBoardIds:', userBoardIds);
      }
      selector.boardId = {
        $in: userBoardIds,
      };
    }
    if (endAt !== null) {
      selector.endAt = endAt;
    }

    if (queryParams.hasOperator(OPERATOR_BOARD)) {
      const queryBoards = [];
      queryParams.getPredicates(OPERATOR_BOARD).forEach(query => {
        const boards = Boards.userSearch(userId, {
          title: new RegExp(escapeForRegex(query), 'i'),
        });
        if (boards.length) {
          boards.forEach(board => {
            queryBoards.push(board._id);
          });
        } else {
          errors.addNotFound(OPERATOR_BOARD, query);
        }
      });

      selector.boardId.$in = queryBoards;
    }

    if (queryParams.hasOperator(OPERATOR_SWIMLANE)) {
      const querySwimlanes = [];
      for (const query of queryParams.getPredicates(OPERATOR_SWIMLANE)) {
        const swimlanes = await ReactiveCache.getSwimlanes({
          title: new RegExp(escapeForRegex(query), 'i'),
        });
        if (swimlanes.length) {
          swimlanes.forEach(swim => {
            querySwimlanes.push(swim._id);
          });
        } else {
          errors.addNotFound(OPERATOR_SWIMLANE, query);
        }
      }

      // eslint-disable-next-line no-prototype-builtins
      if (!selector.swimlaneId.hasOwnProperty('swimlaneId')) {
        selector.swimlaneId = { $in: [] };
      }
      selector.swimlaneId.$in = querySwimlanes;
    }

    if (queryParams.hasOperator(OPERATOR_LIST)) {
      const queryLists = [];
      for (const query of queryParams.getPredicates(OPERATOR_LIST)) {
        const lists = await ReactiveCache.getLists({
          title: new RegExp(escapeForRegex(query), 'i'),
        });
        if (lists.length) {
          lists.forEach(list => {
            queryLists.push(list._id);
          });
        } else {
          errors.addNotFound(OPERATOR_LIST, query);
        }
      }

      // eslint-disable-next-line no-prototype-builtins
      if (!selector.hasOwnProperty('listId')) {
        selector.listId = { $in: [] };
      }
      selector.listId.$in = queryLists;
    }

    if (queryParams.hasOperator(OPERATOR_COMMENT)) {
      const cardIds = CardComments.textSearch(
        userId,
        queryParams.getPredicates(OPERATOR_COMMENT),
        com => {
          return com.cardId;
        },
      );
      if (cardIds.length) {
        selector._id = { $in: cardIds };
      } else {
        queryParams.getPredicates(OPERATOR_COMMENT).forEach(comment => {
          errors.addNotFound(OPERATOR_COMMENT, comment);
        });
      }
    }

    [OPERATOR_DUE, OPERATOR_CREATED_AT, OPERATOR_MODIFIED_AT].forEach(field => {
      if (queryParams.hasOperator(field)) {
        selector[field] = {};
        const predicate = queryParams.getPredicate(field);
        selector[field][predicate.operator] = new Date(predicate.value);
      }
    });

    const queryUsers = {};
    queryUsers[OPERATOR_ASSIGNEE] = [];
    queryUsers[OPERATOR_MEMBER] = [];
    queryUsers[OPERATOR_CREATOR] = [];

    if (queryParams.hasOperator(OPERATOR_USER)) {
      const users = [];
      for (const username of queryParams.getPredicates(OPERATOR_USER)) {
        const user = await ReactiveCache.getUser({ username });
        if (user) {
          users.push(user._id);
        } else {
          errors.addNotFound(OPERATOR_USER, username);
        }
      }
      if (users.length) {
        selector.$and.push({
          $or: [{ members: { $in: users } }, { assignees: { $in: users } }],
        });
      }
    }

    for (const key of [OPERATOR_MEMBER, OPERATOR_ASSIGNEE, OPERATOR_CREATOR]) {
      if (queryParams.hasOperator(key)) {
        const users = [];
        for (const username of queryParams.getPredicates(key)) {
          const user = await ReactiveCache.getUser({ username });
          if (user) {
            users.push(user._id);
          } else {
            errors.addNotFound(key, username);
          }
        }
        if (users.length) {
          selector[key] = { $in: users };
        }
      }
    }

    if (queryParams.hasOperator(OPERATOR_LABEL)) {
      const queryLabels = [];
      queryParams.getPredicates(OPERATOR_LABEL).forEach(label => {
        let boards = Boards.userBoards(userId, null, {
          labels: { $elemMatch: { color: label.toLowerCase() } },
        });

        if (boards.length) {
          boards.forEach(board => {
            // eslint-disable-next-line no-console
            // console.log('board:', board);
            // eslint-disable-next-line no-console
            // console.log('board.labels:', board.labels);
            board.labels
              .filter(boardLabel => {
                return boardLabel.color === label.toLowerCase();
              })
              .forEach(boardLabel => {
                queryLabels.push(boardLabel._id);
              });
          });
        } else {
          // eslint-disable-next-line no-console
          // console.log('label:', label);
          const reLabel = new RegExp(escapeForRegex(label), 'i');
          // eslint-disable-next-line no-console
          // console.log('reLabel:', reLabel);
          boards = Boards.userBoards(userId, null, {
            labels: { $elemMatch: { name: reLabel } },
          });

          if (boards.length) {
            boards.forEach(board => {
              board.labels
                .filter(boardLabel => {
                  if (!boardLabel.name) {
                    return false;
                  }
                  return boardLabel.name.match(reLabel);
                })
                .forEach(boardLabel => {
                  queryLabels.push(boardLabel._id);
                });
            });
          } else {
            errors.addNotFound(OPERATOR_LABEL, label);
          }
        }
      });
      if (queryLabels.length) {
        // eslint-disable-next-line no-console
        // console.log('queryLabels:', queryLabels);
        selector.labelIds = { $in: _.uniq(queryLabels) };
      }
    }

    if (queryParams.hasOperator(OPERATOR_HAS)) {
      for (const has of queryParams.getPredicates(OPERATOR_HAS)) {
        switch (has.field) {
          case PREDICATE_ATTACHMENT:
            selector.$and.push({
              _id: {
                $in: (await ReactiveCache.getAttachments({}, { fields: { cardId: 1 } })).map(
                  a => a.cardId,
                ),
              },
            });
            break;
          case PREDICATE_CHECKLIST:
            selector.$and.push({
              _id: {
                $in: (await ReactiveCache.getChecklists({}, { fields: { cardId: 1 } })).map(
                  a => a.cardId,
                ),
              },
            });
            break;
          case PREDICATE_DESCRIPTION:
          case PREDICATE_START_AT:
          case PREDICATE_DUE_AT:
          case PREDICATE_END_AT:
            if (has.exists) {
              selector[has.field] = { $exists: true, $nin: [null, ''] };
            } else {
              selector[has.field] = { $in: [null, ''] };
            }
            break;
          case PREDICATE_ASSIGNEES:
          case PREDICATE_MEMBERS:
            if (has.exists) {
              selector[has.field] = { $exists: true, $nin: [null, []] };
            } else {
              selector[has.field] = { $in: [null, []] };
            }
            break;
        }
      }
    }

    if (queryParams.text) {
      const regex = new RegExp(escapeForRegex(queryParams.text), 'i');

      const items = await ReactiveCache.getChecklistItems(
        { title: regex },
        { fields: { cardId: 1, checklistId: 1 } },
      );
      const checklists = await ReactiveCache.getChecklists(
        {
          $or: [
            { title: regex },
            { _id: { $in: items.map(item => item.checklistId) } },
          ],
        },
        { fields: { cardId: 1 } },
      );

      const attachments = await ReactiveCache.getAttachments({ 'original.name': regex });

      const comments = await ReactiveCache.getCardComments(
        { text: regex },
        { fields: { cardId: 1 } },
      );

      let cardsSelector = [
          { title: regex },
          { description: regex },
          { customFields: { $elemMatch: { value: regex } } },
          { _id: { $in: checklists.map(list => list.cardId) } },
          { _id: { $in: attachments.map(attach => attach.cardId) } },
          { _id: { $in: comments.map(com => com.cardId) } },
        ];
      if (queryParams.text === "false" || queryParams.text === "true") {
        cardsSelector.push({ customFields: { $elemMatch: { value: queryParams.text === "true" } } } );
      }
      selector.$and.push({ $or: cardsSelector });
    }

    if (selector.$and.length === 0) {
      delete selector.$and;
    }
  }

  if (process.env.DEBUG === 'true') {
    console.log('buildSelector - final selector:', JSON.stringify(selector, null, 2));
  }

  const query = new Query();
  query.selector = selector;
  query.setQueryParams(queryParams);
  query._errors = errors;

  return query;
}

function buildProjection(query) {
  // eslint-disable-next-line no-console
  // console.log('query:', query);
  let skip = 0;
  if (query.getQueryParams().skip) {
    skip = query.getQueryParams().skip;
  }
  let limit = DEFAULT_LIMIT;
  const configLimit = parseInt(process.env.RESULTS_PER_PAGE, 10);
  if (!isNaN(configLimit) && configLimit > 0) {
    limit = configLimit;
  }

  if (query.getQueryParams().hasOperator(OPERATOR_LIMIT)) {
    limit = query.getQueryParams().getPredicate(OPERATOR_LIMIT);
  }

  const projection = {
    fields: {
      _id: 1,
      archived: 1,
      boardId: 1,
      swimlaneId: 1,
      listId: 1,
      title: 1,
      type: 1,
      sort: 1,
      members: 1,
      assignees: 1,
      colors: 1,
      dueAt: 1,
      createdAt: 1,
      modifiedAt: 1,
      labelIds: 1,
      customFields: 1,
      userId: 1,
      description: 1,
    },
    sort: {
      boardId: 1,
      swimlaneId: 1,
      listId: 1,
      sort: 1,
    },
    skip,
  };
  if (limit > 0) {
    projection.limit = limit;
  }

  if (query.getQueryParams().hasOperator(OPERATOR_SORT)) {
    const order =
      query.getQueryParams().getPredicate(OPERATOR_SORT).order ===
      ORDER_ASCENDING
        ? 1
        : -1;
    switch (query.getQueryParams().getPredicate(OPERATOR_SORT).name) {
      case PREDICATE_DUE_AT:
        projection.sort = {
          dueAt: order,
          boardId: 1,
          swimlaneId: 1,
          listId: 1,
          sort: 1,
        };
        break;
      case PREDICATE_MODIFIED_AT:
        projection.sort = {
          modifiedAt: order,
          boardId: 1,
          swimlaneId: 1,
          listId: 1,
          sort: 1,
        };
        break;
      case PREDICATE_CREATED_AT:
        projection.sort = {
          createdAt: order,
          boardId: 1,
          swimlaneId: 1,
          listId: 1,
          sort: 1,
        };
        break;
      case PREDICATE_SYSTEM:
        projection.sort = {
          boardId: order,
          swimlaneId: order,
          listId: order,
          modifiedAt: order,
          sort: order,
        };
        break;
    }
  }

  // eslint-disable-next-line no-console
  // console.log('projection:', projection);

  query.projection = projection;

  return query;
}

async function buildQuery(queryParams) {
  const query = await buildSelector(queryParams);

  return buildProjection(query);
}

Meteor.publish('brokenCards', async function(sessionId) {
  check(sessionId, String);

  const params = new QueryParams();
  params.addPredicate(OPERATOR_STATUS, PREDICATE_ALL);
  const query = await buildQuery(params);
  query.selector.$or = [
    { boardId: { $in: [null, ''] } },
    { swimlaneId: { $in: [null, ''] } },
    { listId: { $in: [null, ''] } },
    { type: { $nin: CARD_TYPES } },
  ];
  // console.log('brokenCards selector:', query.selector);

  const ret = findCards(sessionId, query);
  return ret;
});

Meteor.publish('nextPage', async function(sessionId) {
  check(sessionId, String);

  const session = await ReactiveCache.getSessionData({ sessionId });
  const projection = session.getProjection();
  projection.skip = session.lastHit;

  const ret = findCards(sessionId, new Query(session.getSelector(), projection));
  return ret;
});

Meteor.publish('previousPage', async function(sessionId) {
  check(sessionId, String);

  const session = await ReactiveCache.getSessionData({ sessionId });
  const projection = session.getProjection();
  projection.skip = session.lastHit - session.resultsCount - projection.limit;

  const ret = findCards(sessionId, new Query(session.getSelector(), projection));
  return ret;
});

async function findCards(sessionId, query) {
  const userId = Meteor.userId();

  // eslint-disable-next-line no-console
  if (process.env.DEBUG === 'true') {
    console.log('findCards - userId:', userId);
    console.log('findCards - selector:', JSON.stringify(query.selector, null, 2));
    console.log('findCards - selector.$and:', query.selector.$and);
    console.log('findCards - projection:', query.projection);
  }

  const cards = await ReactiveCache.getCards(query.selector, query.projection, true);
  if (process.env.DEBUG === 'true') {
    console.log('findCards - cards count:', cards ? cards.count() : 0);
  }

  const update = {
    $set: {
      totalHits: 0,
      lastHit: 0,
      resultsCount: 0,
      cards: [],
      selector: SessionData.pickle(query.selector),
      projection: SessionData.pickle(query.projection),
      errors: query.errors(),
      debug: query.getQueryParams().getPredicate(OPERATOR_DEBUG),
      modifiedAt: new Date()
    },
  };

  if (cards) {
    update.$set.totalHits = cards.count();
    update.$set.lastHit =
      query.projection.skip + query.projection.limit < cards.count()
        ? query.projection.skip + query.projection.limit
        : cards.count();
    update.$set.cards = cards.map(card => {
      return card._id;
    });
    update.$set.resultsCount = update.$set.cards.length;
  }

  if (process.env.DEBUG === 'true') {
    console.log('findCards - sessionId:', sessionId);
    console.log('findCards - userId:', userId);
    console.log('findCards - update:', JSON.stringify(update, null, 2));
  }
  const upsertResult = SessionData.upsert({ userId, sessionId }, update);
  if (process.env.DEBUG === 'true') {
    console.log('findCards - upsertResult:', upsertResult);
  }

  // Check if the session data was actually stored
  const storedSessionData = SessionData.findOne({ userId, sessionId });
  if (process.env.DEBUG === 'true') {
    console.log('findCards - stored session data:', storedSessionData);
    console.log('findCards - stored session data count:', storedSessionData ? 1 : 0);
  }

  // remove old session data
  SessionData.remove({
    userId,
    modifiedAt: {
      $lt: new Date(
        subtract(now(), 1, 'day').toISOString(),
      ),
    },
  });

  if (cards) {
    const boards = [];
    const swimlanes = [];
    const lists = [];
    const customFieldIds = [];
    const users = [this.userId];

    cards.forEach(card => {
      if (card.boardId) boards.push(card.boardId);
      if (card.swimlaneId) swimlanes.push(card.swimlaneId);
      if (card.listId) lists.push(card.listId);
      if (card.userId) {
        users.push(card.userId);
      }
      if (card.members) {
        card.members.forEach(userId => {
          users.push(userId);
        });
      }
      if (card.assignees) {
        card.assignees.forEach(userId => {
          users.push(userId);
        });
      }
      if (card.customFields) {
        card.customFields.forEach(field => {
          customFieldIds.push(field._id);
        });
      }
    });

    const fields = {
      _id: 1,
      title: 1,
      archived: 1,
      sort: 1,
      type: 1,
    };

  // Add a small delay to ensure the session data is committed to the database
  Meteor.setTimeout(() => {
    const sessionDataCursor = SessionData.find({ userId, sessionId });
    if (process.env.DEBUG === 'true') {
      console.log('findCards - publishing session data cursor (after delay):', sessionDataCursor);
      console.log('findCards - session data count (after delay):', sessionDataCursor.count());
    }
  }, 100);

  const sessionDataCursor = SessionData.find({ userId, sessionId });
  if (process.env.DEBUG === 'true') {
    console.log('findCards - publishing session data cursor:', sessionDataCursor);
    console.log('findCards - session data count:', sessionDataCursor.count());
  }

    return [
      cards,
      await ReactiveCache.getBoards(
        { _id: { $in: boards } },
        { fields: { ...fields, labels: 1, color: 1 } },
        true,
      ),
      await ReactiveCache.getSwimlanes(
        { _id: { $in: swimlanes } },
        { fields: { ...fields, color: 1 } },
        true,
      ),
      await ReactiveCache.getLists({ _id: { $in: lists } }, { fields }, true),
      await ReactiveCache.getCustomFields({ _id: { $in: customFieldIds } }, {}, true),
      await ReactiveCache.getUsers({ _id: { $in: users } }, { fields: Users.safeFields }, true),
      await ReactiveCache.getChecklists({ cardId: { $in: cards.map(c => c._id) } }, {}, true),
      await ReactiveCache.getChecklistItems({ cardId: { $in: cards.map(c => c._id) } }, {}, true),
      (await ReactiveCache.getAttachments({ 'meta.cardId': { $in: cards.map(c => c._id) } }, {}, true)).cursor,
      await ReactiveCache.getCardComments({ cardId: { $in: cards.map(c => c._id) } }, {}, true),
      sessionDataCursor,
    ];
  }

  const sessionDataCursor = SessionData.find({ userId, sessionId });
  if (process.env.DEBUG === 'true') {
    console.log('findCards - publishing session data cursor (no cards):', sessionDataCursor);
    console.log('findCards - session data count (no cards):', sessionDataCursor.count());
  }
  return [sessionDataCursor];
}
