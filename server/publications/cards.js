import { ReactiveCache } from '/imports/reactiveCache';
import { publishComposite } from 'meteor/reywood:publish-composite';
import { findWhere } from '/imports/lib/collectionHelpers';
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
  OPERATOR_TITLE,
  OPERATOR_DESCRIPTION,
  OPERATOR_CUSTOMFIELD,
  OPERATOR_ATTACHMENT_TEXT,
  OPERATOR_CHECKLIST_TEXT,
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

Meteor.publish('card', async function(cardId) {
  check(cardId, String);

  const userId = this.userId;
  const card = await ReactiveCache.getCard({ _id: cardId });

  if (!card || !card.boardId) {
    return [];
  }

  const board = await ReactiveCache.getBoard({ _id: card.boardId });
  if (!board || !board.isVisibleBy({ _id: userId })) {
    return [];
  }

  // If user has assigned-only permissions, check if they're assigned to this card
  if (userId && board.members) {
    const member = findWhere(board.members, { userId: userId, isActive: true });
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
  if (!board || !board.isVisibleBy({ _id: userId })) {
    return [];
  }

  // If user has assigned-only permissions, check if they're assigned to this card
  if (userId && board.members) {
    const member = findWhere(board.members, { userId: userId, isActive: true });
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

Meteor.publish('archiveSidebar', async function(boardId, activeTab = 'cards', cardsLimit = 30, listsLimit = 30, swimlanesLimit = 30) {
  check(boardId, String);
  check(activeTab, String);
  check(cardsLimit, Match.Integer);
  check(listsLimit, Match.Integer);
  check(swimlanesLimit, Match.Integer);

  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }

  const safeCardsLimit = Math.max(1, Math.min(cardsLimit, 500));
  const safeListsLimit = Math.max(1, Math.min(listsLimit, 500));
  const safeSwimlaneLimit = Math.max(1, Math.min(swimlanesLimit, 500));

  const board = await ReactiveCache.getBoard({ _id: boardId });
  if (!board || !board.isVisibleBy({ _id: userId })) {
    return [];
  }

  const cardSelector = {
    boardId: { $in: [board._id, board.subtasksDefaultBoardId] },
    archived: true,
  };

  // Respect assigned-only board permissions for archived cards as well.
  if (board.members) {
    const member = findWhere(board.members, { userId, isActive: true });
    if (
      member &&
      (member.isNormalAssignedOnly ||
        member.isCommentAssignedOnly ||
        member.isReadAssignedOnly)
    ) {
      cardSelector.assignees = { $in: [userId] };
    }
  }

  const archivedListsSelector = {
    boardId,
    archived: true,
  };
  const archivedSwimlanesSelector = {
    boardId,
    archived: true,
  };

  const cardsCursor = Cards.find(cardSelector, {
    sort: { archivedAt: -1, modifiedAt: -1 },
    limit: safeCardsLimit,
  });
  const listsCursor = Lists.find(archivedListsSelector, {
    sort: { archivedAt: -1, modifiedAt: -1 },
    limit: safeListsLimit,
  });
  const swimlanesCursor = Swimlanes.find(archivedSwimlanesSelector, {
    sort: { archivedAt: -1, modifiedAt: -1 },
    limit: safeSwimlaneLimit,
  });

  return [cardsCursor, listsCursor, swimlanesCursor];
});

Meteor.publish('myCards', async function(sessionId) {
  check(sessionId, String);

  const queryParams = new QueryParams();
  queryParams.addPredicate(OPERATOR_USER, (await ReactiveCache.getCurrentUser()).username);
  queryParams.setPredicate(OPERATOR_LIMIT, 200);

  const query = await buildQuery(queryParams, this.userId);
  query.projection.sort = {
    boardId: 1,
    swimlaneId: 1,
    listId: 1,
  };

  const ret = await findCards(sessionId, query, this.userId);
  return ret;
});

// Optimized due cards publication for better performance
Meteor.publish('dueCards', async function(allUsers = false) {
  check(allUsers, Boolean);

  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }

  // Get user's board memberships for efficient filtering
  const userBoards = (await ReactiveCache.getBoards({
    $or: [
      { permission: 'public' },
      { members: { $elemMatch: { userId, isActive: true } } }
    ]
  })).map(board => board._id);

  if (userBoards.length === 0) {
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

  const result = Cards.find(selector, options);

  return result;
});

Meteor.publish('globalSearch', async function(sessionId, params, text) {
  check(sessionId, String);
  check(params, Object);
  check(text, String);

  const ret = await findCards(sessionId, await buildQuery(new QueryParams(params, text), this.userId), this.userId);

  if (!Array.isArray(ret)) {
    return ret;
  }

  // Check if last item is the sessiondata marker
  let sessionDataToPublish = null;
  if (ret.length > 0 && ret[ret.length - 1] && ret[ret.length - 1]._sessionDataToFetch) {
    sessionDataToPublish = ret[ret.length - 1]._sessionDataToFetch;
    ret.pop(); // Remove the marker
  }

  // Manually publish sessiondata if it exists
  if (sessionDataToPublish) {
    this.added('sessiondata', sessionDataToPublish._id, sessionDataToPublish);
  }

  return ret;
});

Meteor.publish('sessionData', async function(sessionId) {
  check(sessionId, String);
  const userId = this.userId;

  if (!userId) {
    return [];
  }

  // Return the cursor immediately - data should already be in the collection
  // from the globalSearch publication or earlier searches
  const cursor = SessionData.find({ userId, sessionId });
  return cursor;
});

async function buildSelector(queryParams, userId) {
  const errors = new QueryErrors();

  let selector = {};

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
          $in: await Boards.userBoardIds(userId, null, boardsSelector),
        };
        selector.$and.push({
          $or: [
            {
              boardId: {
                $in: await Boards.userBoardIds(userId, archived, boardsSelector),
              },
            },
            { swimlaneId: { $in: Swimlanes.userArchivedSwimlaneIds(userId) } },
            { listId: { $in: Lists.userArchivedListIds(userId) } },
            { archived: true },
          ],
        });
      } else {
        selector.boardId = {
          $in: await Boards.userBoardIds(userId, false, boardsSelector),
        };
        selector.swimlaneId = { $nin: await Swimlanes.archivedSwimlaneIds() };
        selector.listId = { $nin: await Lists.archivedListIds() };
        selector.archived = false;
      }
    } else {
      const userBoardIds = await Boards.userBoardIds(userId, null, boardsSelector);
      selector.boardId = {
        $in: userBoardIds,
      };
    }
    if (endAt !== null) {
      selector.endAt = endAt;
    }

    if (queryParams.hasOperator(OPERATOR_BOARD)) {
      const queryBoards = [];
      for (const query of queryParams.getPredicates(OPERATOR_BOARD)) {
        const boards = await Boards.userSearch(userId, {
          title: new RegExp(escapeForRegex(query), 'i'),
        });
        if (boards.length) {
          boards.forEach(board => {
            queryBoards.push(board._id);
          });
        } else {
          errors.addNotFound(OPERATOR_BOARD, query);
        }
      }

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
      const commentsFound = typeof CardComments.textSearch === 'function' ? await CardComments.textSearch(
        userId,
        queryParams.getPredicates(OPERATOR_COMMENT),
      ) : [];
      const cardIds = commentsFound.map(com => com.cardId);
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
      for (const label of queryParams.getPredicates(OPERATOR_LABEL)) {
        let boards = await Boards.userBoards(userId, null, {
          labels: { $elemMatch: { color: label.toLowerCase() } },
        });

        if (boards.length) {
          boards.forEach(board => {
            board.labels
              .filter(boardLabel => {
                return boardLabel.color === label.toLowerCase();
              })
              .forEach(boardLabel => {
                queryLabels.push(boardLabel._id);
              });
          });
        } else {
          const reLabel = new RegExp(escapeForRegex(label), 'i');
          boards = await Boards.userBoards(userId, null, {
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
      }
      if (queryLabels.length) {
        selector.labelIds = { $in: [...new Set(queryLabels)] };
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

    if (queryParams.hasOperator(OPERATOR_TITLE)) {
      const regexes = queryParams.getPredicates(OPERATOR_TITLE).map(t => new RegExp(escapeForRegex(t), 'i'));
      selector.$and.push({ $or: regexes.map(regex => ({ title: regex })) });
    }

    if (queryParams.hasOperator(OPERATOR_DESCRIPTION)) {
      const regexes = queryParams.getPredicates(OPERATOR_DESCRIPTION).map(t => new RegExp(escapeForRegex(t), 'i'));
      selector.$and.push({ $or: regexes.map(regex => ({ description: regex })) });
    }

    if (queryParams.hasOperator(OPERATOR_CUSTOMFIELD)) {
      const regexes = queryParams.getPredicates(OPERATOR_CUSTOMFIELD).map(t => new RegExp(escapeForRegex(t), 'i'));
      selector.$and.push({ $or: regexes.map(regex => ({ customFields: { $elemMatch: { value: regex } } })) });
    }

    if (queryParams.hasOperator(OPERATOR_ATTACHMENT_TEXT)) {
      for (const t of queryParams.getPredicates(OPERATOR_ATTACHMENT_TEXT)) {
        const regex = new RegExp(escapeForRegex(t), 'i');
        const attachments = await ReactiveCache.getAttachments({ 'original.name': regex });
        if (attachments.length) {
          selector.$and.push({ _id: { $in: attachments.map(attach => attach.cardId) } });
        } else {
          selector.$and.push({ _id: null });
        }
      }
    }

    if (queryParams.hasOperator(OPERATOR_CHECKLIST_TEXT)) {
      for (const t of queryParams.getPredicates(OPERATOR_CHECKLIST_TEXT)) {
        const regex = new RegExp(escapeForRegex(t), 'i');
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
        if (checklists.length) {
          selector.$and.push({ _id: { $in: checklists.map(list => list.cardId) } });
        } else {
          selector.$and.push({ _id: null });
        }
      }
    }

    if (selector.$and.length === 0) {
      delete selector.$and;
    }
  }

  const query = new Query();
  query.selector = selector;
  query.setQueryParams(queryParams);
  query._errors = errors;

  return query;
}

function buildProjection(query) {

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



  query.projection = projection;

  return query;
}

async function buildQuery(queryParams, userId) {
  const query = await buildSelector(queryParams, userId);

  return buildProjection(query);
}

Meteor.publish('brokenCards', async function(sessionId) {
  check(sessionId, String);

  const params = new QueryParams();
  params.addPredicate(OPERATOR_STATUS, PREDICATE_ALL);
  const query = await buildQuery(params, this.userId);
  query.selector.$or = [
    { boardId: { $in: [null, ''] } },
    { swimlaneId: { $in: [null, ''] } },
    { listId: { $in: [null, ''] } },
    { type: { $nin: CARD_TYPES } },
  ];

  const ret = await findCards(sessionId, query, this.userId);
  return ret;
});

Meteor.publish('nextPage', async function(sessionId) {
  check(sessionId, String);

  const session = await ReactiveCache.getSessionData({ sessionId });
  const projection = session.getProjection();
  projection.skip = session.lastHit;

  const ret = await findCards(sessionId, new Query(session.getSelector(), projection), this.userId);
  return ret;
});

Meteor.publish('previousPage', async function(sessionId) {
  check(sessionId, String);

  const session = await ReactiveCache.getSessionData({ sessionId });
  const projection = session.getProjection();
  projection.skip = session.lastHit - session.resultsCount - projection.limit;

  const ret = await findCards(sessionId, new Query(session.getSelector(), projection), this.userId);
  return ret;
});

async function findCards(sessionId, query, userId) {
  let textMatches = query.getQueryParams().text;
  let isTextSearch = !!textMatches;
  let dbProjection = query.projection;
  if (isTextSearch) {
    dbProjection = Object.assign({}, query.projection);
    delete dbProjection.limit;
    delete dbProjection.skip;
  }

  let cards = await ReactiveCache.getCards(query.selector, dbProjection, true);
  let totalCardsCount = cards ? (typeof cards.countAsync === 'function' ? await cards.countAsync() : cards.count()) : 0;
  let orderedIds = [];

  if (isTextSearch && totalCardsCount > 0) {
    let fetched = typeof cards.fetchAsync === 'function' ? await cards.fetchAsync() : cards.fetch();
    const regex = new RegExp(escapeForRegex(textMatches), 'i');
    fetched.forEach(c => {
      c._score = 0;
      if (c.title && regex.test(c.title)) c._score += 10;
      else if (c.description && regex.test(c.description)) c._score += 5;
      else if (c.customFields && c.customFields.some(f => f.value && regex.test(String(f.value)))) c._score += 1;
    });
    fetched.sort((a, b) => {
      if (b._score !== a._score) return b._score - a._score;
      return (a.title || '').localeCompare(b.title || '');
    });

    const skip = query.projection.skip || 0;
    const limit = query.projection.limit || 25;
    const page = fetched.slice(skip, skip + limit);
    orderedIds = page.map(c => c._id);

    // override the cursor to only contain the paginated results for this page
    cards = await ReactiveCache.getCards({ _id: { $in: orderedIds } }, { fields: query.projection.fields }, true);
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
      modifiedAt: new Date()
    },
  };

  if (cards && totalCardsCount > 0) {
    update.$set.totalHits = totalCardsCount;
    update.$set.lastHit =
      query.projection.skip + query.projection.limit < totalCardsCount
        ? query.projection.skip + query.projection.limit
        : totalCardsCount;

    // For text search preserve our sorted IDs, else grab from db order
    if (isTextSearch) {
      update.$set.cards = orderedIds;
    } else {
      const cardArray = typeof cards.fetchAsync === 'function' ? await cards.fetchAsync() : cards.fetch();
      update.$set.cards = cardArray.map(card => card._id);
    }
    update.$set.resultsCount = update.$set.cards.length;
  }


  const upsertResult = typeof SessionData.upsertAsync === 'function' ? await SessionData.upsertAsync({ userId, sessionId }, update) : SessionData.upsert({ userId, sessionId }, update);

  // Check if the session data was actually stored
  const storedSessionData = typeof SessionData.findOneAsync === 'function' ? await SessionData.findOneAsync({ userId, sessionId }) : SessionData.findOne({ userId, sessionId });

  // remove old session data
  const removeSelector = {
    userId,
    modifiedAt: {
      $lt: new Date(
        subtract(now(), 1, 'day').toISOString(),
      ),
    },
  };
  if (typeof SessionData.removeAsync === 'function') {
    await SessionData.removeAsync(removeSelector);
  } else {
    SessionData.remove(removeSelector);
  }

  if (cards && totalCardsCount > 0) {
    const boards = [];
    const swimlanes = [];
    const lists = [];
    const customFieldIds = [];
    const users = [userId];

    const cardArray = typeof cards.fetchAsync === 'function' ? await cards.fetchAsync() : cards.fetch();
    const cardIds = cardArray.map(c => c._id);

    cardArray.forEach(card => {
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

    // Return all cursors except sessiondata - we'll add sessiondata separately after fetch
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
      await ReactiveCache.getLists({ _id: { $in: lists } }, { fields: { ...fields, color: 1 } }, true),
      await ReactiveCache.getCustomFields({ _id: { $in: customFieldIds } }, {}, true),
      await ReactiveCache.getUsers({ _id: { $in: users } }, { fields: Users.safeFields }, true),
      await ReactiveCache.getChecklists({ cardId: { $in: cardIds } }, {}, true),
      await ReactiveCache.getChecklistItems({ cardId: { $in: cardIds } }, {}, true),
      (await ReactiveCache.getAttachments({ 'meta.cardId': { $in: cardIds } }, {}, true)).cursor,
      await ReactiveCache.getCardComments({ cardId: { $in: cardIds } }, {}, true),
      { _sessionDataToFetch: storedSessionData }, // Pass sessiondata separately
    ];
  } else {
    // Return just a marker for sessiondata
    return [{ _sessionDataToFetch: storedSessionData }];
  }
}
