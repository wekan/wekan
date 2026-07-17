import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { DDP } from 'meteor/ddp';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { WekanCreator } from '/models/wekanCreator';
import { Authentication } from '/server/authentication';
import { sendJsonResult } from '/server/apiMiddleware';
import { allowIsBoardAdmin, boardMemberRoleToFlags } from '/server/lib/utils';
import { reconcileBoardTeamMembers } from '/models/lib/reconcileBoardTeamMembers';
import {
  isInvitedToBoard,
  planQuitBoard,
  planAcceptInvite,
} from '/models/lib/boardInvites';
import { buildBoardLabel } from '/models/lib/restLabel';
import { LABEL_COLORS } from '/models/metadata/colors';
import { filterUserBoards } from '/server/lib/boardListFilter';
import { ReactiveCache } from '/imports/reactiveCache';
import Actions from '/models/actions';
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
import { ensureIndex } from '/server/lib/mongoStartup';

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
    // #4266: also remove the board's rule Actions, which were previously left
    // orphaned when a board was deleted (Rules and Triggers were removed but
    // Actions were not).
    Actions,
  ]) {
    await element.removeAsync({ boardId: doc._id });
  }

  // #2339/#5850: when a Template Container board is deleted, clear it from the
  // profile of any user pointing at it so no save/insert-from-template path is
  // left referencing a dead board. ensureTemplatesBoard / the "Add Template
  // Container" button can then create a fresh one on demand.
  if (doc.type === 'template-container') {
    // Clear the pointers so no save/insert-from-template path references a dead
    // board. The schema marks these fields optional:true so this $unset does not
    // trip SimpleSchema's required check.
    await Users.updateAsync(
      { 'profile.templatesBoardId': doc._id },
      {
        $unset: {
          'profile.templatesBoardId': '',
          'profile.cardTemplatesSwimlaneId': '',
          'profile.listTemplatesSwimlaneId': '',
          'profile.boardTemplatesSwimlaneId': '',
        },
      },
      { multi: true },
    );
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
      // #2339/#5850: 'card' | 'list' | 'board' marks which template-container
      // swimlane this is, so the user's profile pointers can be wired below.
      check(swimlane.role, Match.Maybe(String));
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

    // #2339/#5850: when the user creates a Template Container board (via the
    // "Add Template Container" button on All Boards / Templates), register it
    // and its three swimlanes as the user's active templates board so that
    // adding Card/List/Swimlane/Board templates to it actually works -- the
    // swimlane.isCardTemplatesSwimlane()/... helpers compare against these
    // profile pointers. Without this the container would look right but stay
    // inert. We point the profile at this newly-created container (the most
    // recently created one becomes the active one).
    const templateRolePointers = {
      card: 'profile.cardTemplatesSwimlaneId',
      list: 'profile.listTemplatesSwimlaneId',
      board: 'profile.boardTemplatesSwimlaneId',
    };
    const isTemplateContainer = type === 'template-container';
    const profilePointerSet = {};
    if (isTemplateContainer) {
      profilePointerSet['profile.templatesBoardId'] = boardId;
    }

    for (const swimlane of swimlanes) {
      const swimlaneId = await Swimlanes.insertAsync({
        title: swimlane.title,
        boardId,
        sort: swimlane.sort,
        type: swimlane.type,
      });
      if (isTemplateContainer && templateRolePointers[swimlane.role]) {
        profilePointerSet[templateRolePointers[swimlane.role]] = swimlaneId;
      }
    }

    if (Object.keys(profilePointerSet).length) {
      await Users.updateAsync(this.userId, { $set: profilePointerSet });
    }

    return boardId;
  },

  async getBackgroundImageURL(boardId) {
    check(boardId, String);
    const board = await ReactiveCache.getBoard(boardId, {}, { backgroundImageUrl: 1 });
    // Only return the background for boards the caller is allowed to see.
    if (!board || !board.isVisibleBy({ _id: this.userId })) {
      throw new Meteor.Error('error-notAuthorized');
    }
    return board;
  },

  async quitBoard(boardId) {
    check(boardId, String);
    const board = await ReactiveCache.getBoard(boardId);
    if (!board) {
      throw new Meteor.Error('error-board-doesNotExist');
    }

    const userId = this.userId;
    const user = await ReactiveCache.getUser(userId);
    // #4730: quitting (or declining an invitation to) a board must also clear
    // the pending invitation, otherwise a follow-up acceptInvite call — the
    // decline flow on the All Boards page issues one — re-activates the
    // membership and the declined board stays in the personal overview. A user
    // holding only a stale invitation (no member entry, e.g. after an admin
    // removed them) may also quit: their invitation is cleared instead of
    // throwing error-board-notAMember, so the board can always be removed
    // from the personal overview.
    const plan = planQuitBoard({
      isMember: board.memberIndex(userId) >= 0,
      isInvited: isInvitedToBoard(user && user.profile, boardId),
    });
    if (!plan.ok) {
      throw new Meteor.Error(plan.error);
    }

    if (plan.pullInvite) {
      await Users.updateAsync(userId, {
        $pull: { 'profile.invitedBoards': boardId },
      });
    }
    if (plan.removeMember) {
      await board.removeMember(userId);
    }
    return true;
  },

  async acceptInvite(boardId) {
    check(boardId, String);
    const board = await ReactiveCache.getBoard(boardId);
    if (!board) {
      throw new Meteor.Error('error-board-doesNotExist');
    }

    // #4730: only a user actually holding an invitation to this board may
    // (re)activate their member entry. Previously this method set
    // members.$.isActive = true unconditionally, which (a) re-activated the
    // membership right after the decline flow's quitBoard call, so a declined
    // board stayed in the personal overview, and (b) let a member an admin had
    // removed re-add themselves by calling this method directly.
    const user = await ReactiveCache.getUser(this.userId);
    const plan = planAcceptInvite({
      isInvited: isInvitedToBoard(user && user.profile, boardId),
    });
    if (!plan.ok) {
      return false;
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
    return true;
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
    // Archiving a board hides it for everyone, so it is a board-admin action,
    // matching the client gating (boardArchive.js `isBoardAdmin`) and the
    // Boards.allow update/remove rules. Previously any member (incl. read-only)
    // could archive a board over DDP. Global admins are also allowed.
    const user = await ReactiveCache.getUser(userId);
    if (!board.hasAdmin(userId) && !(user && user.isAdmin)) {
      throw new Meteor.Error('error-board-notAdmin');
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

    // #5730: setBoardTeams used to blindly overwrite board.members with the
    // client-supplied `membersArray`. When the caller's board document was stale
    // (e.g. a user had just been added via inviteUserToBoard on the server and
    // that change had not yet propagated to the caller's client), the overwrite
    // silently dropped members — and in the worst case the board's own admin —
    // which made the whole board vanish from that user's board list. Because a
    // wholesale `$set: { members }` never goes through foreachRemovedMember(),
    // no removeBoardMember activity was logged and no card/watcher/star cleanup
    // ran, so "the logs look normal and nothing seems to be out of order".
    //
    // Reconcile against the AUTHORITATIVE server-side members instead of trusting
    // the client snapshot (see reconcileBoardTeamMembers for the full rationale):
    //  - never drop an active admin (this is what made the board disappear),
    //  - keep every existing member the client still lists,
    //  - add the members the client introduces (team-derived users),
    //  - only remove non-admin members the client explicitly omitted (an
    //    intentional team-leave), logging + cleaning up each such removal below
    //    so it is auditable rather than silent.
    const { members: resultMembers, removedMemberIds } =
      reconcileBoardTeamMembers(board.members, membersArray);

    await Boards.updateAsync(currBoardId, {
      $set: {
        members: resultMembers,
        teams: boardTeamsArray,
      },
    });

    // Run the same cleanup + audit trail that a normal member removal performs,
    // so team-leave removals are not silent (see comment above).
    for (const memberId of removedMemberIds) {
      await Cards.updateAsync(
        { boardId: currBoardId },
        { $pull: { members: memberId, watchers: memberId } },
        { multi: true },
      );
      await Lists.updateAsync(
        { boardId: currBoardId },
        { $pull: { watchers: memberId } },
        { multi: true },
      );
      if (!board.isPublic()) {
        await Users.updateAsync(memberId, {
          $pull: { 'profile.starredBoards': currBoardId },
        });
      }
      await Activities.insertAsync({
        userId,
        memberId,
        type: 'member',
        activityType: 'removeBoardMember',
        boardId: currBoardId,
      });
    }
  },

  async setBoardDomains(boardDomainsArray, currBoardId) {
    check(boardDomainsArray, Array);
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

    // #5850: domains are free-form, so normalise and validate each entry before
    // storing. Every domain must be a non-empty, trimmed, lowercased string that
    // looks like a domain (contains a '.' and no '@' or whitespace).
    const normalizedDomains = [];
    const seen = new Set();
    for (const entry of boardDomainsArray) {
      check(entry, Object);
      check(entry.domain, String);
      check(entry.isActive, Boolean);

      const domain = entry.domain.trim().toLowerCase();
      if (
        domain.length === 0 ||
        domain.indexOf('.') < 0 ||
        domain.indexOf('@') >= 0 ||
        /\s/.test(domain)
      ) {
        throw new Meteor.Error('invalid-domain', `Invalid domain: ${entry.domain}`);
      }
      if (seen.has(domain)) {
        continue;
      }
      seen.add(domain);
      normalizedDomains.push({ domain, isActive: entry.isActive });
    }

    await Boards.updateAsync(currBoardId, {
      $set: {
        domains: normalizedDomains,
      },
    });
  },

  // #5850: add a single email domain to a board, leaving any existing domains in
  // place. Mirrors the array-based setBoardDomains above and reuses it so the
  // same auth check and validation apply.
  async addBoardDomain(domain, currBoardId) {
    check(domain, String);
    check(currBoardId, String);

    const board = await ReactiveCache.getBoard(currBoardId);
    const domains = (board && board.domains) ? board.domains.slice() : [];
    const normalized = domain.trim().toLowerCase();
    if (!domains.some(d => d.domain === normalized)) {
      domains.push({ domain: normalized, isActive: true });
    }
    return Meteor.callAsync('setBoardDomains', domains, currBoardId);
  },

  // #5850: remove a single email domain from a board.
  async removeBoardDomain(domain, currBoardId) {
    check(domain, String);
    check(currBoardId, String);

    const board = await ReactiveCache.getBoard(currBoardId);
    const domains = (board && board.domains) ? board.domains : [];
    const normalized = domain.trim().toLowerCase();
    const filtered = domains.filter(d => d.domain !== normalized);
    return Meteor.callAsync('setBoardDomains', filtered, currBoardId);
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
  await ensureIndex(Boards, { modifiedAt: -1 });
  await ensureIndex(Boards, 
    {
      _id: 1,
      'members.userId': 1,
    },
    { unique: true },
  );
  await ensureIndex(Boards, { 'members.userId': 1 });
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
    await Authentication.checkAdminOrCondition(req.userId, req.userId === paramUserId);

    const boards = await ReactiveCache.getBoards(
      {
        archived: false,
        'members.userId': paramUserId,
      },
      {
        sort: { sort: 1 },
      },
    );
    // #5582: hide internal helper boards (caret-wrapped titles like `^Subtasks^`
    // and non-`board` types such as `list`/`template`) from the REST API, the
    // same way the UI board list does.
    const data = filterUserBoards(boards).map(board => ({
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
    await Authentication.checkUserId(req.userId);
    const boards = await ReactiveCache.getBoards(
      { permission: 'public' },
      {
        sort: { sort: 1 },
      },
    );
    sendJsonResult(res, {
      code: 200,
      // #5582: exclude internal helper boards (caret-wrapped titles / non-board
      // types) from the public boards listing.
      data: filterUserBoards(boards).map(doc => ({
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
    await Authentication.checkUserId(req.userId);
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
    await Authentication.checkBoardAccess(req.userId, paramBoardId);

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
          // #5650: fall back to the authenticated caller when `owner` is omitted.
          // Without a valid userId the board's only member has userId=undefined,
          // so the boards publication (members.$elemMatch:{userId,isActive:true})
          // never matches the user — the board is returned by the REST API but is
          // invisible in the browser UI. Mirrors the Meteor create method, which
          // uses this.userId.
          userId: req.body.owner || req.userId,
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
      code: error.statusCode || error.code || 500,
      data: { error: error.reason || error.message || 'Error' },
    });
  }
});

/**
 * @operation import_board
 * @tag Boards
 * @summary Import a whole board (with its lists, cards, swimlanes, custom fields
 * and automation rules) from a WeKan board export
 *
 * @description Accepts a WeKan board export JSON (the body returned by
 * `GET /api/boards/:boardId/export`) and recreates the board — including its
 * **rules / triggers / actions (workflows)** and other data — in the
 * authenticated user's account. Combined with the export endpoint, this allows
 * migrating all boards (and their workflows) from another WeKan instance over the
 * REST API: list the remote boards, export each, then POST each here. An optional
 * `membersMapping` ({ sourceUserId: localUserId }) maps members; unmapped members
 * are simply not added.
 *
 * @param {object} board the WeKan board export object
 * @param {object} [membersMapping] map of source user id -> local user id
 * @return_type {_id: string}
 */
WebApp.handlers.post('/api/boards/import', async function(req, res) {
  try {
    Authentication.checkLoggedIn(req.userId);
    const board = req.body && req.body.board;
    if (!board || typeof board !== 'object') {
      sendJsonResult(res, { code: 400, data: { error: 'Missing board export object' } });
      return;
    }
    const additionalData = {};
    if (req.body.membersMapping && typeof req.body.membersMapping === 'object') {
      additionalData.membersMapping = req.body.membersMapping;
    }
    // Run the import as the authenticated user so the new board is owned by them.
    const boardId = await DDP._CurrentMethodInvocation.withValue(
      { userId: req.userId },
      async () => {
        const creator = new WekanCreator(additionalData);
        return await creator.create(board, null);
      },
    );
    sendJsonResult(res, { code: 200, data: { _id: boardId } });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});

/**
 * @operation import_board_from
 * @tag Boards
 * @summary Import a board from another tool's export
 *
 * @description Generalized import: `:source` is one of `trello`, `wekan`, `csv`,
 * `jira`, `kanboard`, `excel`, `deck` (NextCloud Deck), `openproject`, `github`,
 * `gitlab`, `gitea`, `forgejo`, `asana`, `zenkit`. The request body is that
 * tool's export JSON (sent directly, or wrapped as `{ "board": <export> }`);
 * an optional `membersMapping` maps members. Reuses the same import engine as
 * the UI.
 *
 * @param {string} source the import source
 * @param {object} board the source export object (or send it as the body)
 * @param {object} [membersMapping] map of source user id -> local user id
 * @return_type {_id: string}
 */
WebApp.handlers.post('/api/boards/import/:source', async function(req, res) {
  try {
    Authentication.checkLoggedIn(req.userId);
    const source = req.params.source;
    const body = req.body || {};
    const board = body.board !== undefined ? body.board : body;
    const additionalData = {};
    if (body.membersMapping && typeof body.membersMapping === 'object') {
      additionalData.membersMapping = body.membersMapping;
    }
    const boardId = await DDP._CurrentMethodInvocation.withValue(
      { userId: req.userId },
      async () => Meteor.callAsync('importBoard', board, additionalData, source, null),
    );
    sendJsonResult(res, { code: 200, data: { _id: boardId } });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});

WebApp.handlers.delete('/api/boards/:boardId', async function(req, res) {
  try {
    const id = req.params.boardId;
    await Authentication.checkBoardAdmin(req.userId, id);
    await Boards.removeAsync({ _id: id });
    sendJsonResult(res, {
      code: 200,
      data: {
        _id: id,
      },
    });
  } catch (error) {
    sendJsonResult(res, {
      code: error.statusCode || error.code || 500,
      data: { error: error.reason || error.message || 'Error' },
    });
  }
});

WebApp.handlers.put('/api/boards/:boardId/title', async function(req, res) {
  try {
    const boardId = req.params.boardId;
    await Authentication.checkBoardWriteAccess(req.userId, boardId);
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
  // Issue #5819: creating/editing/deleting board labels is gated to BoardAdmin;
  // normal members can still apply existing labels to cards (see the bulk card
  // labels endpoint in server/models/cards.js). Site admins also pass. We return
  // a clean 401/403 (rather than letting an auth helper throw) so the request
  // never hangs and the denial is an explicit response.
  const board = await ReactiveCache.getBoard(id);
  if (!req.userId) {
    sendJsonResult(res, { code: 401, data: { error: 'Unauthorized' } });
    return;
  }
  if (!board) {
    sendJsonResult(res, { code: 404, data: { error: 'Board not found' } });
    return;
  }
  const isBoardAdmin = allowIsBoardAdmin(req.userId, board);
  const isSiteAdmin = isBoardAdmin
    ? true
    : !!(await ReactiveCache.getUser({ _id: req.userId, isAdmin: true }));
  if (!isBoardAdmin && !isSiteAdmin) {
    sendJsonResult(res, { code: 403, data: { error: 'Only a board admin can create or edit labels' } });
    return;
  }
  try {
    // Issue #5510: always return a JSON response. buildBoardLabel normalizes the
    // accepted request shapes and rejects bad input with a 4xx (rather than pushing
    // a schema-invalid label or, when `label` was absent, never responding at all so
    // the request hung until the client timed out).
    const built = buildBoardLabel((req.body || {}).label, LABEL_COLORS);
    if (!built.ok) {
      sendJsonResult(res, {
        code: built.status || 400,
        data: { error: built.error },
      });
      return;
    }
    const { name, color } = built;
    const existing = board.getLabel(name, color);
    if (existing) {
      sendJsonResult(res, {
        code: 200,
        data: existing._id,
      });
      return;
    }
    const labelId = Random.id(6);
    await Boards.direct.updateAsync(
      { _id: id },
      { $push: { labels: { _id: labelId, name, color } } },
    );
    sendJsonResult(res, {
      code: 200,
      data: labelId,
    });
  } catch (error) {
    sendJsonResult(res, {
      code: error.statusCode || error.code || 500,
      data: { error: error.reason || error.message || 'Error' },
    });
  }
});

// Issue #3062: read/update the board-level "Card Settings" (the allows* toggles
// shown under Board Settings that control which fields/badges appear on cards and
// minicards). Board-level only — per-user presentation settings are out of scope.
const BOARD_CARD_SETTING_KEYS = [
  'allowsCardCounterList',
  'cardAging',
  'allowsBoardMemberList',
  'allowsShowLists',
  'allowsAttachments',
  'allowsChecklists',
  'allowsComments',
  'allowsDescriptionTitle',
  'allowsDescriptionText',
  'allowsActivities',
  'allowsLabels',
  'allowsCreator',
  'allowsAssignee',
  'allowsMembers',
  'allowsRequestedBy',
  'allowsCardSortingByNumber',
  'allowsCardNumber',
  'allowsAssignedBy',
  'allowsReceivedDate',
  'allowsStartDate',
  'allowsEndDate',
  'allowsDueDate',
  'allowsSubtasks',
  'allowsCreatorOnMinicard',
  'allowsAttachmentsOnMinicard',
  'allowsChecklistsOnMinicard',
  'allowsChecklistAtMinicard',
  'allowsCoverAttachmentOnMinicard',
  'allowsBadgeAttachmentOnMinicard',
  'allowsCardSortingByNumberOnMinicard',
  'allowsCardNumberOnMinicard',
  'allowsDescriptionTitleOnMinicard',
  'allowsDescriptionTextOnMinicard',
  'allowsLabelsOnMinicard',
  'allowsAssigneeOnMinicard',
  'allowsMembersOnMinicard',
  'allowsRequestedByOnMinicard',
  'allowsAssignedByOnMinicard',
  'allowsReceivedDateOnMinicard',
  'allowsStartDateOnMinicard',
  'allowsEndDateOnMinicard',
  'allowsDueDateOnMinicard',
  'allowsSubtasksOnMinicard',
  'allowsShowListsOnMinicard',
];

// #3984: numeric card-settings keys (parsed as integers, not booleans). These are
// the board-configurable card-aging day thresholds for the three fade tiers.
const BOARD_CARD_NUMERIC_SETTING_KEYS = [
  'cardAgingDays1',
  'cardAgingDays2',
  'cardAgingDays3',
];

WebApp.handlers.get('/api/boards/:boardId/cardSettings', async function(req, res) {
  const id = req.params.boardId;
  await Authentication.checkBoardAccess(req.userId, id);
  const board = await ReactiveCache.getBoard(id);
  if (!board) {
    sendJsonResult(res, { code: 404, data: { error: 'Board not found' } });
    return;
  }
  const data = {};
  BOARD_CARD_SETTING_KEYS.forEach(key => {
    data[key] = board[key];
  });
  BOARD_CARD_NUMERIC_SETTING_KEYS.forEach(key => {
    data[key] = board[key];
  });
  sendJsonResult(res, { code: 200, data });
});

WebApp.handlers.put('/api/boards/:boardId/cardSettings', async function(req, res) {
  const id = req.params.boardId;
  await Authentication.checkBoardWriteAccess(req.userId, id);
  const board = await ReactiveCache.getBoard(id);
  if (!board) {
    sendJsonResult(res, { code: 404, data: { error: 'Board not found' } });
    return;
  }
  const $set = {};
  const toBool = value => value === true || String(value).toLowerCase() === 'true';
  BOARD_CARD_SETTING_KEYS.forEach(key => {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      $set[key] = toBool(req.body[key]);
    }
  });
  BOARD_CARD_NUMERIC_SETTING_KEYS.forEach(key => {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      const n = parseInt(req.body[key], 10);
      if (!Number.isNaN(n) && n >= 0) $set[key] = n;
    }
  });
  if (Object.keys($set).length === 0) {
    sendJsonResult(res, { code: 400, data: { error: 'no recognized card settings in body' } });
    return;
  }
  await Boards.direct.updateAsync({ _id: id }, { $set });
  const updated = await ReactiveCache.getBoard(id);
  const data = {};
  BOARD_CARD_SETTING_KEYS.forEach(key => {
    data[key] = updated[key];
  });
  BOARD_CARD_NUMERIC_SETTING_KEYS.forEach(key => {
    data[key] = updated[key];
  });
  sendJsonResult(res, { code: 200, data });
});

WebApp.handlers.post('/api/boards/:boardId/copy', async function(req, res) {
  try {
    const id = req.params.boardId;
    const board = await ReactiveCache.getBoard(id);
    const adminAccess = board.members.some(e => e.userId === req.userId && e.isAdmin);
    await Authentication.checkAdminOrCondition(req.userId, adminAccess);
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
    const boardId = req.params.boardId;
    const memberId = req.params.memberId;
    // Issue #5998: changing a board member's permission requires board admin (or
    // site admin). Awaited + explicit status: a denied caller gets a clean
    // 401/403 instead of an un-awaited rejection (which surfaced as HTTP 503).
    if (!req.userId) {
      sendJsonResult(res, { code: 401, data: { error: 'Unauthorized' } });
      return;
    }
    const authBoard = await ReactiveCache.getBoard(boardId);
    const isBoardAdmin = allowIsBoardAdmin(req.userId, authBoard);
    const isSiteAdmin = isBoardAdmin
      ? true
      : !!(await ReactiveCache.getUser({ _id: req.userId, isAdmin: true }));
    if (!isBoardAdmin && !isSiteAdmin) {
      sendJsonResult(res, { code: 403, data: { error: 'Only a board admin can change member permissions' } });
      return;
    }
    // Issue #5998: accept a single named `role` as an alternative to the eight
    // boolean flags. When `role` is present it wins.
    let roleFlags = null;
    if (Object.prototype.hasOwnProperty.call(req.body, 'role')) {
      roleFlags = boardMemberRoleToFlags(req.body.role);
      if (roleFlags === null) {
        sendJsonResult(res, { code: 400, data: { error: `invalid role: ${req.body.role}` } });
        return;
      }
    }
    const {
      isAdmin,
      isNoComments,
      isCommentOnly,
      isWorker,
      isNormalAssignedOnly,
      isCommentAssignedOnly,
      isReadOnly,
      isReadAssignedOnly,
    } = roleFlags === null ? req.body : roleFlags;
    const board = await ReactiveCache.getBoard(boardId);

    function isTrue(data) {
      // Tolerate both real booleans (from a named `role`) and 'true'/'false'
      // strings (from individual flag params).
      if (data === true || data === false) {
        return data;
      }
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

/**
 * @operation get_board_domains
 * @tag Boards
 * @summary Get the email domains a board is shared with
 *
 * @description #5850: returns the `domains` array of a board. Each entry is an
 * object `{ domain: "example.com", isActive: true }`. Anyone able to read the
 * board may list its domains. Requires the caller to be authenticated.
 *
 * @param {string} boardId the board ID
 * @return_type [{domain: string, isActive: boolean}]
 */
WebApp.handlers.get('/api/boards/:boardId/domains', async function(req, res) {
  try {
    await Authentication.checkUserId(req.userId);
    const boardId = req.params.boardId;
    const board = await ReactiveCache.getBoard(boardId);
    if (!board) {
      sendJsonResult(res, { code: 404, data: { error: 'Board not found' } });
      return;
    }
    sendJsonResult(res, { code: 200, data: board.domains || [] });
  } catch (error) {
    sendJsonResult(res, {
      code: 200,
      data: error,
    });
  }
});

/**
 * @operation add_board_domain
 * @tag Boards
 * @summary Share a board with an email domain
 *
 * @description #5850: add a single email domain to a board's `domains` array
 * with `isActive: true`, leaving any existing domains in place. The domain is
 * trimmed and lowercased and must look like a domain (contain a '.', no '@' and
 * no whitespace); it is added only if not already present. Requires the caller
 * to be a board admin (or site admin). Returns the updated domains array.
 *
 * @param {string} boardId the board ID
 * @param {string} domain the email domain to add, e.g. "example.com"
 * @return_type [{domain: string, isActive: boolean}]
 */
WebApp.handlers.post('/api/boards/:boardId/domains', async function(req, res) {
  try {
    if (!req.userId) {
      sendJsonResult(res, { code: 401, data: { error: 'Unauthorized' } });
      return;
    }
    const boardId = req.params.boardId;
    const authBoard = await ReactiveCache.getBoard(boardId);
    if (!authBoard) {
      sendJsonResult(res, { code: 404, data: { error: 'Board not found' } });
      return;
    }
    const isBoardAdmin = allowIsBoardAdmin(req.userId, authBoard);
    const isSiteAdmin = isBoardAdmin
      ? true
      : !!(await ReactiveCache.getUser({ _id: req.userId, isAdmin: true }));
    if (!isBoardAdmin && !isSiteAdmin) {
      sendJsonResult(res, { code: 403, data: { error: 'Only a board admin can change board domains' } });
      return;
    }
    // #5850: normalise and validate the same way as setBoardDomains so the
    // stored value is consistent however a domain is added.
    const rawDomain = req.body && req.body.domain;
    if (typeof rawDomain !== 'string') {
      sendJsonResult(res, { code: 400, data: { error: 'Missing domain' } });
      return;
    }
    const domain = rawDomain.trim().toLowerCase();
    if (
      domain.length === 0 ||
      domain.indexOf('.') < 0 ||
      domain.indexOf('@') >= 0 ||
      /\s/.test(domain)
    ) {
      sendJsonResult(res, { code: 400, data: { error: `Invalid domain: ${rawDomain}` } });
      return;
    }
    const domains = (authBoard.domains || []).slice();
    if (!domains.some(d => d.domain === domain)) {
      domains.push({ domain, isActive: true });
    }
    // Reuse the existing setBoardDomains method (same auth + validation).
    await Meteor.callAsync('setBoardDomains', domains, boardId);
    const updated = await ReactiveCache.getBoard(boardId);
    sendJsonResult(res, { code: 200, data: updated.domains || [] });
  } catch (error) {
    sendJsonResult(res, {
      code: 200,
      data: error,
    });
  }
});

/**
 * @operation delete_board_domain
 * @tag Boards
 * @summary Stop sharing a board with an email domain
 *
 * @description #5850: remove a single email domain from a board's `domains`
 * array. The domain in the path is trimmed and lowercased before matching.
 * Requires the caller to be a board admin (or site admin). Returns the updated
 * domains array.
 *
 * @param {string} boardId the board ID
 * @param {string} domain the email domain to remove, e.g. "example.com"
 * @return_type [{domain: string, isActive: boolean}]
 */
WebApp.handlers.delete('/api/boards/:boardId/domains/:domain', async function(req, res) {
  try {
    if (!req.userId) {
      sendJsonResult(res, { code: 401, data: { error: 'Unauthorized' } });
      return;
    }
    const boardId = req.params.boardId;
    const authBoard = await ReactiveCache.getBoard(boardId);
    if (!authBoard) {
      sendJsonResult(res, { code: 404, data: { error: 'Board not found' } });
      return;
    }
    const isBoardAdmin = allowIsBoardAdmin(req.userId, authBoard);
    const isSiteAdmin = isBoardAdmin
      ? true
      : !!(await ReactiveCache.getUser({ _id: req.userId, isAdmin: true }));
    if (!isBoardAdmin && !isSiteAdmin) {
      sendJsonResult(res, { code: 403, data: { error: 'Only a board admin can change board domains' } });
      return;
    }
    const normalized = String(req.params.domain || '').trim().toLowerCase();
    const filtered = (authBoard.domains || []).filter(d => d.domain !== normalized);
    // Reuse the existing setBoardDomains method (same auth + validation).
    await Meteor.callAsync('setBoardDomains', filtered, boardId);
    const updated = await ReactiveCache.getBoard(boardId);
    sendJsonResult(res, { code: 200, data: updated.domains || [] });
  } catch (error) {
    sendJsonResult(res, {
      code: 200,
      data: error,
    });
  }
});

WebApp.handlers.get('/api/boards/:boardId/attachments', async function(req, res) {
  const paramBoardId = req.params.boardId;
  await Authentication.checkBoardAccess(req.userId, paramBoardId);
  const attachments = await ReactiveCache.getAttachments(
    { 'meta.boardId': paramBoardId },
  );
  sendJsonResult(res, {
    code: 200,
    data: attachments.map(attachment => ({
      attachmentId: attachment._id,
      attachmentName: attachment.name,
      attachmentType: attachment.type,
      url: (() => {
        const attachmentUrl = attachment && typeof attachment.link === 'function' ? attachment.link() : '';
        return attachmentUrl;
      })(),
      urlDownload: (() => {
        const attachmentUrl = attachment && typeof attachment.link === 'function' ? attachment.link() : '';
        return attachmentUrl ? `${attachmentUrl}?download=true&token=` : '';
      })(),
      boardId: attachment.meta.boardId,
      swimlaneId: attachment.meta.swimlaneId,
      listId: attachment.meta.listId,
      cardId: attachment.meta.cardId,
    })),
  });
});
