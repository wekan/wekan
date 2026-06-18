'use strict';

const crypto = require('crypto');
const { execFileSync } = require('child_process');
const path = require('path');
const { EJSON } = require('bson');

const MONGO_URL = process.env.WEKAN_MONGO_URL || 'mongodb://127.0.0.1:3001/meteor';
const RUNNER = path.join(__dirname, 'mongo-runner.js');

// Run a list of structured MongoDB ops synchronously via the driver-based
// subprocess runner (helpers/mongo-runner.js), returning the LAST op's result.
// This replaces the old `mongosh --eval <shell script>` approach; the public
// helper API stays synchronous so call sites need no `await`.
function runOps(ops) {
  const out = execFileSync(process.execPath, [RUNNER], {
    // EJSON preserves Date / BSON types in the ops across the subprocess
    // boundary; the runner writes them as real BSON Dates.
    input: EJSON.stringify({ url: MONGO_URL, ops }),
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  }).trim();
  // Results come back as plain JSON (Dates as ISO strings), matching the prior
  // `mongosh --eval JSON.stringify(...)` round-trip the specs were written for.
  return out ? JSON.parse(out) : null;
}

// --- Generic collection helpers (used by specs for ad-hoc reads/writes) -------
function findOne(collection, filter, projection) {
  return runOps([{ collection, method: 'findOne', filter, projection }]);
}
function find(collection, filter, projection) {
  return runOps([{ collection, method: 'find', filter, projection }]) || [];
}
function insertOne(collection, doc) {
  return runOps([{ collection, method: 'insertOne', doc }]);
}
function insertMany(collection, docs) {
  return runOps([{ collection, method: 'insertMany', docs }]);
}
function updateOne(collection, filter, update) {
  return runOps([{ collection, method: 'updateOne', filter, update }]);
}
function updateMany(collection, filter, update) {
  return runOps([{ collection, method: 'updateMany', filter, update }]);
}
function deleteOne(collection, filter) {
  return runOps([{ collection, method: 'deleteOne', filter }]);
}
function deleteMany(collection, filter) {
  return runOps([{ collection, method: 'deleteMany', filter }]);
}
function countDocuments(collection, filter) {
  return runOps([{ collection, method: 'countDocuments', filter }]);
}
function collectionNames() {
  return runOps([{ method: 'collectionNames' }]) || [];
}

function uid(prefix = 'e2e') {
  return `${prefix}${crypto.randomBytes(6).toString('hex')}`;
}

function createResumeToken() {
  const raw = crypto.randomBytes(24).toString('base64url');
  const hashed = crypto.createHash('sha256').update(raw).digest('base64');
  return { raw, hashed };
}

/**
 * Seed a test user directly in MongoDB and return a raw resume token for
 * token-based login (bypasses password auth so tests don't need real creds).
 */
function seedUser(overrides = {}) {
  const id = uid('user');
  const username = `e2e_${id}`;
  const email = `${username}@wekan-test.invalid`;
  const { raw, hashed } = createResumeToken();
  const isAdmin = overrides.isAdmin || false;
  const now = new Date();

  runOps([
    { collection: 'users', method: 'deleteOne', filter: { _id: id } },
    {
      collection: 'users',
      method: 'insertOne',
      doc: {
        _id: id,
        createdAt: now,
        username,
        emails: [{ address: email, verified: true }],
        isAdmin,
        authenticationMethod: 'password',
        profile: {
          boardView: 'board-view-swimlanes',
          fullname: 'E2E Test User',
          listWidths: {}, listConstraints: {}, autoWidthBoards: {},
          swimlaneHeights: {}, collapsedLists: {}, collapsedSwimlanes: {},
          keyboardShortcuts: false, verticalScrollbars: true,
          showWeekOfYear: true, dateFormat: 'YYYY-MM-DD',
          zoomLevel: 1, mobileMode: false, cardZoom: 1, starredBoards: [],
        },
        services: {
          resume: { loginTokens: [{ when: now, hashedToken: hashed }] },
        },
      },
    },
  ]);

  return { id, username, email, token: raw };
}

/**
 * Seed a minimal board with one swimlane, N lists, and optional seeded cards.
 * Returns IDs for use in tests.
 */
function seedBoard({ ownerId, title, listCount = 3, cardTitlesPerList = [] } = {}) {
  const boardId = uid('board');
  const slug = `e2e-board-${boardId}`;
  const swimlaneId = uid('swim');
  const listIds = Array.from({ length: listCount }, () => uid('list'));
  const now = new Date();

  const lists = listIds.map((lid, i) => ({
    _id: lid,
    title: `List ${String.fromCharCode(65 + i)}`,
    boardId,
    sort: i + 1,
    type: 'list',
    swimlaneId,
    starred: false,
    archived: false,
    wipLimit: { value: 1, enabled: false, soft: false },
    width: 272,
    createdAt: now, updatedAt: now, modifiedAt: now,
  }));

  const cardDocs = [];
  cardTitlesPerList.forEach((titles, listIdx) => {
    titles.forEach((cardTitle, cardIdx) => {
      cardDocs.push({
        _id: uid('card'),
        title: cardTitle,
        members: [],
        labelIds: [],
        customFields: [],
        listId: listIds[listIdx],
        boardId,
        swimlaneId,
        type: 'cardType-card',
        cardNumber: listIdx * 100 + cardIdx + 1,
        archived: false,
        parentId: '',
        coverId: '',
        description: '',
        requestedBy: '',
        assignedBy: '',
        assignees: [],
        spentTime: 0,
        isOvertime: false,
        userId: ownerId,
        sort: (cardIdx + 1) * 100,
        subtaskSort: -1,
        linkedId: '',
        vote: { question: '', positive: [], negative: [], end: null, public: false, allowNonBoardMembers: false },
        targetId_gantt: [], linkType_gantt: [], linkId_gantt: [],
        showActivities: false, showListOnMinicard: false, showChecklistAtMinicard: false,
        createdAt: now, modifiedAt: now, dateLastActivity: now,
      });
    });
  });

  runOps([
    { collection: 'boards', method: 'deleteOne', filter: { _id: boardId } },
    { collection: 'swimlanes', method: 'deleteMany', filter: { boardId } },
    { collection: 'lists', method: 'deleteMany', filter: { boardId } },
    { collection: 'cards', method: 'deleteMany', filter: { boardId } },
    {
      collection: 'boards',
      method: 'insertOne',
      doc: {
        _id: boardId,
        title: title || `E2E Board ${boardId}`,
        permission: 'private',
        migrationVersion: 1,
        slug,
        archived: false,
        createdAt: now, modifiedAt: now,
        stars: 0,
        members: [{
          userId: ownerId,
          isAdmin: true, isActive: true, isNoComments: false,
          isCommentOnly: false, isWorker: false, isReadOnly: false,
          isReadAssignedOnly: false,
        }],
        color: 'belize',
        allowsCardCounterList: false, allowsBoardMemberList: false,
        subtasksDefaultBoardId: null, subtasksDefaultListId: null,
        dateSettingsDefaultBoardId: null, dateSettingsDefaultListId: null,
        allowsSubtasks: true, allowsAttachments: true, allowsChecklists: true,
        allowsComments: true, allowsDescriptionTitle: true,
        allowsDescriptionText: true, allowsDescriptionTextOnMinicard: false,
        allowsCoverAttachmentOnMinicard: true, allowsBadgeAttachmentOnMinicard: false,
        allowsCardSortingByNumberOnMinicard: false, allowsCardNumber: false,
        allowsActivities: true, allowsLabels: true, allowsCreator: true,
        allowsCreatorOnMinicard: false, allowsAssignee: true,
        allowsMembers: true, allowsRequestedBy: true,
        allowsCardSortingByNumber: true, allowsShowLists: true,
        allowsAssignedBy: true, allowsShowListsOnMinicard: false,
        allowsChecklistAtMinicard: false, allowsReceivedDate: true,
        allowsStartDate: true, allowsEndDate: true, allowsDueDate: true,
        presentParentTask: 'no-parent', isOvertime: false,
        type: 'board', sort: -1, showActivities: false,
      },
    },
    {
      collection: 'swimlanes',
      method: 'insertOne',
      doc: {
        _id: swimlaneId,
        title: 'Default', boardId,
        archived: false, createdAt: now, updatedAt: now, modifiedAt: now,
        type: 'swimlane', height: -1, sort: 0,
      },
    },
    { collection: 'lists', method: 'insertMany', docs: lists },
    { collection: 'cards', method: 'insertMany', docs: cardDocs },
  ]);

  return { boardId, slug, swimlaneId, listIds };
}

/**
 * Set a seeded user's orgs / teams / email address so they can be grouped in
 * the Admin Panel "Shared templates" tab. Each org is { orgId, orgDisplayName },
 * each team is { teamId, teamDisplayName }. If `email` is given it replaces the
 * user's first email address (the domain is the part after '@').
 */
function setUserGroups({ userId, orgs = [], teams = [], email } = {}) {
  const ops = [
    { collection: 'users', method: 'updateOne', filter: { _id: userId }, update: { $set: { orgs, teams } } },
  ];
  if (email) {
    ops.push({
      collection: 'users', method: 'updateOne', filter: { _id: userId },
      update: { $set: { 'emails.0.address': email, 'emails.0.verified': true } },
    });
  }
  runOps(ops);
}

/**
 * Seed a user's Templates container board (type 'template-container') with a
 * "Board Templates" swimlane, and optionally one or more shared template boards.
 *
 * Mirrors how the app stores template boards (see server/models/users.js
 * Users.after.insert and client/components/lists/listBody.js):
 *   - The container board (type 'template-container') id is stored on the user
 *     at profile.templatesBoardId.
 *   - The "Board Templates" swimlane id is stored at
 *     profile.boardTemplatesSwimlaneId.
 *   - Each shared template board is a card (type 'cardType-linkedBoard') in that
 *     swimlane whose linkedId points at an actual board (type 'template-board').
 *
 * `templateTitles` is an array of strings (one per shared template board).
 * Pass [] to create an EMPTY Templates board (no shared templates).
 * Returns the ids created.
 */
function seedTemplatesBoard({ ownerId, templateTitles = [] } = {}) {
  const containerId = uid('tmplcontainer');
  const swimlaneId = uid('tmplswim');
  const listId = uid('tmpllist');
  const now = new Date();

  const templateBoards = templateTitles.map(title => ({
    cardId: uid('tmplcard'),
    linkedBoardId: uid('tmplboard'),
    title,
    slug: `e2e-tmpl-${uid('s')}`,
  }));

  const member = {
    isAdmin: true, isActive: true, isNoComments: false,
    isCommentOnly: false, isWorker: false, isReadOnly: false,
    isReadAssignedOnly: false,
  };

  const ops = [
    { collection: 'boards', method: 'deleteOne', filter: { _id: containerId } },
    { collection: 'swimlanes', method: 'deleteMany', filter: { boardId: containerId } },
    { collection: 'lists', method: 'deleteMany', filter: { boardId: containerId } },
    { collection: 'cards', method: 'deleteMany', filter: { boardId: containerId } },
    {
      collection: 'boards', method: 'insertOne',
      doc: {
        _id: containerId,
        title: 'Templates',
        permission: 'private',
        type: 'template-container',
        slug: `templates-${containerId}`,
        archived: false,
        createdAt: now, modifiedAt: now,
        stars: 0,
        members: [{ userId: ownerId, ...member }],
        color: 'belize', sort: -1,
      },
    },
    {
      collection: 'swimlanes', method: 'insertOne',
      doc: {
        _id: swimlaneId,
        title: 'Board Templates', boardId: containerId,
        type: 'template-container',
        archived: false, createdAt: now, updatedAt: now, modifiedAt: now,
        height: -1, sort: 3,
      },
    },
    {
      collection: 'lists', method: 'insertOne',
      doc: {
        _id: listId,
        title: 'Templates', boardId: containerId,
        type: 'list', swimlaneId,
        archived: false, sort: 1, createdAt: now, updatedAt: now, modifiedAt: now,
        starred: false, width: 272, wipLimit: { value: 1, enabled: false, soft: false },
      },
    },
    {
      collection: 'users', method: 'updateOne', filter: { _id: ownerId },
      update: { $set: {
        'profile.templatesBoardId': containerId,
        'profile.boardTemplatesSwimlaneId': swimlaneId,
      } },
    },
  ];

  if (templateBoards.length > 0) {
    ops.push({
      collection: 'boards', method: 'insertMany',
      docs: templateBoards.map((t, i) => ({
        _id: t.linkedBoardId,
        title: t.title,
        permission: 'private',
        type: 'template-board',
        slug: t.slug,
        archived: false,
        createdAt: now, modifiedAt: now, stars: 0,
        members: [{ userId: ownerId, ...member }],
        color: 'belize', sort: i,
      })),
    });
    ops.push({
      collection: 'cards', method: 'insertMany',
      docs: templateBoards.map((t, i) => ({
        _id: t.cardId,
        title: t.title,
        type: 'cardType-linkedBoard',
        linkedId: t.linkedBoardId,
        boardId: containerId,
        swimlaneId,
        listId,
        members: [], assignees: [], labelIds: [], customFields: [],
        cardNumber: i + 1, archived: false, parentId: '', coverId: '',
        description: '', sort: i, subtaskSort: -1,
        userId: ownerId,
        createdAt: now, modifiedAt: now, dateLastActivity: now,
      })),
    });
  }

  runOps(ops);

  return { containerId, swimlaneId, listId, templateBoards };
}

/** Return the _id of the first non-archived card on a board with the given title. */
function findCardIdByTitle({ boardId, title } = {}) {
  const c = findOne('cards', { boardId, title, archived: false }, { _id: 1 });
  return (c && c._id) || null;
}

/**
 * Set a card's cardDependencies (#3392 "Red Strings"). `dependsOn` is an array
 * of either target card ids (strings) or { cardId, type, color, icon } objects;
 * strings are expanded to objects with default type/color/icon.
 */
function setCardDependencies({ cardId, dependsOn = [] } = {}) {
  const deps = dependsOn.map(dep =>
    typeof dep === 'string'
      ? { cardId: dep, type: 'related-to', color: '#eb144c', icon: 'link' }
      : {
          cardId: dep.cardId,
          type: dep.type || 'related-to',
          color: dep.color || '#eb144c',
          icon: dep.icon || 'link',
        },
  );
  updateOne('cards', { _id: cardId }, { $set: { cardDependencies: deps } });
}

/** Toggle a board's showDependencies (#3392 "Red Strings" overlay) flag. */
function setBoardShowDependencies({ boardId, value = true } = {}) {
  updateOne('boards', { _id: boardId }, { $set: { showDependencies: !!value } });
}

/** Add a second user as a member of an existing board. */
function addBoardMember({ boardId, userId, isAdmin = false }) {
  updateOne('boards', { _id: boardId }, { $push: { members: {
    userId,
    isAdmin, isActive: true, isNoComments: false,
    isCommentOnly: false, isWorker: false, isReadOnly: false, isReadAssignedOnly: false,
  } } });
}

/** Delete all data for the given board and user IDs. */
function cleanup({ boardIds = [], userIds = [] } = {}) {
  for (const boardId of boardIds) {
    runOps([
      { collection: 'cards', method: 'deleteMany', filter: { boardId } },
      { collection: 'lists', method: 'deleteMany', filter: { boardId } },
      { collection: 'swimlanes', method: 'deleteMany', filter: { boardId } },
      { collection: 'boards', method: 'deleteOne', filter: { _id: boardId } },
      { collection: 'activities', method: 'deleteMany', filter: { boardId } },
    ]);
  }
  for (const userId of userIds) {
    // Also remove any Templates container board (and its template boards/cards)
    // that may have been seeded for this user via seedTemplatesBoard.
    const u = findOne('users', { _id: userId }, { 'profile.templatesBoardId': 1 });
    const tb = u && u.profile && u.profile.templatesBoardId;
    if (tb) {
      const linked = find('cards', { boardId: tb, type: 'cardType-linkedBoard' }, { linkedId: 1 });
      const linkedIds = linked.map(c => c.linkedId).filter(Boolean);
      const ops = [];
      if (linkedIds.length) ops.push({ collection: 'boards', method: 'deleteMany', filter: { _id: { $in: linkedIds } } });
      ops.push({ collection: 'cards', method: 'deleteMany', filter: { boardId: tb } });
      ops.push({ collection: 'lists', method: 'deleteMany', filter: { boardId: tb } });
      ops.push({ collection: 'swimlanes', method: 'deleteMany', filter: { boardId: tb } });
      ops.push({ collection: 'boards', method: 'deleteOne', filter: { _id: tb } });
      runOps(ops);
    }
    deleteOne('users', { _id: userId });
  }
}

/** Look up a card document directly from MongoDB. */
function getCard(cardId) {
  return findOne('cards', { _id: cardId });
}

/** Look up a board document directly from MongoDB. */
function getBoard(boardId) {
  return findOne('boards', { _id: boardId });
}

module.exports = {
  seedUser, seedBoard, addBoardMember, setUserGroups, seedTemplatesBoard,
  findCardIdByTitle, setCardDependencies, setBoardShowDependencies, cleanup,
  getCard, getBoard, uid,
  // generic collection helpers (replace ad-hoc mongosh `mongoEval` scripts)
  find, findOne, insertOne, insertMany, updateOne, updateMany, deleteOne,
  deleteMany, countDocuments, collectionNames, runOps,
};
