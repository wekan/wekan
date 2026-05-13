'use strict';

const crypto = require('crypto');
const { execFileSync } = require('child_process');

const MONGO_URL = process.env.WEKAN_MONGO_URL || 'mongodb://127.0.0.1:3001/meteor';

function mongoEval(script) {
  return execFileSync('mongosh', ['--quiet', MONGO_URL, '--eval', script], {
    encoding: 'utf8',
  }).trim();
}

function literal(value) {
  return JSON.stringify(value);
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

  mongoEval(`
    const now = new Date();
    db.users.deleteOne({ _id: ${literal(id)} });
    db.users.insertOne({
      _id: ${literal(id)},
      createdAt: now,
      username: ${literal(username)},
      emails: [{ address: ${literal(email)}, verified: true }],
      isAdmin: ${isAdmin},
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
        resume: { loginTokens: [{ when: now, hashedToken: ${literal(hashed)} }] },
      },
    });
  `);

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

  const listsJson = listIds.map((lid, i) => ({
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
      });
    });
  });

  mongoEval(`
    const now = new Date();
    db.boards.deleteOne({ _id: ${literal(boardId)} });
    db.swimlanes.deleteMany({ boardId: ${literal(boardId)} });
    db.lists.deleteMany({ boardId: ${literal(boardId)} });
    db.cards.deleteMany({ boardId: ${literal(boardId)} });

    db.boards.insertOne({
      _id: ${literal(boardId)},
      title: ${literal(title || `E2E Board ${boardId}`)},
      permission: 'private',
      migrationVersion: 1,
      slug: ${literal(slug)},
      archived: false,
      createdAt: now, modifiedAt: now,
      stars: 0,
      members: [{
        userId: ${literal(ownerId)},
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
    });

    db.swimlanes.insertOne({
      _id: ${literal(swimlaneId)},
      title: 'Default', boardId: ${literal(boardId)},
      archived: false, createdAt: now, updatedAt: now, modifiedAt: now,
      type: 'swimlane', height: -1, sort: 0,
    });

    db.lists.insertMany(${JSON.stringify(listsJson)}.map(l => Object.assign(l, { createdAt: now, updatedAt: now, modifiedAt: now })));

    ${cardDocs.length ? `db.cards.insertMany(${JSON.stringify(cardDocs)}.map(c => Object.assign(c, { createdAt: now, modifiedAt: now, dateLastActivity: now })));` : ''}
  `);

  return { boardId, slug, swimlaneId, listIds };
}

/** Add a second user as a member of an existing board. */
function addBoardMember({ boardId, userId, isAdmin = false }) {
  mongoEval(`
    db.boards.updateOne(
      { _id: ${literal(boardId)} },
      { $push: { members: {
        userId: ${literal(userId)},
        isAdmin: ${isAdmin}, isActive: true, isNoComments: false,
        isCommentOnly: false, isWorker: false, isReadOnly: false, isReadAssignedOnly: false,
      } } }
    );
  `);
}

/** Delete all data for the given board and user IDs. */
function cleanup({ boardIds = [], userIds = [] } = {}) {
  for (const boardId of boardIds) {
    mongoEval(`
      db.cards.deleteMany({ boardId: ${literal(boardId)} });
      db.lists.deleteMany({ boardId: ${literal(boardId)} });
      db.swimlanes.deleteMany({ boardId: ${literal(boardId)} });
      db.boards.deleteOne({ _id: ${literal(boardId)} });
      db.activities.deleteMany({ boardId: ${literal(boardId)} });
    `);
  }
  for (const userId of userIds) {
    mongoEval(`db.users.deleteOne({ _id: ${literal(userId)} });`);
  }
}

/** Look up a card document directly from MongoDB. */
function getCard(cardId) {
  const raw = mongoEval(`JSON.stringify(db.cards.findOne({ _id: ${literal(cardId)} }))`);
  try { return JSON.parse(raw); } catch { return null; }
}

/** Look up a board document directly from MongoDB. */
function getBoard(boardId) {
  const raw = mongoEval(`JSON.stringify(db.boards.findOne({ _id: ${literal(boardId)} }))`);
  try { return JSON.parse(raw); } catch { return null; }
}

module.exports = { seedUser, seedBoard, addBoardMember, cleanup, getCard, getBoard, mongoEval, literal };
