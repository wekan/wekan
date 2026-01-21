// This is the publication used to display the board list. We publish all the
// non-archived boards:
// 1. that the user is a member of
// 2. the user has starred
import { ReactiveCache } from '/imports/reactiveCache';
import { publishComposite } from 'meteor/reywood:publish-composite';
import Users from "../../models/users";
import Org from "../../models/org";
import Team from "../../models/team";
import Attachments from '../../models/attachments';

publishComposite('boards', function() {
  const userId = this.userId;
  // Ensure that the user is connected. If it is not, we need to return an empty
  // array to tell the client to remove the previously published docs.
  if (!Match.test(userId, String) || !userId) {
    return [];
  }

  return {
    find() {
      return ReactiveCache.getBoards(
        {
          archived: false,
          _id: { $in: Boards.userBoardIds(userId, false) },
        },
        {
          sort: { sort: 1 /* boards default sorting */ },
        },
        true,
      );
    },
    children: [
      {
        find(board) {
          // Publish lists with extended fields for proper sync
          // Including swimlaneId, modifiedAt, and _updatedAt for list order changes
          return ReactiveCache.getLists(
            { boardId: board._id, archived: false },
            {
              fields: {
                _id: 1,
                title: 1,
                boardId: 1,
                swimlaneId: 1,
                archived: 1,
                sort: 1,
                modifiedAt: 1,
                _updatedAt: 1,  // Hidden field to trigger updates
              }
            },
            true,
          );
        }
      },
      {
        find(board) {
          return ReactiveCache.getCards(
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

Meteor.publish('boardsReport', function() {
  const userId = this.userId;
  // Ensure that the user is connected. If it is not, we need to return an empty
  // array to tell the client to remove the previously published docs.
  if (!Match.test(userId, String) || !userId) return [];

  const boards = ReactiveCache.getBoards(
    {
      _id: { $in: Boards.userBoardIds(userId, null) },
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
    ReactiveCache.getUsers({ _id: { $in: userIds } }, { fields: Users.safeFields }, true),
    ReactiveCache.getTeams({ _id: { $in: teamIds } }, {}, true),
    ReactiveCache.getOrgs({ _id: { $in: orgIds } }, {}, true),
  ]
  return ret;
});

Meteor.publish('archivedBoards', function() {
  const userId = this.userId;
  if (!Match.test(userId, String)) return [];

  const ret = ReactiveCache.getBoards(
    {
      _id: { $in: Boards.userBoardIds(userId, true)},
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

// If isArchived = false, this will only return board elements which are not archived.
// If isArchived = true, this will only return board elements which are archived.
publishComposite('board', function(boardId, isArchived) {
  check(boardId, String);
  check(isArchived, Boolean);

  const thisUserId = this.userId;
  const $or = [{ permission: 'public' }];

  let currUser = (!Match.test(thisUserId, String) || !thisUserId) ? 'undefined' : ReactiveCache.getUser(thisUserId);
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
    find() {
      return ReactiveCache.getBoards(
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
        find(board) {
          return ReactiveCache.getLists({ boardId: board._id, archived: isArchived }, {}, true);
        }
      },
      // Swimlanes
      {
        find(board) {
          return ReactiveCache.getSwimlanes({ boardId: board._id, archived: isArchived }, {}, true);
        }
      },
      // Integrations
      {
        find(board) {
          return ReactiveCache.getIntegrations({ boardId: board._id }, {}, true);
        }
      },
      // CardCommentReactions at board level
      {
        find(board) {
          return ReactiveCache.getCardCommentReactions({ boardId: board._id }, {}, true);
        }
      },
      // CustomFields
      {
        find(board) {
          return ReactiveCache.getCustomFields(
            { boardIds: { $in: [board._id] } },
            { sort: { name: 1 } },
            true,
          );
        }
      },
      // Cards and their related data
      {
        find(board) {
          const cardSelector = {
            boardId: { $in: [board._id, board.subtasksDefaultBoardId] },
            archived: isArchived,
          };

          // Check if current user has assigned-only permissions
          if (thisUserId && board.members) {
            const member = _.findWhere(board.members, { userId: thisUserId, isActive: true });
            if (member && (member.isNormalAssignedOnly || member.isCommentAssignedOnly || member.isReadAssignedOnly)) {
              // User with assigned-only permissions should only see cards assigned to them
              cardSelector.assignees = { $in: [thisUserId] };
            }
          }

          return ReactiveCache.getCards(cardSelector, {}, true);
        },
        children: [
          // CardComments for each card
          {
            find(card) {
              return CardComments.find({ cardId: card._id });
            }
          },
          // CardCommentReactions for each card
          {
            find(card) {
              return CardCommentReactions.find({ cardId: card._id });
            }
          },
          // Attachments for each card
          {
            find(card) {
              return Attachments.collection.find({ 'meta.cardId': card._id });
            }
          },
          // Checklists for each card
          {
            find(card) {
              return Checklists.find({ cardId: card._id });
            }
          },
          // ChecklistItems for each card
          {
            find(card) {
              return ChecklistItems.find({ cardId: card._id });
            }
          },
          // Parent cards (cards that have this card as parentId)
          {
            find(card) {
              return Cards.find({ parentId: card._id });
            }
          },
          // Linked card data (for cardType-linkedCard)
          {
            find(card) {
              if (card.type === 'cardType-linkedCard' && card.linkedId) {
                return Cards.find({ _id: card.linkedId, archived: isArchived });
              }
              return null;
            },
            children: [
              // Comments for linked card
              {
                find(linkedCard) {
                  return CardComments.find({ cardId: linkedCard._id });
                }
              },
              // Attachments for linked card
              {
                find(linkedCard) {
                  return Attachments.collection.find({ 'meta.cardId': linkedCard._id });
                }
              },
              // Checklists for linked card
              {
                find(linkedCard) {
                  return Checklists.find({ cardId: linkedCard._id });
                }
              },
              // ChecklistItems for linked card
              {
                find(linkedCard) {
                  return ChecklistItems.find({ cardId: linkedCard._id });
                }
              }
            ]
          },
          // Linked board (for cardType-linkedBoard)
          {
            find(card) {
              if (card.type === 'cardType-linkedBoard' && card.linkedId) {
                return Boards.find({ _id: card.linkedId });
              }
              return null;
            }
          },
          // Cards in linked board (for cardType-linkedBoard)
          {
            find(card) {
              if (card.type === 'cardType-linkedBoard' && card.linkedId) {
                return Cards.find({ boardId: card.linkedId });
              }
              return null;
            }
          },
          // Comments for linked board cards (for cardType-linkedBoard)
          {
            find(card) {
              if (card.type === 'cardType-linkedBoard' && card.linkedId) {
                return CardComments.find({ boardId: card.linkedId });
              }
              return null;
            }
          }
        ]
      },
      // Board members/Users
      {
        find(board) {
          if (board.members) {
            // Board members. This publication also includes former board members that
            // aren't members anymore but may have some activities attached to them in
            // the history.
            const memberIds = _.pluck(board.members, 'userId');

            // We omit the current user because the client should already have that data,
            // and sending it triggers a subtle bug:
            // https://github.com/wefork/wekan/issues/15
            return ReactiveCache.getUsers(
              {
                _id: { $in: _.without(memberIds, thisUserId) },
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
  copyBoard(boardId, properties) {
    check(boardId, String);
    check(properties, Object);

    let ret = null;
    const board = ReactiveCache.getBoard(boardId);
    if (board) {
      for (const key in properties) {
        board[key] = properties[key];
      }
      ret = board.copy();
    }
    return ret;
  },
});
