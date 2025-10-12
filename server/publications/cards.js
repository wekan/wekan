import { ReactiveCache } from '/imports/reactiveCache';
import moment from 'moment/min/moment-with-locales';
import escapeForRegex from 'escape-string-regexp';
import Users from '../../models/users';
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

Meteor.publish('card', cardId => {
  check(cardId, String);
  const ret = ReactiveCache.getCards(
    { _id: cardId },
    {},
    true,
  );
  return ret;
});

/** publish all data which is necessary to display card details as popup
 * @returns array of cursors
 */
Meteor.publishRelations('popupCardData', function(cardId) {
  check(cardId, String);
  this.cursor(
    ReactiveCache.getCards(
      { _id: cardId },
      {},
      true,
    ),
    function(cardId, card) {
      this.cursor(ReactiveCache.getBoards({_id: card.boardId}, {}, true));
      this.cursor(ReactiveCache.getLists({boardId: card.boardId}, {}, true));
    },
  );
  const ret = this.ready()
  return ret;
});

Meteor.publish('myCards', function(sessionId) {
  check(sessionId, String);

  const queryParams = new QueryParams();
  queryParams.addPredicate(OPERATOR_USER, ReactiveCache.getCurrentUser().username);
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

// Meteor.publish('dueCards', function(sessionId, allUsers = false) {
//   check(sessionId, String);
//   check(allUsers, Boolean);
//
//   // eslint-disable-next-line no-console
//   // console.log('all users:', allUsers);
//
//   const queryParams = {
//     has: [{ field: 'dueAt', exists: true }],
//     limit: 25,
//     skip: 0,
//     sort: { name: 'dueAt', order: 'des' },
//   };
//
//   if (!allUsers) {
//     queryParams.users = [ReactiveCache.getCurrentUser().username];
//   }
//
//   return buildQuery(sessionId, queryParams);
// });

Meteor.publish('globalSearch', function(sessionId, params, text) {
  check(sessionId, String);
  check(params, Object);
  check(text, String);

  // eslint-disable-next-line no-console
  // console.log('queryParams:', params);

  const ret = findCards(sessionId, buildQuery(new QueryParams(params, text)));
  return ret;
});

function buildSelector(queryParams) {
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
      queryParams.getPredicates(OPERATOR_ORG).forEach(name => {
        const org = ReactiveCache.getOrg({
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
      });
      if (orgs.length) {
        boardsSelector.orgs = {
          $elemMatch: { orgId: { $in: orgs }, isActive: true }
        };
      }
    }

    if (queryParams.hasOperator(OPERATOR_TEAM)) {
      const teams = [];
      queryParams.getPredicates(OPERATOR_TEAM).forEach(name => {
        const team = ReactiveCache.getTeam({
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
      });
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
      selector.boardId = {
        $in: Boards.userBoardIds(userId, null, boardsSelector),
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
      queryParams.getPredicates(OPERATOR_SWIMLANE).forEach(query => {
        const swimlanes = ReactiveCache.getSwimlanes({
          title: new RegExp(escapeForRegex(query), 'i'),
        });
        if (swimlanes.length) {
          swimlanes.forEach(swim => {
            querySwimlanes.push(swim._id);
          });
        } else {
          errors.addNotFound(OPERATOR_SWIMLANE, query);
        }
      });

      // eslint-disable-next-line no-prototype-builtins
      if (!selector.swimlaneId.hasOwnProperty('swimlaneId')) {
        selector.swimlaneId = { $in: [] };
      }
      selector.swimlaneId.$in = querySwimlanes;
    }

    if (queryParams.hasOperator(OPERATOR_LIST)) {
      const queryLists = [];
      queryParams.getPredicates(OPERATOR_LIST).forEach(query => {
        const lists = ReactiveCache.getLists({
          title: new RegExp(escapeForRegex(query), 'i'),
        });
        if (lists.length) {
          lists.forEach(list => {
            queryLists.push(list._id);
          });
        } else {
          errors.addNotFound(OPERATOR_LIST, query);
        }
      });

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
      queryParams.getPredicates(OPERATOR_USER).forEach(username => {
        const user = ReactiveCache.getUser({ username });
        if (user) {
          users.push(user._id);
        } else {
          errors.addNotFound(OPERATOR_USER, username);
        }
      });
      if (users.length) {
        selector.$and.push({
          $or: [{ members: { $in: users } }, { assignees: { $in: users } }],
        });
      }
    }

    [OPERATOR_MEMBER, OPERATOR_ASSIGNEE, OPERATOR_CREATOR].forEach(key => {
      if (queryParams.hasOperator(key)) {
        const users = [];
        queryParams.getPredicates(key).forEach(username => {
          const user = ReactiveCache.getUser({ username });
          if (user) {
            users.push(user._id);
          } else {
            errors.addNotFound(key, username);
          }
        });
        if (users.length) {
          selector[key] = { $in: users };
        }
      }
    });

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
      queryParams.getPredicates(OPERATOR_HAS).forEach(has => {
        switch (has.field) {
          case PREDICATE_ATTACHMENT:
            selector.$and.push({
              _id: {
                $in: ReactiveCache.getAttachments({}, { fields: { cardId: 1 } }).map(
                  a => a.cardId,
                ),
              },
            });
            break;
          case PREDICATE_CHECKLIST:
            selector.$and.push({
              _id: {
                $in: ReactiveCache.getChecklists({}, { fields: { cardId: 1 } }).map(
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
      });
    }

    if (queryParams.text) {
      const regex = new RegExp(escapeForRegex(queryParams.text), 'i');

      const items = ReactiveCache.getChecklistItems(
        { title: regex },
        { fields: { cardId: 1, checklistId: 1 } },
      );
      const checklists = ReactiveCache.getChecklists(
        {
          $or: [
            { title: regex },
            { _id: { $in: items.map(item => item.checklistId) } },
          ],
        },
        { fields: { cardId: 1 } },
      );

      const attachments = ReactiveCache.getAttachments({ 'original.name': regex });

      const comments = ReactiveCache.getCardComments(
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

  // eslint-disable-next-line no-console
  // console.log('cards selector:', JSON.stringify(selector, null, 2));

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

function buildQuery(queryParams) {
  const query = buildSelector(queryParams);

  return buildProjection(query);
}

Meteor.publish('brokenCards', function(sessionId) {
  check(sessionId, String);

  const params = new QueryParams();
  params.addPredicate(OPERATOR_STATUS, PREDICATE_ALL);
  const query = buildQuery(params);
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

Meteor.publish('nextPage', function(sessionId) {
  check(sessionId, String);

  const session = ReactiveCache.getSessionData({ sessionId });
  const projection = session.getProjection();
  projection.skip = session.lastHit;

  const ret = findCards(sessionId, new Query(session.getSelector(), projection));
  return ret;
});

Meteor.publish('previousPage', function(sessionId) {
  check(sessionId, String);

  const session = ReactiveCache.getSessionData({ sessionId });
  const projection = session.getProjection();
  projection.skip = session.lastHit - session.resultsCount - projection.limit;

  const ret = findCards(sessionId, new Query(session.getSelector(), projection));
  return ret;
});

function findCards(sessionId, query) {
  const userId = Meteor.userId();

  // eslint-disable-next-line no-console
  // console.log('selector:', query.selector);
  // console.log('selector.$and:', query.selector.$and);
  // eslint-disable-next-line no-console
  // console.log('projection:', query.projection);

  const cards = ReactiveCache.getCards(query.selector, query.projection, true);
  // eslint-disable-next-line no-console
  // console.log('count:', cards.count());

  const update = {
    $set: {
      totalHits: 0,
      lastHit: 0,
      resultsCount: 0,
      cards: [],
      selector: SessionData.pickle(query.selector),
      projection: SessionData.pickle(query.projection),
      errors: query.errors(),
      debug: query.getQueryParams().getPredicate(OPERATOR_DEBUG)
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

  // eslint-disable-next-line no-console
  // console.log('sessionId:', sessionId);
  // eslint-disable-next-line no-console
  // console.log('userId:', userId);
  // eslint-disable-next-line no-console
  // console.log('update:', update);
  SessionData.upsert({ userId, sessionId }, update);

  // remove old session data
  SessionData.remove({
    userId,
    modifiedAt: {
      $lt: new Date(
        moment()
          .subtract(1, 'day')
          .format(),
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

    return [
      cards,
      ReactiveCache.getBoards(
        { _id: { $in: boards } },
        { fields: { ...fields, labels: 1, color: 1 } },
        true,
      ),
      ReactiveCache.getSwimlanes(
        { _id: { $in: swimlanes } },
        { fields: { ...fields, color: 1 } },
        true,
      ),
      ReactiveCache.getLists({ _id: { $in: lists } }, { fields }, true),
      ReactiveCache.getCustomFields({ _id: { $in: customFieldIds } }, {}, true),
      ReactiveCache.getUsers({ _id: { $in: users } }, { fields: Users.safeFields }, true),
      ReactiveCache.getChecklists({ cardId: { $in: cards.map(c => c._id) } }, {}, true),
      ReactiveCache.getChecklistItems({ cardId: { $in: cards.map(c => c._id) } }, {}, true),
      ReactiveCache.getAttachments({ 'meta.cardId': { $in: cards.map(c => c._id) } }, {}, true).cursor,
      ReactiveCache.getCardComments({ cardId: { $in: cards.map(c => c._id) } }, {}, true),
      SessionData.find({ userId, sessionId }),
    ];
  }

  return [SessionData.find({ userId, sessionId })];
}
