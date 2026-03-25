// This is the publication used to display the board list. We publish all the
// non-archived boards:
// 1. that the user is a member of
// 2. the user has starred
import { ReactiveCache } from '/imports/reactiveCache';
import { publishComposite } from 'meteor/reywood:publish-composite';
import { findWhere } from '/imports/lib/collectionHelpers';
import Users from "../../models/users";
import Org from "../../models/org";
import Team from "../../models/team";
import Attachments from '../../models/attachments';
import Boards from '/models/boards';

publishComposite('boards', function() {
  const userId = this.userId;
  // Ensure that the user is connected. If it is not, we need to return an empty
  // array to tell the client to remove the previously published docs.
  if (!Match.test(userId, String) || !userId) {
    return [];
  }

  return {
    async find() {
      return await ReactiveCache.getBoards(
        {
          archived: false,
          _id: { $in: await Boards.userBoardIds(userId, false) },
        },
        {
          sort: { sort: 1 /* boards default sorting */ },
        },
        true,
      );
    },
    children: [
      {
        async find(board) {
          // Publish lists with extended fields for proper sync
          // Including swimlaneId, modifiedAt, and _updatedAt for list order changes
          return await ReactiveCache.getLists(
            { boardId: board._id, archived: false },
            {
              fields: {
                _id: 1,
                title: 1,
                boardId: 1,
                swimlaneId: 1,
                archived: 1,
                sort: 1,
                color: 1,
                modifiedAt: 1,
                _updatedAt: 1,  // Hidden field to trigger updates
              }
            },
            true,
          );
        }
      },
      {
        async find(board) {
          return await ReactiveCache.getCards(
            { boardId: board._id, archived: false },
            {
              fields: {
                _id: 1,
                boardId: 1,
                listId: 1,
                archived: 1,
                sort: 1
              }
            },
            true,
          );
        }
      }
    ]
  };
});

Meteor.publish('boardsReport', async function() {
  const userId = this.userId;
  // Ensure that the user is connected. If it is not, we need to return an empty
  // array to tell the client to remove the previously published docs.
  if (!Match.test(userId, String) || !userId) return [];

  const boards = await ReactiveCache.getBoards(
    {
      _id: { $in: await Boards.userBoardIds(userId, null) },
    },
    {
      fields: {
        _id: 1,
        boardId: 1,
        archived: 1,
        slug: 1,
        title: 1,
        description: 1,
        color: 1,
        backgroundImageURL: 1,
        members: 1,
        orgs: 1,
        teams: 1,
        permission: 1,
        type: 1,
        sort: 1,
      },
      sort: { sort: 1 /* boards default sorting */ },
    },
    true,
  );

  const userIds = [];
  const orgIds = [];
  const teamIds = [];
  boards.forEach(board => {
    if (board.members) {
      board.members.forEach(member => {
        userIds.push(member.userId);
      });
    }
    if (board.orgs) {
      board.orgs.forEach(org => {
        orgIds.push(org.orgId);
      });
    }
    if (board.teams) {
      board.teams.forEach(team => {
        teamIds.push(team.teamId);
      });
    }
  })

  const ret = [
    boards,
    await ReactiveCache.getUsers({ _id: { $in: userIds } }, { fields: Users.safeFields }, true),
    await ReactiveCache.getTeams({ _id: { $in: teamIds } }, {}, true),
    await ReactiveCache.getOrgs({ _id: { $in: orgIds } }, {}, true),
  ]
  return ret;
});

Meteor.publish('archivedBoards', async function() {
  const userId = this.userId;
  if (!Match.test(userId, String)) return [];

  const ret = await ReactiveCache.getBoards(
    {
      _id: { $in: await Boards.userBoardIds(userId, true)},
      archived: true,
      members: {
         $elemMatch: {
           userId,
           isAdmin: true,
         },
       },
    },
    {
      fields: {
        _id: 1,
        archived: 1,
        slug: 1,
        title: 1,
        createdAt: 1,
        modifiedAt: 1,
        archivedAt: 1,
      },
      sort: { archivedAt: -1, modifiedAt: -1 },
    },
    true,
  );
  return ret;
});

// OPTIMIZED BOARD PUBLICATION
//
// Performance improvements implemented to reduce N+1 query problem:
// - Batches card-related queries (comments, attachments, checklists) instead of querying per-card
// - Uses field projections to minimize data transfer
// - Removed automatic loading of entire linked boards (cardType-linkedBoard)
// - Only loads visible data: cards, comments, attachments, checklists for current board
//
// Estimated improvement:
// - Before: ~800-1000 queries for board with 100 cards
// - After: ~15-20 batched queries for same board (40-50x reduction)
//
// If isArchived = false, this will only return board elements which are not archived.
// If isArchived = true, this will only return board elements which are archived.
publishComposite('board', async function(boardId, isArchived) {
  check(boardId, String);
  check(isArchived, Boolean);

  const thisUserId = this.userId;
  const $or = [{ permission: 'public' }];

  let currUser = (!Match.test(thisUserId, String) || !thisUserId) ? 'undefined' : await ReactiveCache.getUser(thisUserId);
  let orgIdsUserBelongs = currUser !== 'undefined' && currUser.teams !== 'undefined' ? currUser.orgIdsUserBelongs() : '';
  let teamIdsUserBelongs = currUser !== 'undefined' && currUser.teams !== 'undefined' ? currUser.teamIdsUserBelongs() : '';
  let orgsIds = [];
  let teamsIds = [];

  if (orgIdsUserBelongs && orgIdsUserBelongs != '') {
    orgsIds = orgIdsUserBelongs.split(',');
  }
  if (teamIdsUserBelongs && teamIdsUserBelongs != '') {
    teamsIds = teamIdsUserBelongs.split(',');
  }

  if (thisUserId) {
    $or.push({ members: { $elemMatch: { userId: thisUserId, isActive: true } } });
    $or.push({ 'orgs.orgId': { $in: orgsIds } });
    $or.push({ 'teams.teamId': { $in: teamsIds } });
  }

  return {
    async find() {
      return await ReactiveCache.getBoards(
        {
          _id: boardId,
          archived: false,
          // If the board is not public the user has to be a member of it to see it.
          $or,
        },
        { limit: 1, sort: { sort: 1 /* boards default sorting */ } },
        true,
      );
    },
    children: [
      // Lists
      {
        async find(board) {
          return await ReactiveCache.getLists({ boardId: board._id, archived: isArchived }, {}, true);
        }
      },
      // Swimlanes
      {
        async find(board) {
          return await ReactiveCache.getSwimlanes({ boardId: board._id, archived: isArchived }, {}, true);
        }
      },
      // Integrations
      {
        async find(board) {
          return await ReactiveCache.getIntegrations(
            { boardId: board._id },
            { fields: { token: 0 } },
            true,
          );
        }
      },
      // CardCommentReactions at board level
      {
        async find(board) {
          return await ReactiveCache.getCardCommentReactions({ boardId: board._id }, {}, true);
        }
      },
      // CustomFields
      {
        async find(board) {
          return await ReactiveCache.getCustomFields(
            { boardIds: { $in: [board._id] } },
            { sort: { name: 1 } },
            true,
          );
        }
      },
      // Cards
      {
        async find(board) {
          const cardSelector = {
            boardId: { $in: [board._id, board.subtasksDefaultBoardId] },
            archived: isArchived,
          };

          // Check if current user has assigned-only permissions
          if (thisUserId && board.members) {
            const member = findWhere(board.members, { userId: thisUserId, isActive: true });
            if (member && (member.isNormalAssignedOnly || member.isCommentAssignedOnly || member.isReadAssignedOnly)) {
              // User with assigned-only permissions should only see cards assigned to them
              cardSelector.assignees = { $in: [thisUserId] };
            }
          }

          return await ReactiveCache.getCards(cardSelector, {}, true);
        }
      },
      // Batch CardComments for all cards
      {
        async find(board) {
          const cardSelector = {
            boardId: { $in: [board._id, board.subtasksDefaultBoardId] },
            archived: isArchived,
          };

          if (thisUserId && board.members) {
            const member = findWhere(board.members, { userId: thisUserId, isActive: true });
            if (member && (member.isNormalAssignedOnly || member.isCommentAssignedOnly || member.isReadAssignedOnly)) {
              cardSelector.assignees = { $in: [thisUserId] };
            }
          }

          const cards = await ReactiveCache.getCards(cardSelector, { fields: { _id: 1 } }, false);
          if (!cards || cards.length === 0) return null;

          const cardIds = cards.map(c => c._id);
          return await ReactiveCache.getCardComments({ cardId: { $in: cardIds } }, {}, true);
        }
      },
      // Batch Attachments for all cards
      {
        async find(board) {
          const cardSelector = {
            boardId: { $in: [board._id, board.subtasksDefaultBoardId] },
            archived: isArchived,
          };

          if (thisUserId && board.members) {
            const member = findWhere(board.members, { userId: thisUserId, isActive: true });
            if (member && (member.isNormalAssignedOnly || member.isCommentAssignedOnly || member.isReadAssignedOnly)) {
              cardSelector.assignees = { $in: [thisUserId] };
            }
          }

          const cards = await ReactiveCache.getCards(cardSelector, { fields: { _id: 1 } }, false);
          if (!cards || cards.length === 0) return null;

          const cardIds = cards.map(c => c._id);
          const result = await ReactiveCache.getAttachments({ 'meta.cardId': { $in: cardIds } }, {}, true);
          return result.cursor || result;
        }
      },
      // Batch Checklists for all cards
      {
        async find(board) {
          const cardSelector = {
            boardId: { $in: [board._id, board.subtasksDefaultBoardId] },
            archived: isArchived,
          };

          if (thisUserId && board.members) {
            const member = findWhere(board.members, { userId: thisUserId, isActive: true });
            if (member && (member.isNormalAssignedOnly || member.isCommentAssignedOnly || member.isReadAssignedOnly)) {
              cardSelector.assignees = { $in: [thisUserId] };
            }
          }

          const cards = await ReactiveCache.getCards(cardSelector, { fields: { _id: 1 } }, false);
          if (!cards || cards.length === 0) return null;

          const cardIds = cards.map(c => c._id);
          return await ReactiveCache.getChecklists({ cardId: { $in: cardIds } }, {}, true);
        }
      },
      // Batch ChecklistItems for all cards
      {
        async find(board) {
          const cardSelector = {
            boardId: { $in: [board._id, board.subtasksDefaultBoardId] },
            archived: isArchived,
          };

          if (thisUserId && board.members) {
            const member = findWhere(board.members, { userId: thisUserId, isActive: true });
            if (member && (member.isNormalAssignedOnly || member.isCommentAssignedOnly || member.isReadAssignedOnly)) {
              cardSelector.assignees = { $in: [thisUserId] };
            }
          }

          const cards = await ReactiveCache.getCards(cardSelector, { fields: { _id: 1 } }, false);
          if (!cards || cards.length === 0) return null;

          const cardIds = cards.map(c => c._id);
          return await ReactiveCache.getChecklistItems({ cardId: { $in: cardIds } }, {}, true);
        }
      },
      // Parent cards (for subtasks)
      {
        async find(board) {
          const cardSelector = {
            boardId: { $in: [board._id, board.subtasksDefaultBoardId] },
            archived: isArchived,
          };

          if (thisUserId && board.members) {
            const member = findWhere(board.members, { userId: thisUserId, isActive: true });
            if (member && (member.isNormalAssignedOnly || member.isCommentAssignedOnly || member.isReadAssignedOnly)) {
              cardSelector.assignees = { $in: [thisUserId] };
            }
          }

          const cards = await ReactiveCache.getCards(cardSelector, { fields: { _id: 1, parentId: 1 } }, false);
          if (!cards || cards.length === 0) return null;

          const parentIds = cards.filter(c => c.parentId).map(c => c.parentId);
          if (parentIds.length === 0) return null;

          return await ReactiveCache.getCards({ _id: { $in: parentIds } }, {}, true);
        }
      },
      // Linked cards (cardType-linkedCard)
      {
        async find(board) {
          const cardSelector = {
            boardId: { $in: [board._id, board.subtasksDefaultBoardId] },
            archived: isArchived,
          };

          if (thisUserId && board.members) {
            const member = findWhere(board.members, { userId: thisUserId, isActive: true });
            if (member && (member.isNormalAssignedOnly || member.isCommentAssignedOnly || member.isReadAssignedOnly)) {
              cardSelector.assignees = { $in: [thisUserId] };
            }
          }

          const cards = await ReactiveCache.getCards(cardSelector, { fields: { _id: 1, type: 1, linkedId: 1 } }, false);
          if (!cards || cards.length === 0) return null;

          const linkedCardIds = cards.filter(c => c.type === 'cardType-linkedCard' && c.linkedId).map(c => c.linkedId);
          if (linkedCardIds.length === 0) return null;

          return await ReactiveCache.getCards({ _id: { $in: linkedCardIds }, archived: isArchived }, {}, true);
        }
      },
      // Comments for linked cards
      {
        async find(board) {
          const cardSelector = {
            boardId: { $in: [board._id, board.subtasksDefaultBoardId] },
            archived: isArchived,
          };

          if (thisUserId && board.members) {
            const member = findWhere(board.members, { userId: thisUserId, isActive: true });
            if (member && (member.isNormalAssignedOnly || member.isCommentAssignedOnly || member.isReadAssignedOnly)) {
              cardSelector.assignees = { $in: [thisUserId] };
            }
          }

          const cards = await ReactiveCache.getCards(cardSelector, { fields: { _id: 1, type: 1, linkedId: 1 } }, false);
          if (!cards || cards.length === 0) return null;

          const linkedCardIds = cards.filter(c => c.type === 'cardType-linkedCard' && c.linkedId).map(c => c.linkedId);
          if (linkedCardIds.length === 0) return null;

          return await ReactiveCache.getCardComments({ cardId: { $in: linkedCardIds } }, {}, true);
        }
      },
      // Attachments for linked cards
      {
        async find(board) {
          const cardSelector = {
            boardId: { $in: [board._id, board.subtasksDefaultBoardId] },
            archived: isArchived,
          };

          if (thisUserId && board.members) {
            const member = findWhere(board.members, { userId: thisUserId, isActive: true });
            if (member && (member.isNormalAssignedOnly || member.isCommentAssignedOnly || member.isReadAssignedOnly)) {
              cardSelector.assignees = { $in: [thisUserId] };
            }
          }

          const cards = await ReactiveCache.getCards(cardSelector, { fields: { _id: 1, type: 1, linkedId: 1 } }, false);
          if (!cards || cards.length === 0) return null;

          const linkedCardIds = cards.filter(c => c.type === 'cardType-linkedCard' && c.linkedId).map(c => c.linkedId);
          if (linkedCardIds.length === 0) return null;

          const result = await ReactiveCache.getAttachments({ 'meta.cardId': { $in: linkedCardIds } }, {}, true);
          return result.cursor || result;
        }
      },
      // Checklists for linked cards
      {
        async find(board) {
          const cardSelector = {
            boardId: { $in: [board._id, board.subtasksDefaultBoardId] },
            archived: isArchived,
          };

          if (thisUserId && board.members) {
            const member = findWhere(board.members, { userId: thisUserId, isActive: true });
            if (member && (member.isNormalAssignedOnly || member.isCommentAssignedOnly || member.isReadAssignedOnly)) {
              cardSelector.assignees = { $in: [thisUserId] };
            }
          }

          const cards = await ReactiveCache.getCards(cardSelector, { fields: { _id: 1, type: 1, linkedId: 1 } }, false);
          if (!cards || cards.length === 0) return null;

          const linkedCardIds = cards.filter(c => c.type === 'cardType-linkedCard' && c.linkedId).map(c => c.linkedId);
          if (linkedCardIds.length === 0) return null;

          return await ReactiveCache.getChecklists({ cardId: { $in: linkedCardIds } }, {}, true);
        }
      },
      // ChecklistItems for linked cards
      {
        async find(board) {
          const cardSelector = {
            boardId: { $in: [board._id, board.subtasksDefaultBoardId] },
            archived: isArchived,
          };

          if (thisUserId && board.members) {
            const member = findWhere(board.members, { userId: thisUserId, isActive: true });
            if (member && (member.isNormalAssignedOnly || member.isCommentAssignedOnly || member.isReadAssignedOnly)) {
              cardSelector.assignees = { $in: [thisUserId] };
            }
          }

          const cards = await ReactiveCache.getCards(cardSelector, { fields: { _id: 1, type: 1, linkedId: 1 } }, false);
          if (!cards || cards.length === 0) return null;

          const linkedCardIds = cards.filter(c => c.type === 'cardType-linkedCard' && c.linkedId).map(c => c.linkedId);
          if (linkedCardIds.length === 0) return null;

          return await ReactiveCache.getChecklistItems({ cardId: { $in: linkedCardIds } }, {}, true);
        }
      },
      // Board members/Users
      {
        async find(board) {
          if (board.members) {
            // Board members. This publication also includes former board members that
            // aren't members anymore but may have some activities attached to them in
            // the history.
            const memberIds = board.members.map(x => x.userId);

            // We omit the current user because the client should already have that data,
            // and sending it triggers a subtle bug:
            // https://github.com/wefork/wekan/issues/15
            return await ReactiveCache.getUsers(
              {
                _id: { $in: memberIds.filter(x => x !== thisUserId) },
              },
              {
                fields: {
                  username: 1,
                  'profile.fullname': 1,
                  'profile.avatarUrl': 1,
                  'profile.initials': 1,
                },
              },
              true,
            );
          }
          return null;
        }
      }
    ]
  };
});

Meteor.methods({
  async copyBoard(boardId, properties) {
    check(boardId, String);
    check(properties, Object);

    let ret = null;
    const board = await ReactiveCache.getBoard(boardId);
    if (board) {
      for (const key in properties) {
        board[key] = properties[key];
      }
      ret = board.copy();
    }
    return ret;
  },
});
