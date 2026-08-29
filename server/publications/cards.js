import { ReactiveCache } from '/imports/reactiveCache';
import { publishComposite } from 'meteor/reywood:publish-composite';
import { publishReportPage } from '/models/lib/reportPageIndex';
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
  OPERATOR_NUMBER,
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
import { MATCH_NOTHING, selectorIsInjection } from '/server/lib/selectorGuard';
const { boardCardScope } = require('/models/lib/boardCardScope');
const { retainRankedCard } = require('/models/lib/cardSearchRanking');
const {
  ownedSearchSessionSelector,
  recordLoggedOutPaginationProbe,
} = require('/models/lib/searchPaginationAuthorization');

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

// Live children (comments, attachments, checklists, checklist items) of a SINGLE
// open card. In lazy (windowed) card loading the board/window publications only
// ship the children of cards in the visible window, so an open card that scrolled
// out of — or was just added to — a window could otherwise miss its own live data.
// The card detail view subscribes to this so an open card is ALWAYS complete and
// reactive, independent of the window. Cheap: one card's children only.
publishComposite('openCardData', async function(cardId) {
  check(cardId, String);

  const userId = this.userId;
  const card = await ReactiveCache.getCard({ _id: cardId });
  if (!card || !card.boardId) {
    return { find() { return []; } };
  }

  const board = await ReactiveCache.getBoard({ _id: card.boardId });
  if (!board || !board.isVisibleBy({ _id: userId })) {
    return { find() { return []; } };
  }

  // Respect assigned-only board permissions, like the 'card' publication above.
  if (userId && board.members) {
    const member = findWhere(board.members, { userId, isActive: true });
    if (member && (member.isNormalAssignedOnly || member.isCommentAssignedOnly || member.isReadAssignedOnly)) {
      if (!card.assignees || !card.assignees.includes(userId)) {
        return { find() { return []; } };
      }
    }
  }

  return {
    async find() {
      return await ReactiveCache.getCards({ _id: cardId }, { fields: { _id: 1 } }, true);
    },
    children: [
      {
        async find(c) {
          return await ReactiveCache.getCardComments({ cardId: c._id }, {}, true);
        },
      },
      {
        async find(c) {
          const result = await ReactiveCache.getAttachments({ 'meta.cardId': c._id }, {}, true);
          return result.cursor || result;
        },
      },
      {
        async find(c) {
          return await ReactiveCache.getChecklists({ cardId: c._id }, {}, true);
        },
      },
      {
        async find(c) {
          return await ReactiveCache.getChecklistItems({ cardId: c._id }, {}, true);
        },
      },
    ],
  };
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

  const safeCardsLimit = Math.max(1, Math.min(cardsLimit, 500));
  const safeListsLimit = Math.max(1, Math.min(listsLimit, 500));
  const safeSwimlaneLimit = Math.max(1, Math.min(swimlanesLimit, 500));

  const board = await ReactiveCache.getBoard({ _id: boardId });
  if (!board) return this.ready();

  if (!userId) {
    // Unauthenticated users can only see archived lists/swimlanes on public boards
    if (board.permission !== 'public') return this.ready();

    const archivedListsSelector = { boardId, archived: true };
    const archivedSwimlanesSelector = { boardId, archived: true };
    const listsCursor = Lists.find(archivedListsSelector, {
      sort: { archivedAt: -1, modifiedAt: -1 },
      limit: safeListsLimit,
      fields: { title: 1, archivedAt: 1, boardId: 1, archived: 1 },
    });
    const swimlanesCursor = Swimlanes.find(archivedSwimlanesSelector, {
      sort: { archivedAt: -1, modifiedAt: -1 },
      limit: safeSwimlaneLimit,
      fields: { title: 1, archivedAt: 1, boardId: 1, archived: 1 },
    });
    return [listsCursor, swimlanesCursor];
  }

  if (!board.isVisibleBy({ _id: userId })) {
    return [];
  }

  const cardSelector = {
    ...boardCardScope(board),
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

  if (!this.userId) return this.ready();

  const currentUser = await ReactiveCache.getCurrentUser();
  if (!currentUser) return this.ready();

  const queryParams = new QueryParams();
  queryParams.addPredicate(OPERATOR_USER, currentUser.username);
  queryParams.setPredicate(OPERATOR_LIMIT, 200);

  const query = await buildQuery(queryParams, this.userId);
  query.projection.sort = {
    boardId: 1,
    swimlaneId: 1,
    listId: 1,
  };

  const { cursors, sessionData } = await findCards(sessionId, query, this.userId);
  if (sessionData) this.added('sessiondata', sessionData._id, sessionData);
  return cursors;
});

// Optimized due cards publication for better performance
Meteor.publish('dueCards', async function(allUsers = false, limit = 200, skip = 0) {
  check(allUsers, Boolean);
  check(limit, Number);
  check(skip, Number);

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
      { requesters: userId },
      { assigners: userId },
      { userId: userId }
    ];
  }

  const options = {
    sort: { dueAt: 1 }, // Sort by due date ascending (oldest first)
    // Page rather than truncate: #5999 requires every due card to remain
    // reachable, while an unlimited live cursor makes one visit publish every
    // due card and keep every one reactive. The client provides Previous/Next.
    limit: Math.max(1, Math.min(Math.floor(limit) || 200, 500)),
    skip: Math.max(0, Math.floor(skip) || 0),
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

  if (!this.userId) return this.ready();

  const { cursors, sessionData } = await findCards(
    sessionId,
    await buildQuery(new QueryParams(params, text), this.userId),
    this.userId,
  );
  if (sessionData) this.added('sessiondata', sessionData._id, sessionData);
  return cursors;
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

// Which boards a search covers: the ones the user is actually part of - a member
// of, or reached through an organization, a team or their e-mail domain - and NOT
// every PUBLIC board on the instance.
//
// A public board is meant to be discoverable, so it belongs in the boards list.
// But "Search All Boards" meant all boards on the server: on a public instance a
// search for a common word answered with strangers' cards, and following a hit
// dropped the user into a board they have no part in. "All boards" means all of
// YOUR boards. Someone who wants to look inside a public board can still open it
// and search there.
const SEARCH_BOARD_SCOPE = { includePublic: false };

async function buildSelector(queryParams, userId) {
  const errors = new QueryErrors();

  let selector = {};

  if (queryParams.selector) {
    selector = selectorIsInjection(queryParams.selector, 'globalSearch')
      ? MATCH_NOTHING
      : {
        $and: [
          queryParams.selector,
          {
            boardId: {
              $in: await Boards.userBoardIds(
                userId,
                null,
                {},
                SEARCH_BOARD_SCOPE,
              ),
            },
          },
        ],
      };
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
          $in: await Boards.userBoardIds(userId, null, boardsSelector, SEARCH_BOARD_SCOPE),
        };
        selector.$and.push({
          $or: [
            {
              boardId: {
                $in: await Boards.userBoardIds(userId, archived, boardsSelector, SEARCH_BOARD_SCOPE),
              },
            },
            // AWAITED: these are async, and an un-awaited call puts a PROMISE where
            // Mongo wants an array - "$in needs an array", the whole search failing
            // with "Server Error" (#6537). The two `$nin` uses below were fixed;
            // these two, on the archived/all branch, were not.
            { swimlaneId: { $in: await Swimlanes.userArchivedSwimlaneIds(userId) } },
            { listId: { $in: await Lists.userArchivedListIds(userId) } },
            { archived: true },
          ],
        });
      } else {
        selector.boardId = {
          $in: await Boards.userBoardIds(userId, false, boardsSelector, SEARCH_BOARD_SCOPE),
        };
        selector.swimlaneId = { $nin: await Swimlanes.archivedSwimlaneIds() };
        selector.listId = { $nin: await Lists.archivedListIds() };
        selector.archived = false;
      }
    } else {
      const userBoardIds = await Boards.userBoardIds(userId, null, boardsSelector, SEARCH_BOARD_SCOPE);
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
        }, {}, SEARCH_BOARD_SCOPE);
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

    // Resolve every username the query names in ONE lookup.
    //
    // Each `user:`/`member:`/`assignee:`/`creator:` predicate used to do its own
    // awaited findOne, so `member:ann member:bob member:carol` was three serial
    // round-trips before the search itself could start. They are all the same
    // question - which of these names is an account - so it is asked once, with
    // `$in`, and answered from a map. Names that matched nothing are still
    // reported per operator, exactly as before, because the operator is what
    // tells the user WHERE the unknown name was typed.
    const namedUsernames = new Set();
    for (const key of [OPERATOR_USER, OPERATOR_MEMBER, OPERATOR_ASSIGNEE, OPERATOR_CREATOR]) {
      if (queryParams.hasOperator(key)) {
        for (const username of queryParams.getPredicates(key)) namedUsernames.add(username);
      }
    }

    const userIdByUsername = new Map();
    if (namedUsernames.size) {
      const found = await ReactiveCache.getUsers(
        { username: { $in: [...namedUsernames] } },
        { fields: { _id: 1, username: 1 } },
      );
      (found || []).forEach(user => userIdByUsername.set(user.username, user._id));
    }

    // The ids a predicate names, and the names it got wrong.
    const resolvePredicates = key => {
      const ids = [];
      for (const username of queryParams.getPredicates(key)) {
        const id = userIdByUsername.get(username);
        if (id) ids.push(id);
        else errors.addNotFound(key, username);
      }
      return ids;
    };

    if (queryParams.hasOperator(OPERATOR_USER)) {
      const users = resolvePredicates(OPERATOR_USER);
      if (users.length) {
        selector.$and.push({
          $or: [{ members: { $in: users } }, { assignees: { $in: users } }],
        });
      }
    }

    for (const key of [OPERATOR_MEMBER, OPERATOR_ASSIGNEE, OPERATOR_CREATOR]) {
      if (queryParams.hasOperator(key)) {
        const users = resolvePredicates(key);
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
          } else if (!/^[0-9]+$/.test(String(label).trim())) {
            // #5006: `#12` with no label called 12 is not a mistake - it is a
            // card-number search, answered below. Reporting "label not found"
            // beside the card it did find is a message that contradicts the
            // results on the screen.
            errors.addNotFound(OPERATOR_LABEL, label);
          }
        }
      }
      // #5006: `#12` searches for BOTH - a label called 12 and the card whose
      // number is 12. A board calls a card "#12" and a label can be called
      // anything, so which of the two a person means cannot be known from the
      // text; answering with both is the only reading that never hides what
      // they were looking for. It is an OR, so every card the label search
      // returned before is still returned.
      const numericLabels = [...new Set(queryParams.getPredicates(OPERATOR_LABEL)
        .map(label => String(label).trim())
        .filter(label => /^[0-9]+$/.test(label))
        .map(label => parseInt(label, 10))
        .filter(value => !isNaN(value)))];
      const labelClause = queryLabels.length
        ? { labelIds: { $in: [...new Set(queryLabels)] } }
        : null;
      const numberClause = numericLabels.length
        ? { cardNumber: { $in: numericLabels } }
        : null;

      if (labelClause && numberClause) {
        selector.$and.push({ $or: [labelClause, numberClause] });
      } else if (labelClause) {
        // Unchanged from before, for the ordinary `#red` / `label:urgent` case.
        selector.labelIds = labelClause.labelIds;
      } else if (numberClause) {
        selector.$and.push(numberClause);
      }
    }

    if (queryParams.hasOperator(OPERATOR_HAS)) {
      // Search child collections inside the same board scope as the card query.
      // Without this, a board search first materialized every attachment/checklist
      // id on the instance and only discarded the unrelated ids in the final card
      // query. Global search still intentionally spans all authorized board ids.
      const boardIds = selector.boardId && selector.boardId.$in;
      const checklistScope = Array.isArray(boardIds) ? { boardId: { $in: boardIds } } : {};
      const attachmentScope = Array.isArray(boardIds) ? { 'meta.boardId': { $in: boardIds } } : {};
      for (const has of queryParams.getPredicates(OPERATOR_HAS)) {
        switch (has.field) {
          case PREDICATE_ATTACHMENT:
            selector.$and.push({
              _id: {
                $in: (await ReactiveCache.getAttachments(attachmentScope, { fields: { cardId: 1 } })).map(
                  a => a.cardId,
                ),
              },
            });
            break;
          case PREDICATE_CHECKLIST:
            selector.$and.push({
              _id: {
                $in: (await ReactiveCache.getChecklists(checklistScope, { fields: { cardId: 1 } })).map(
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

      const attachmentSelector = { 'original.name': regex };
      if (selector.boardId && Array.isArray(selector.boardId.$in)) {
        attachmentSelector['meta.boardId'] = { $in: selector.boardId.$in };
      }
      const attachments = await ReactiveCache.getAttachments(
        attachmentSelector,
        { fields: { cardId: 1 } },
      );

      // #5910: free-text search must match text inside card comments, for BOTH
      // global and board-level (board:) search. Board scoping is preserved by the
      // surrounding `selector.boardId` / `$and` constraints, so a comment match on
      // a card outside the searched board is naturally excluded. This mirrors the
      // pure `cardMatchesQuery({title, description, commentTexts}, query)` helper
      // in server/lib/cardMatch.js, which is the single source of truth for the
      // (title OR description OR comment) matching rule and is unit-tested.
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
          // #5910: include cards whose comment text matches (board-scoped).
          { _id: { $in: comments.map(com => com.cardId) } },
        ];
      if (queryParams.text === "false" || queryParams.text === "true") {
        cardsSelector.push({ customFields: { $elemMatch: { value: queryParams.text === "true" } } } );
      }
      // #5006: typing `12` finds the card the board calls #12, as well as every
      // card with "12" in its text. Another alternative in the same $or, so a
      // search that used to find a title cannot stop finding it.
      if (/^[0-9]+$/.test(String(queryParams.text).trim())) {
        const asNumber = parseInt(queryParams.text, 10);
        if (!isNaN(asNumber)) cardsSelector.push({ cardNumber: asNumber });
      }
      selector.$and.push({ $or: cardsSelector });
    }

    // #5006: the number the board refers to a card by. An equality match on a
    // number, not a regex on a string: "number:12" is card 12, never card 120.
    if (queryParams.hasOperator(OPERATOR_NUMBER)) {
      const numbers = queryParams.getPredicates(OPERATOR_NUMBER)
        .map(value => parseInt(value, 10))
        .filter(value => !isNaN(value));
      if (numbers.length) {
        selector.$and.push({ $or: numbers.map(cardNumber => ({ cardNumber })) });
      }
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
        const attachmentSelector = { 'original.name': regex };
        if (selector.boardId && Array.isArray(selector.boardId.$in)) {
          attachmentSelector['meta.boardId'] = { $in: selector.boardId.$in };
        }
        const attachments = await ReactiveCache.getAttachments(
          attachmentSelector,
          { fields: { cardId: 1 } },
        );
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

// What makes a card broken: it has no board, swimlane or list to belong to, or a
// type that is not a card type at all. Shared by the standalone /broken-cards page
// and by the Admin Panel report below, so the two can never disagree about what
// "broken" means. Unchanged from before the report was converted - only the way the
// report FETCHES its rows changed.
const BROKEN_CARDS_SELECTOR = {
  $or: [
    { boardId: { $in: [null, ''] } },
    { swimlaneId: { $in: [null, ''] } },
    { listId: { $in: [null, ''] } },
    { type: { $nin: CARD_TYPES } },
  ],
};

// The standalone /broken-cards PAGE (client/components/main/brokenCards.js) still
// runs on the global-search machinery, so its publication stays exactly as it was.
// Admin Panel / Problems / Broken cards is a separate, admin-only REPORT below.
Meteor.publish('brokenCards', async function(sessionId) {
  check(sessionId, String);

  const params = new QueryParams();
  params.addPredicate(OPERATOR_STATUS, PREDICATE_ALL);
  const query = await buildQuery(params, this.userId);
  query.selector.$or = BROKEN_CARDS_SELECTOR.$or;

  const { cursors: brokenCursors, sessionData: brokenSessionData } = await findCards(sessionId, query, this.userId);
  if (brokenSessionData) this.added('sessiondata', brokenSessionData._id, brokenSessionData);
  return brokenCursors;
});

function brokenCardsQuery(searchTerm) {
  if (!searchTerm) {
    return { ...BROKEN_CARDS_SELECTOR };
  }
  // Both conditions, and both are an $or - so they are $and-ed explicitly rather
  // than written as two $or keys, where the second would silently replace the first.
  return {
    $and: [
      BROKEN_CARDS_SELECTOR,
      { title: new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
    ],
  };
}

// Broken cards, as a REPORT: one page, server-side, searchable and counted - the
// same shape as the Files / Rules / Boards / Cards reports beside it in Admin Panel
// / Problems (docs/Features/Page/Table.md). It used to run on the global-search
// machinery instead (a session document, nextPage/previousPage publications), which
// is why it was the one report there with a different set of controls.
Meteor.publish('brokenCardsReport', async function(searchTerm = '', limit, skip = 0) {
  check(searchTerm, Match.OneOf(String, null, undefined));
  check(limit, Number);
  check(skip, Match.OneOf(Number, null, undefined));
  if (!this.userId || !(await ReactiveCache.getUser(this.userId))?.isAdmin) {
    return this.ready();
  }

  // Published MANUALLY (fetch + this.added + this.ready) for the same reason as
  // cardsReport above: a returned sorted+limited cursor triggers a limited live
  // observe that hangs on FerretDB's OpLog and leaves the report on its spinner.
  const cards = await ReactiveCache.getCards(
    brokenCardsQuery(searchTerm),
    {
      fields: {
        title: 1,
        type: 1,
        boardId: 1,
        listId: 1,
        swimlaneId: 1,
        createdAt: 1,
      },
      sort: { boardId: 1, createdAt: -1 },
      limit,
      skip: skip || 0,
    },
    false,
  );

  // A broken card's board / swimlane / list is exactly what may be missing, so
  // only the ids that ARE set are looked up; the rest render as an empty cell.
  const boardIds = new Set();
  const listIds = new Set();
  const swimlaneIds = new Set();
  cards.forEach(card => {
    if (card.boardId) boardIds.add(card.boardId);
    if (card.listId) listIds.add(card.listId);
    if (card.swimlaneId) swimlaneIds.add(card.swimlaneId);
  });

  const boards = await ReactiveCache.getBoards({ _id: { $in: [...boardIds] } }, { fields: { title: 1 } }, false);
  const lists = await ReactiveCache.getLists({ _id: { $in: [...listIds] } }, { fields: { title: 1 } }, false);
  const swimlanes = await ReactiveCache.getSwimlanes({ _id: { $in: [...swimlaneIds] } }, { fields: { title: 1 } }, false);

  for (const doc of cards) { const { _id, ...fields } = doc; this.added('cards', _id, fields); }
  for (const doc of boards) { const { _id, ...fields } = doc; this.added('boards', _id, fields); }
  for (const doc of lists) { const { _id, ...fields } = doc; this.added('lists', _id, fields); }
  for (const doc of swimlanes) { const { _id, ...fields } = doc; this.added('swimlanes', _id, fields); }
  // WHICH cards this page is, in this order. Minimongo holds every card of every
  // board the admin has opened, so without this the pane rendered all of them -
  // hundreds of rows under a pager that correctly said "1 / 1".
  publishReportPage(this, 'report-broken', cards);
  this.ready();
});

Meteor.methods({
  async getBrokenCardsReportCount(searchTerm = '') {
    check(searchTerm, Match.OneOf(String, null, undefined));
    if (!this.userId || !(await ReactiveCache.getUser(this.userId))?.isAdmin) {
      throw new Meteor.Error('not-authorized');
    }
    const cursor = await ReactiveCache.getCards(brokenCardsQuery(searchTerm), {}, true);
    return typeof cursor.countAsync === 'function' ? await cursor.countAsync() : cursor.count();
  },
});

Meteor.publish('nextPage', async function(sessionId) {
  check(sessionId, String);

  const sessionSelector = ownedSearchSessionSelector(this.userId, sessionId);
  if (!sessionSelector) {
    recordLoggedOutPaginationProbe(this, 'nextPage', event =>
      require('/server/lib/securityLog').record(event));
    return this.ready();
  }
  const session = await ReactiveCache.getSessionData(sessionSelector);
  if (!session) return this.ready();
  const projection = session.getProjection();
  projection.skip = session.lastHit;

  const { cursors: nextCursors, sessionData: nextSessionData } = await findCards(sessionId, new Query(session.getSelector(), projection), this.userId);
  if (nextSessionData) this.added('sessiondata', nextSessionData._id, nextSessionData);
  return nextCursors;
});

Meteor.publish('previousPage', async function(sessionId) {
  check(sessionId, String);

  const sessionSelector = ownedSearchSessionSelector(this.userId, sessionId);
  if (!sessionSelector) {
    recordLoggedOutPaginationProbe(this, 'previousPage', event =>
      require('/server/lib/securityLog').record(event));
    return this.ready();
  }
  const session = await ReactiveCache.getSessionData(sessionSelector);
  if (!session) return this.ready();
  const projection = session.getProjection();
  projection.skip = session.lastHit - session.resultsCount - projection.limit;

  const { cursors: prevCursors, sessionData: prevSessionData } = await findCards(sessionId, new Query(session.getSelector(), projection), this.userId);
  if (prevSessionData) this.added('sessiondata', prevSessionData._id, prevSessionData);
  return prevCursors;
});

async function findCards(sessionId, query, userId) {
  // SessionData replays selectors for pagination. Scope again here so a session
  // written by an older vulnerable release cannot retain cross-board access,
  // and reject execution operators before either MongoDB or FerretDB sees them.
  const authorizedBoardIds = await Boards.userBoardIds(
    userId,
    null,
    {},
    SEARCH_BOARD_SCOPE,
  );
  const storedSelector = selectorIsInjection(
    query.selector,
    'globalSearch.pagination',
  )
    ? MATCH_NOTHING
    : query.selector;
  const databaseSelector = storedSelector === MATCH_NOTHING
    ? MATCH_NOTHING
    : { $and: [storedSelector, { boardId: { $in: authorizedBoardIds } }] };

  let textMatches = query.getQueryParams().text;
  let isTextSearch = !!textMatches;
  let dbProjection = query.projection;
  if (isTextSearch) {
    dbProjection = {
      fields: { _id: 1, title: 1, description: 1, customFields: 1 },
      sort: query.projection.sort,
    };
    delete dbProjection.limit;
    delete dbProjection.skip;
  }

  let cards = await ReactiveCache.getCards(databaseSelector, dbProjection, true);
  let totalCardsCount = cards ? (typeof cards.countAsync === 'function' ? await cards.countAsync() : cards.count()) : 0;
  let orderedIds = [];

  if (isTextSearch && totalCardsCount > 0) {
    const regex = new RegExp(escapeForRegex(textMatches), 'i');
    const skip = query.projection.skip || 0;
    const limit = query.projection.limit || 25;
    const best = [];
    const retain = card => retainRankedCard(best, card, regex, skip + limit);
    if (typeof cards.forEachAsync === 'function') {
      await cards.forEachAsync(retain);
    } else {
      const fetched = typeof cards.fetchAsync === 'function'
        ? await cards.fetchAsync()
        : cards.fetch();
      fetched.forEach(retain);
    }
    const page = best.slice(skip, skip + limit);
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
      selector: SessionData.pickle(storedSelector),
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
    const attachmentsResult = await ReactiveCache.getAttachments({ 'meta.cardId': { $in: cardIds } }, {}, true);
    // Return all cursors except sessiondata - we'll add sessiondata separately after fetch
    return {
      cursors: [
        cards,
        await ReactiveCache.getBoards({ _id: { $in: boards } }, { fields: { ...fields, labels: 1, color: 1 } }, true),
        await ReactiveCache.getSwimlanes({ _id: { $in: swimlanes } }, { fields: { ...fields, color: 1 } }, true),
        await ReactiveCache.getLists({ _id: { $in: lists } }, { fields: { ...fields, color: 1 } }, true),
        await ReactiveCache.getCustomFields({ _id: { $in: customFieldIds } }, {}, true),
        await ReactiveCache.getUsers({ _id: { $in: users } }, { fields: Users.safeFields }, true),
        await ReactiveCache.getChecklists({ cardId: { $in: cardIds } }, {}, true),
        await ReactiveCache.getChecklistItems({ cardId: { $in: cardIds } }, {}, true),
        attachmentsResult.cursor || attachmentsResult,
        await ReactiveCache.getCardComments({ cardId: { $in: cardIds } }, {}, true),
      ],
      sessionData: storedSessionData,
    };
  } else {
    return {
      cursors: [],
      sessionData: storedSessionData,
    };
  }
}

// Admin "Cards report" — a flat, paginated listing of every card with its
// board/swimlane/list/member context. Uses plain server-side limit/skip just
// like the org/team/people admin lists, so only the current page is ever sent
// to the browser instead of the whole Cards collection.
Meteor.publish('cardsReport', async function(searchTerm = '', limit, skip = 0) {
  check(searchTerm, Match.OneOf(String, null, undefined));
  check(limit, Number);
  check(skip, Match.OneOf(Number, null, undefined));
  if (!this.userId || !(await ReactiveCache.getUser(this.userId))?.isAdmin) {
    return this.ready();
  }

  const query = {};
  if (searchTerm) {
    query.title = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }

  // Publish the page MANUALLY (fetch + this.added + this.ready): a returned sorted+
  // limited cursor triggers a LIMITED live observe that hangs on FerretDB's OpLog,
  // leaving the report stuck on the loading spinner (same as attachmentsList). The
  // report re-subscribes on every page/search change, so it needs no live cursor.
  const cards = await ReactiveCache.getCards(
    query,
    {
      // Only the six columns the report table renders. Without this projection
      // every page shipped WHOLE card documents — description, customFields,
      // vote/poker sub-documents, date fields, the lot — so a 25-row page could
      // be hundreds of kilobytes on boards with long descriptions. That, not the
      // row count, is what made the report feel like it was loading everything.
      fields: {
        title: 1,
        boardId: 1,
        listId: 1,
        swimlaneId: 1,
        members: 1,
        assignees: 1,
      },
      // Sort by the EXISTING { boardId:1, createdAt:-1 } index (see
      // server/models/cards.js) so one page is a bounded index scan. The old
      // { boardId:1, sort:1 } sort had no index, so every page load full-sorted all
      // cards in memory — the Admin Panel → Problems → Cards spinner on big sites.
      sort: { boardId: 1, createdAt: -1 },
      limit,
      skip: skip || 0,
    },
    false,
  );

  const boardIds = new Set();
  const listIds = new Set();
  const swimlaneIds = new Set();
  const userIds = new Set();
  cards.forEach(card => {
    if (card.boardId) boardIds.add(card.boardId);
    if (card.listId) listIds.add(card.listId);
    if (card.swimlaneId) swimlaneIds.add(card.swimlaneId);
    (card.members || []).forEach(userId => userIds.add(userId));
    (card.assignees || []).forEach(userId => userIds.add(userId));
  });

  const boards = await ReactiveCache.getBoards({ _id: { $in: [...boardIds] } }, { fields: { title: 1 } }, false);
  const lists = await ReactiveCache.getLists({ _id: { $in: [...listIds] } }, { fields: { title: 1 } }, false);
  const swimlanes = await ReactiveCache.getSwimlanes({ _id: { $in: [...swimlaneIds] } }, { fields: { title: 1 } }, false);
  const users = await ReactiveCache.getUsers({ _id: { $in: [...userIds] } }, { fields: Users.safeFields }, false);

  for (const doc of cards) { const { _id, ...fields } = doc; this.added('cards', _id, fields); }
  for (const doc of boards) { const { _id, ...fields } = doc; this.added('boards', _id, fields); }
  for (const doc of lists) { const { _id, ...fields } = doc; this.added('lists', _id, fields); }
  for (const doc of swimlanes) { const { _id, ...fields } = doc; this.added('swimlanes', _id, fields); }
  for (const doc of users) { const { _id, ...fields } = doc; this.added('users', _id, fields); }
  // The page, named - see the note in brokenCardsReport above.
  publishReportPage(this, 'report-cards', cards);
  this.ready();
});

Meteor.methods({
  async getCardsReportCount(searchTerm = '') {
    check(searchTerm, Match.OneOf(String, null, undefined));
    if (!this.userId || !(await ReactiveCache.getUser(this.userId))?.isAdmin) {
      throw new Meteor.Error('not-authorized');
    }
    const query = {};
    if (searchTerm) {
      query.title = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }
    const cursor = await ReactiveCache.getCards(query, {}, true);
    return typeof cursor.countAsync === 'function' ? await cursor.countAsync() : cursor.count();
  },
});
