import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { Authentication } from '/server/authentication';
import { sendJsonResult } from '/server/apiMiddleware';
import { allowIsBoardAdmin } from '/server/lib/utils';
import { ReactiveCache } from '/imports/reactiveCache';
import Activities from '/models/activities';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Integrations from '/models/integrations';
import Lists from '/models/lists';
import Rules from '/models/rules';
import Swimlanes from '/models/swimlanes';
import TableVisibilityModeSettings from '/models/tableVisibilityModeSettings';
import Triggers from '/models/triggers';
import Users from '/models/users';

const getTAPi18n = () => require('/imports/i18n').TAPi18n;

function getTranslatedString(key, fallback, options) {
  const i18n = getTAPi18n && getTAPi18n();
  if (!i18n || !i18n.i18n) {
    return fallback;
  }
  const translated = i18n.__(key, options);
  return typeof translated === 'string' ? translated : fallback;
}

async function boardRemover(doc) {
  for (const element of [
    Cards,
    Lists,
    Swimlanes,
    Integrations,
    Rules,
    Activities,
    Triggers,
  ]) {
    await element.removeAsync({ boardId: doc._id });
  }
}

const foreachRemovedMember = (doc, modifier, callback) => {
  Object.keys(modifier).forEach(set => {
    if (modifier[set] !== false) {
      return;
    }

    const parts = set.split('.');
    if (
      parts.length === 3 &&
      parts[0] === 'members' &&
      parts[2] === 'isActive'
    ) {
      callback(doc.members[parts[1]].userId);
    }
  });
};

Meteor.methods({
  async createBoardWithInitialSwimlanes(payload) {
    check(
      payload,
      Match.ObjectIncluding({
        title: String,
        slug: String,
        permission: Match.Maybe(String),
        type: Match.Maybe(String),
        migrationVersion: Match.Maybe(Number),
        swimlanes: Match.Maybe(Array),
      }),
    );

    const {
      title,
      slug,
      permission = 'private',
      type = 'board',
      migrationVersion = 1,
      swimlanes = [],
    } = payload;

    for (const swimlane of swimlanes) {
      check(swimlane, Object);
      check(swimlane.title, String);
      check(swimlane.sort, Match.Maybe(Number));
      check(swimlane.type, Match.Maybe(String));
    }

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    const boardId = await Boards.insertAsync({
      title,
      slug,
      permission,
      type,
      migrationVersion,
      members: [
        {
          userId: this.userId,
          isAdmin: true,
          isActive: true,
          isNoComments: false,
          isCommentOnly: false,
          isWorker: false,
        },
      ],
    });

    for (const swimlane of swimlanes) {
      await Swimlanes.insertAsync({
        title: swimlane.title,
        boardId,
        sort: swimlane.sort,
        type: swimlane.type,
      });
    }

    return boardId;
  },

  async getBackgroundImageURL(boardId) {
    check(boardId, String);
    return await ReactiveCache.getBoard(boardId, {}, { backgroundImageUrl: 1 });
  },

  async quitBoard(boardId) {
    check(boardId, String);
    const board = await ReactiveCache.getBoard(boardId);
    if (!board) {
      throw new Meteor.Error('error-board-doesNotExist');
    }

    const userId = this.userId;
    const index = board.memberIndex(userId);
    if (index < 0) {
      throw new Meteor.Error('error-board-notAMember');
    }

    await board.removeMember(userId);
    return true;
  },

  async acceptInvite(boardId) {
    check(boardId, String);
    const board = await ReactiveCache.getBoard(boardId);
    if (!board) {
      throw new Meteor.Error('error-board-doesNotExist');
    }

    await Meteor.users.updateAsync(this.userId, {
      $pull: {
        'profile.invitedBoards': boardId,
      },
    });

    await Boards.updateAsync(
      {
        _id: boardId,
        'members.userId': this.userId,
      },
      {
        $set: {
          'members.$.isActive': true,
          modifiedAt: new Date(),
        },
      },
    );
  },

  async myLabelNames() {
    let names = [];
    const boards = await Boards.userBoards(this.userId);
    for (const board of boards) {
      if (board.labels !== undefined) {
        names = names.concat(
          board.labels
            .filter(label => !!label.name)
            .map(label => label.name),
        );
      }
    }
    return [...new Set(names)].sort();
  },

  async myBoardNames() {
    const boards = await Boards.userBoards(this.userId);
    return [...new Set(boards.map(board => board.title))].sort();
  },

  async setAllBoardsHideActivities() {
    const currentUser = await ReactiveCache.getCurrentUser();
    if (!(currentUser || {}).isAdmin) {
      return false;
    }

    await Boards.updateAsync(
      {
        showActivities: true,
      },
      {
        $set: {
          showActivities: false,
        },
      },
      {
        multi: true,
      },
    );
    return true;
  },

  async archiveBoard(boardId) {
    check(boardId, String);
    const board = await ReactiveCache.getBoard(boardId);
    if (!board) {
      throw new Meteor.Error('error-board-doesNotExist');
    }

    const userId = this.userId;
    const index = board.memberIndex(userId);
    if (index < 0) {
      throw new Meteor.Error('error-board-notAMember');
    }

    await board.archive();
    return true;
  },

  async setBoardOrgs(boardOrgsArray, currBoardId) {
    check(boardOrgsArray, Array);
    check(currBoardId, String);

    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to perform this action.');
    }

    const board = await ReactiveCache.getBoard(currBoardId);
    if (!board) {
      throw new Meteor.Error('board-not-found', 'Board not found.');
    }
    if (!allowIsBoardAdmin(userId, board)) {
      throw new Meteor.Error('not-authorized', 'You must be a board admin to perform this action.');
    }

    for (const org of boardOrgsArray) {
      check(org.orgId, String);
      check(org.orgDisplayName, String);
      check(org.isActive, Boolean);
    }

    await Boards.updateAsync(currBoardId, {
      $set: {
        orgs: boardOrgsArray,
      },
    });
  },

  async setBoardTeams(boardTeamsArray, membersArray, currBoardId) {
    check(boardTeamsArray, Array);
    check(membersArray, Array);
    check(currBoardId, String);

    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to perform this action.');
    }

    const board = await ReactiveCache.getBoard(currBoardId);
    if (!board) {
      throw new Meteor.Error('board-not-found', 'Board not found.');
    }
    if (!allowIsBoardAdmin(userId, board)) {
      throw new Meteor.Error('not-authorized', 'You must be a board admin to perform this action.');
    }

    for (const team of boardTeamsArray) {
      check(team.teamId, String);
      check(team.teamDisplayName, String);
      check(team.isActive, Boolean);
    }

    for (const member of membersArray) {
      check(member.userId, String);
      check(member.isAdmin, Boolean);
      check(member.isActive, Boolean);
      if (member.isNoComments !== undefined) check(member.isNoComments, Boolean);
      if (member.isCommentOnly !== undefined) check(member.isCommentOnly, Boolean);
      if (member.isWorker !== undefined) check(member.isWorker, Boolean);
      if (member.isNormalAssignedOnly !== undefined) check(member.isNormalAssignedOnly, Boolean);
      if (member.isCommentAssignedOnly !== undefined) check(member.isCommentAssignedOnly, Boolean);
      if (member.isReadOnly !== undefined) check(member.isReadOnly, Boolean);
      if (member.isReadAssignedOnly !== undefined) check(member.isReadAssignedOnly, Boolean);
    }

    await Boards.updateAsync(currBoardId, {
      $set: {
        members: membersArray,
        teams: boardTeamsArray,
      },
    });
  },
});

Boards.before.insert(async (userId, doc) => {
  const lastBoard = await ReactiveCache.getBoard(
    { sort: { $exists: true } },
    { sort: { sort: -1 } },
  );
  if (lastBoard && typeof lastBoard.sort !== 'undefined') {
    doc.sort = lastBoard.sort + 1;
  }
});

Meteor.startup(async () => {
  await Boards._collection.createIndexAsync({ modifiedAt: -1 });
  await Boards._collection.createIndexAsync(
    {
      _id: 1,
      'members.userId': 1,
    },
    { unique: true },
  );
  await Boards._collection.createIndexAsync({ 'members.userId': 1 });
});

Boards.after.insert(async (userId, doc) => {
  await Activities.insertAsync({
    userId,
    type: 'board',
    activityTypeId: doc._id,
    activityType: 'createBoard',
    boardId: doc._id,
  });
});

Boards.after.update(async (userId, doc, fieldNames, modifier) => {
  if (
    !(fieldNames || []).includes('labels') ||
    !modifier.$pull ||
    !modifier.$pull.labels ||
    !modifier.$pull.labels._id
  ) {
    return;
  }

  const removedLabelId = modifier.$pull.labels._id;
  await Cards.updateAsync(
    { boardId: doc._id },
    {
      $pull: {
        labelIds: removedLabelId,
      },
    },
    { multi: true },
  );
});

Boards.before.update((userId, doc, fieldNames, modifier) => {
  if (!(fieldNames || []).includes('members') || !modifier.$set) {
    return;
  }

  const boardId = doc._id;
  foreachRemovedMember(doc, modifier.$set, async memberId => {
    await Cards.updateAsync(
      { boardId },
      {
        $pull: {
          members: memberId,
          watchers: memberId,
        },
      },
      { multi: true },
    );

    await Lists.updateAsync(
      { boardId },
      {
        $pull: {
          watchers: memberId,
        },
      },
      { multi: true },
    );

    const board = Boards._transform(doc);
    await board.setWatcher(memberId, false);

    if (!board.isPublic()) {
      await Users.updateAsync(memberId, {
        $pull: {
          'profile.starredBoards': boardId,
        },
      });
    }
  });
});

Boards.before.remove(async (userId, doc) => {
  await boardRemover(doc);
  await Activities.insertAsync({
    userId,
    type: 'board',
    activityTypeId: doc._id,
    activityType: 'removeBoard',
    boardId: doc._id,
  });
});

Boards.after.update(async (userId, doc, fieldNames, modifier) => {
  if (fieldNames.includes('title')) {
    await Activities.insertAsync({
      userId,
      type: 'board',
      activityType: 'changedBoardTitle',
      boardId: doc._id,
      title: doc.title,
    });
  }

  if (!(fieldNames || []).includes('members')) {
    return;
  }

  if (modifier.$push && modifier.$push.members) {
    const memberId = modifier.$push.members.userId;
    await Activities.insertAsync({
      userId,
      memberId,
      type: 'member',
      activityType: 'addBoardMember',
      boardId: doc._id,
    });
  }

  if (modifier.$set) {
    const removedMemberIds = [];
    foreachRemovedMember(doc, modifier.$set, memberId => {
      removedMemberIds.push(memberId);
    });

    for (const memberId of removedMemberIds) {
      await Activities.insertAsync({
        userId,
        memberId,
        type: 'member',
        activityType: 'removeBoardMember',
        boardId: doc._id,
      });
    }
  }
});

WebApp.handlers.get('/api/users/:userId/boards', async function(req, res) {
  try {
    Authentication.checkLoggedIn(req.userId);
    const paramUserId = req.params.userId;
    Authentication.checkAdminOrCondition(req.userId, req.userId === paramUserId);

    const boards = await ReactiveCache.getBoards(
      {
        archived: false,
        'members.userId': paramUserId,
      },
      {
        sort: { sort: 1 },
      },
    );
    const data = boards.map(board => ({
      _id: board._id,
      title: board.title,
    }));

    sendJsonResult(res, { code: 200, data });
  } catch (error) {
    sendJsonResult(res, {
      code: 200,
      data: error,
    });
  }
});

WebApp.handlers.get('/api/boards', async function(req, res) {
  try {
    Authentication.checkUserId(req.userId);
    const boards = await ReactiveCache.getBoards(
      { permission: 'public' },
      {
        sort: { sort: 1 },
      },
    );
    sendJsonResult(res, {
      code: 200,
      data: boards.map(doc => ({
        _id: doc._id,
        title: doc.title,
      })),
    });
  } catch (error) {
    sendJsonResult(res, {
      code: 200,
      data: error,
    });
  }
});

WebApp.handlers.get('/api/boards_count', async function(req, res) {
  try {
    Authentication.checkUserId(req.userId);
    const privateBoards = await ReactiveCache.getBoards({ permission: 'private' });
    const publicBoards = await ReactiveCache.getBoards({ permission: 'public' });
    sendJsonResult(res, {
      code: 200,
      data: {
        private: privateBoards.length,
        public: publicBoards.length,
      },
    });
  } catch (error) {
    sendJsonResult(res, {
      code: 200,
      data: error,
    });
  }
});

WebApp.handlers.get('/api/boards/:boardId', async function(req, res) {
  try {
    const paramBoardId = req.params.boardId;
    Authentication.checkBoardAccess(req.userId, paramBoardId);

    const board = await ReactiveCache.getBoard(paramBoardId);
    sendJsonResult(res, {
      code: 200,
      data: board,
    });
  } catch (error) {
    sendJsonResult(res, {
      code: 200,
      data: error,
    });
  }
});

WebApp.handlers.post('/api/boards', async function(req, res) {
  try {
    Authentication.checkLoggedIn(req.userId);
    const allowPrivateOnly =
      (await TableVisibilityModeSettings.findOneAsync('tableVisibilityMode-allowPrivateOnly'))?.booleanValue;
    const permission = allowPrivateOnly ? 'private' : (req.body.permission || 'private');
    const id = await Boards.insertAsync({
      title: req.body.title,
      members: [
        {
          userId: req.body.owner,
          isAdmin: req.body.isAdmin || true,
          isActive: req.body.isActive || true,
          isNoComments: req.body.isNoComments || false,
          isCommentOnly: req.body.isCommentOnly || false,
          isWorker: req.body.isWorker || false,
        },
      ],
      permission,
      color: req.body.color || 'belize',
      migrationVersion: 1,
    });
    const swimlaneId = await Swimlanes.insertAsync({
      title: getTranslatedString('default', 'Default'),
      boardId: id,
    });
    sendJsonResult(res, {
      code: 200,
      data: {
        _id: id,
        defaultSwimlaneId: swimlaneId,
      },
    });
  } catch (error) {
    sendJsonResult(res, {
      code: 200,
      data: error,
    });
  }
});

WebApp.handlers.delete('/api/boards/:boardId', async function(req, res) {
  try {
    Authentication.checkUserId(req.userId);
    const id = req.params.boardId;
    await Boards.removeAsync({ _id: id });
    sendJsonResult(res, {
      code: 200,
      data: {
        _id: id,
      },
    });
  } catch (error) {
    sendJsonResult(res, {
      code: 200,
      data: error,
    });
  }
});

WebApp.handlers.put('/api/boards/:boardId/title', async function(req, res) {
  try {
    const boardId = req.params.boardId;
    Authentication.checkBoardWriteAccess(req.userId, boardId);
    const title = req.body.title;

    await Boards.direct.updateAsync({ _id: boardId }, { $set: { title } });

    sendJsonResult(res, {
      code: 200,
      data: {
        _id: boardId,
        title,
      },
    });
  } catch (error) {
    sendJsonResult(res, {
      code: 200,
      data: error,
    });
  }
});

WebApp.handlers.put('/api/boards/:boardId/labels', async function(req, res) {
  const id = req.params.boardId;
  Authentication.checkBoardWriteAccess(req.userId, id);
  try {
    if (Object.prototype.hasOwnProperty.call(req.body, 'label')) {
      const board = await ReactiveCache.getBoard(id);
      const color = req.body.label.color;
      const name = req.body.label.name;
      const labelId = Random.id(6);
      if (!board.getLabel(name, color)) {
        await Boards.direct.updateAsync(
          { _id: id },
          { $push: { labels: { _id: labelId, name, color } } },
        );
        sendJsonResult(res, {
          code: 200,
          data: labelId,
        });
      } else {
        sendJsonResult(res, {
          code: 200,
        });
      }
    }
  } catch (error) {
    sendJsonResult(res, {
      data: error,
    });
  }
});

WebApp.handlers.post('/api/boards/:boardId/copy', async function(req, res) {
  const id = req.params.boardId;
  const board = await ReactiveCache.getBoard(id);
  const adminAccess = board.members.some(e => e.userId === req.userId && e.isAdmin);
  Authentication.checkAdminOrCondition(req.userId, adminAccess);
  try {
    board.title = req.body.title || await Boards.uniqueTitle(board.title);
    const ret = await board.copy();
    sendJsonResult(res, {
      code: 200,
      data: ret,
    });
  } catch (error) {
    sendJsonResult(res, {
      data: error,
    });
  }
});

WebApp.handlers.post('/api/boards/:boardId/members/:memberId', async function(req, res) {
  try {
    Authentication.checkUserId(req.userId);
    const boardId = req.params.boardId;
    const memberId = req.params.memberId;
    const {
      isAdmin,
      isNoComments,
      isCommentOnly,
      isWorker,
      isNormalAssignedOnly,
      isCommentAssignedOnly,
      isReadOnly,
      isReadAssignedOnly,
    } = req.body;
    const board = await ReactiveCache.getBoard(boardId);

    function isTrue(data) {
      try {
        return data.toLowerCase() === 'true';
      } catch (error) {
        return data;
      }
    }

    const query = await board.setMemberPermission(
      memberId,
      isTrue(isAdmin),
      isTrue(isNoComments),
      isTrue(isCommentOnly),
      isTrue(isWorker),
      isTrue(isNormalAssignedOnly),
      isTrue(isCommentAssignedOnly),
      isTrue(isReadOnly),
      isTrue(isReadAssignedOnly),
      req.userId,
    );

    sendJsonResult(res, {
      code: 200,
      data: query,
    });
  } catch (error) {
    sendJsonResult(res, {
      code: 200,
      data: error,
    });
  }
});

WebApp.handlers.get('/api/boards/:boardId/attachments', async function(req, res) {
  const paramBoardId = req.params.boardId;
  Authentication.checkBoardAccess(req.userId, paramBoardId);
  const attachments = await ReactiveCache.getAttachments(
    { 'meta.boardId': paramBoardId },
    {},
    true,
  );
  sendJsonResult(res, {
    code: 200,
    data: attachments.each().map(attachment => ({
      attachmentId: attachment._id,
      attachmentName: attachment.name,
      attachmentType: attachment.type,
      url: attachment.link(),
      urlDownload: `${attachment.link()}?download=true&token=`,
      boardId: attachment.meta.boardId,
      swimlaneId: attachment.meta.swimlaneId,
      listId: attachment.meta.listId,
      cardId: attachment.meta.cardId,
    })),
  });
});
