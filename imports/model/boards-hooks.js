import { Meteor } from 'meteor/meteor';

let BoardsHooks;
const Methods = {};

if (Meteor.isServer) {

  // The first activity of the newly created board
  function addActivityForBoardCreated(userId, doc) {
    Activities.insert({
      userId,
      type: 'board',
      activityTypeId: doc._id,
      activityType: 'createBoard',
      boardId: doc._id,
    });
  }

  // If the user remove one label from a board, we can't remove reference of
  // this label in any card of this board.
  function removeLabelFromCardsInBoard(userId, doc, fieldNames, modifier) {
    if (!_.contains(fieldNames, 'labels') ||
      !modifier.$pull ||
      !modifier.$pull.labels ||
      !modifier.$pull.labels._id) {
      return;
    }

    const removedLabelId = modifier.$pull.labels._id;
    Cards.update(
      { boardId: doc._id },
      {
        $pull: {
          labelIds: removedLabelId,
        },
      },
      { multi: true }
    );
  }

  Methods.userPredicate = (doc, memberIndex) => {
    return !doc.members[memberIndex].isTeam;
  };

  Methods.foreachRemovedMember = (doc, modifier, predicate, callback) => {
    Object.keys(modifier).forEach((set) => {
      if (modifier[set] !== false) {
        return;
      }

      const parts = set.split('.');
      if (parts.length === 3 && parts[0] === 'members' && parts[2] === 'isActive') {
        if (predicate(doc, parts[1])) {
          callback(doc, doc.members[parts[1]].userId);
        }
      }
    });
  };

  Methods.removeUserFromBoardObjectsCallback = (doc, memberId) => {
    const boardId = doc._id;

    Cards.update(
      { boardId },
      {
        $pull: {
          members: memberId,
          watchers: memberId,
        },
      },
      { multi: true }
    );

    Lists.update(
      { boardId },
      {
        $pull: {
          watchers: memberId,
        },
      },
      { multi: true }
    );

    const board = Boards._transform(doc);
    board.setWatcher(memberId, false);

    // Remove board from users starred list
    if (!board.isPublic()) {
      Users.update(
        memberId,
        {
          $pull: {
            'profile.starredBoards': boardId,
          },
        }
      );
    }
  };

  // Remove a member from all objects of the board before leaving the board
  function removeUserFromBoardObjects(userId, doc, fieldNames, modifier) {
    if (!_.contains(fieldNames, 'members')) {
      return;
    }

    if (modifier.$set) {
      Methods.foreachRemovedMember(
        doc,
        modifier.$set,
        Methods.userPredicate,
        Methods.removeUserFromBoardObjectsCallback);
    }
  }

  Methods.teamPredicate = function (doc, memberIndex) {
    return !!doc.members[memberIndex].isTeam;
  };

  // Add a new activity if we add or remove a member to the board
  function addActivityWhenMemberAddedOrRemoved(userId, doc, fieldNames, modifier) {
    if (!_.contains(fieldNames, 'members')) {
      return;
    }

    // Say hello to the new member
    if (modifier.$push && modifier.$push.members) {
      const memberId = modifier.$push.members.userId;
      Activities.insert({
        userId,
        memberId,
        type: 'member',
        activityType: 'addBoardMember',
        boardId: doc._id,
      });
    }

    // Say goodbye to the former member
    if (modifier.$set) {
      Methods.foreachRemovedMember(
        doc,
        modifier.$set,
        Methods.userPredicate, (doc, memberId) => {
          Activities.insert({
            userId,
            memberId,
            type: 'member',
            activityType: 'removeBoardMember',
            boardId: doc._id,
          });
        });
    }
  }

  BoardsHooks = {
    addActivityForBoardCreated,
    removeLabelFromCardsInBoard,
    removeUserFromBoardObjects,
    addActivityWhenMemberAddedOrRemoved,
  };

  if (Meteor.isTest) {
    // Export internal methods only in the test
    BoardsHooks.Internals = Methods;
  }
}

export { BoardsHooks };
