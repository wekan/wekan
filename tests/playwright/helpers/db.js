'use strict';

const crypto = require('crypto');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MONGO_URL = process.env.WEKAN_MONGO_URL || 'mongodb://127.0.0.1:3001/meteor';

function mongoEval(script) {
  const repoRoot = path.resolve(__dirname, '../../..');
  const toolsDir = path.join(repoRoot, '.tools');
  const playwrightBinDir = path.resolve(__dirname, '../node_modules/.bin');

  const extraPaths = [
    playwrightBinDir,
    '/opt/homebrew/bin',
    '/usr/local/bin',
    toolsDir,
  ];

  // Flatpak sandbox uses repo-local toolchain, including mongosh under .tools.
  if (fs.existsSync(toolsDir)) {
    const toolsEntries = fs.readdirSync(toolsDir, { withFileTypes: true });
    toolsEntries
      .filter(entry => entry.isDirectory() && /^mongosh-/.test(entry.name))
      .forEach(entry => {
        extraPaths.push(path.join(toolsDir, entry.name, 'bin'));
      });
  }

  const PATH = [...extraPaths, process.env.PATH || ''].join(':');
  return execFileSync('mongosh', ['--quiet', MONGO_URL, '--eval', script], {
    encoding: 'utf8',
    env: { ...process.env, PATH },
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

    const _seedLists = ${JSON.stringify(listsJson)}.map(l => Object.assign(l, { createdAt: now, updatedAt: now, modifiedAt: now }));
    if (_seedLists.length > 0) {
      db.lists.insertMany(_seedLists);
    }

    ${cardDocs.length ? `db.cards.insertMany(${JSON.stringify(cardDocs)}.map(c => Object.assign(c, { createdAt: now, modifiedAt: now, dateLastActivity: now })));` : ''}
  `);

  return { boardId, slug, swimlaneId, listIds };
}

/**
 * Set a seeded user's orgs / teams / email address so they can be grouped in
 * the Admin Panel "Shared templates" tab. Each org is { orgId, orgDisplayName },
 * each team is { teamId, teamDisplayName }. If `email` is given it replaces the
 * user's first email address (the domain is the part after '@').
 */
function setUserGroups({ userId, orgs = [], teams = [], email } = {}) {
  mongoEval(`
    db.users.updateOne(
      { _id: ${literal(userId)} },
      { $set: { orgs: ${JSON.stringify(orgs)}, teams: ${JSON.stringify(teams)} } }
    );
    ${email ? `db.users.updateOne({ _id: ${literal(userId)} }, { $set: { 'emails.0.address': ${literal(email)}, 'emails.0.verified': true } });` : ''}
  `);
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

  const templateBoards = templateTitles.map(title => ({
    cardId: uid('tmplcard'),
    linkedBoardId: uid('tmplboard'),
    title,
    slug: `e2e-tmpl-${uid('s')}`,
  }));

  mongoEval(`
    const now = new Date();
    db.boards.deleteOne({ _id: ${literal(containerId)} });
    db.swimlanes.deleteMany({ boardId: ${literal(containerId)} });
    db.lists.deleteMany({ boardId: ${literal(containerId)} });
    db.cards.deleteMany({ boardId: ${literal(containerId)} });

    db.boards.insertOne({
      _id: ${literal(containerId)},
      title: 'Templates',
      permission: 'private',
      type: 'template-container',
      slug: ${literal(`templates-${containerId}`)},
      archived: false,
      createdAt: now, modifiedAt: now,
      stars: 0,
      members: [{
        userId: ${literal(ownerId)},
        isAdmin: true, isActive: true, isNoComments: false,
        isCommentOnly: false, isWorker: false, isReadOnly: false,
        isReadAssignedOnly: false,
      }],
      color: 'belize', sort: -1,
    });

    db.swimlanes.insertOne({
      _id: ${literal(swimlaneId)},
      title: 'Board Templates', boardId: ${literal(containerId)},
      type: 'template-container',
      archived: false, createdAt: now, updatedAt: now, modifiedAt: now,
      height: -1, sort: 3,
    });

    db.lists.insertOne({
      _id: ${literal(listId)},
      title: 'Templates', boardId: ${literal(containerId)},
      type: 'list', swimlaneId: ${literal(swimlaneId)},
      archived: false, sort: 1, createdAt: now, updatedAt: now, modifiedAt: now,
      starred: false, width: 272, wipLimit: { value: 1, enabled: false, soft: false },
    });

    db.users.updateOne(
      { _id: ${literal(ownerId)} },
      { $set: {
        'profile.templatesBoardId': ${literal(containerId)},
        'profile.boardTemplatesSwimlaneId': ${literal(swimlaneId)},
      } }
    );

    const _tmplBoards = ${JSON.stringify(templateBoards)};
    if (_tmplBoards.length > 0) {
      db.boards.insertMany(_tmplBoards.map((t, i) => ({
        _id: t.linkedBoardId,
        title: t.title,
        permission: 'private',
        type: 'template-board',
        slug: t.slug,
        archived: false,
        createdAt: now, modifiedAt: now, stars: 0,
        members: [{
          userId: ${literal(ownerId)},
          isAdmin: true, isActive: true, isNoComments: false,
          isCommentOnly: false, isWorker: false, isReadOnly: false,
          isReadAssignedOnly: false,
        }],
        color: 'belize', sort: i,
      })));

      db.cards.insertMany(_tmplBoards.map((t, i) => ({
        _id: t.cardId,
        title: t.title,
        type: 'cardType-linkedBoard',
        linkedId: t.linkedBoardId,
        boardId: ${literal(containerId)},
        swimlaneId: ${literal(swimlaneId)},
        listId: ${literal(listId)},
        members: [], assignees: [], labelIds: [], customFields: [],
        cardNumber: i + 1, archived: false, parentId: '', coverId: '',
        description: '', sort: i, subtaskSort: -1,
        userId: ${literal(ownerId)},
        createdAt: now, modifiedAt: now, dateLastActivity: now,
      })));
    }
  `);

  return { containerId, swimlaneId, listId, templateBoards };
}

/** Return the _id of the first non-archived card on a board with the given title. */
function findCardIdByTitle({ boardId, title } = {}) {
  const raw = mongoEval(`
    const c = db.cards.findOne(
      { boardId: ${literal(boardId)}, title: ${literal(title)}, archived: false },
      { fields: { _id: 1 } }
    );
    print(c ? c._id : '');
  `);
  return raw || null;
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
  mongoEval(`
    db.cards.updateOne(
      { _id: ${literal(cardId)} },
      { $set: { cardDependencies: ${JSON.stringify(deps)} } }
    );
  `);
}

/** Toggle a board's showDependencies (#3392 "Red Strings" overlay) flag. */
function setBoardShowDependencies({ boardId, value = true } = {}) {
  mongoEval(`
    db.boards.updateOne(
      { _id: ${literal(boardId)} },
      { $set: { showDependencies: ${value ? 'true' : 'false'} } }
    );
  `);
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
    // Also remove any Templates container board (and its template boards/cards)
    // that may have been seeded for this user via seedTemplatesBoard.
    mongoEval(`
      const u = db.users.findOne({ _id: ${literal(userId)} }, { fields: { 'profile.templatesBoardId': 1 } });
      const tb = u && u.profile && u.profile.templatesBoardId;
      if (tb) {
        const linked = db.cards.find({ boardId: tb, type: 'cardType-linkedBoard' }, { fields: { linkedId: 1 } }).toArray();
        const linkedIds = linked.map(c => c.linkedId).filter(Boolean);
        if (linkedIds.length) { db.boards.deleteMany({ _id: { $in: linkedIds } }); }
        db.cards.deleteMany({ boardId: tb });
        db.lists.deleteMany({ boardId: tb });
        db.swimlanes.deleteMany({ boardId: tb });
        db.boards.deleteOne({ _id: tb });
      }
      db.users.deleteOne({ _id: ${literal(userId)} });
    `);
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

module.exports = { seedUser, seedBoard, addBoardMember, setUserGroups, seedTemplatesBoard, findCardIdByTitle, setCardDependencies, setBoardShowDependencies, cleanup, getCard, getBoard, mongoEval, literal };
