const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const puppeteer = require('puppeteer-core');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';
const MONGO_URL = process.env.WEKAN_MONGO_URL || 'mongodb://127.0.0.1:3001/meteor';
const CHROMIUM_PATH = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
const HEADLESS = process.env.HEADLESS !== 'false';
const KEEP_E2E_DATA = process.env.KEEP_E2E_DATA === '1';
const RUN_ID = `${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
const ARTIFACT_DIR = process.env.E2E_ARTIFACT_DIR || `/tmp/wekan-list-regressions-${RUN_ID}`;

const TEST_USER_ID = `e2e-user-${RUN_ID}`;
const TEST_USERNAME = `e2e_${RUN_ID}`;
const TEST_EMAIL = `${TEST_USERNAME}@example.com`;
const TEST_BOARD_TITLE = `E2E Blaze Regression ${RUN_ID}`;
const TEST_BOARD_SLUG = `e2e-blaze-regression-${RUN_ID}`;
const TEST_CARD_NAMES = {
  headerTop: `Header Top ${RUN_ID}`,
  popupTop: `Popup Top ${RUN_ID}`,
  popupBottom: `Popup Bottom ${RUN_ID}`,
};
const TEST_BOARD_ID = `e2eBoard${crypto.randomBytes(6).toString('hex')}`;
const TEST_SWIMLANE_ID = `e2eSwim${crypto.randomBytes(6).toString('hex')}`;
const TEST_LIST_IDS = [
  `e2eListA${crypto.randomBytes(4).toString('hex')}`,
  `e2eListB${crypto.randomBytes(4).toString('hex')}`,
  `e2eListC${crypto.randomBytes(4).toString('hex')}`,
];

let browser;
let page;
let testBoardId = TEST_BOARD_ID;
let testSwimlaneId = TEST_SWIMLANE_ID;
let testListIds = TEST_LIST_IDS;

function logStep(message) {
  console.log(`\n[wekan-e2e] ${message}`);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function mongoEval(script) {
  return execFileSync('mongosh', ['--quiet', MONGO_URL, '--eval', script], {
    cwd: process.cwd(),
    encoding: 'utf8',
  }).trim();
}

function toMongoLiteral(value) {
  return JSON.stringify(value);
}

function createResumeToken() {
  const rawToken = crypto.randomBytes(24).toString('base64url');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('base64');
  return { rawToken, hashedToken };
}

function seedLoginUser() {
  const { rawToken, hashedToken } = createResumeToken();
  const script = `
const now = new Date();
db.users.deleteOne({ _id: ${toMongoLiteral(TEST_USER_ID)} });
db.users.insertOne({
  _id: ${toMongoLiteral(TEST_USER_ID)},
  createdAt: now,
  username: ${toMongoLiteral(TEST_USERNAME)},
  emails: [{ address: ${toMongoLiteral(TEST_EMAIL)}, verified: true }],
  isAdmin: false,
  authenticationMethod: 'password',
  profile: {
    boardView: 'board-view-swimlanes',
    listWidths: {},
    listConstraints: {},
    autoWidthBoards: {},
    swimlaneHeights: {},
    collapsedLists: {},
    collapsedSwimlanes: {},
    keyboardShortcuts: false,
    verticalScrollbars: true,
    showWeekOfYear: true,
    dateFormat: 'YYYY-MM-DD',
    zoomLevel: 1,
    mobileMode: false,
    cardZoom: 1,
    starredBoards: [],
  },
  services: {
    resume: {
      loginTokens: [{
        when: now,
        hashedToken: ${toMongoLiteral(hashedToken)},
      }],
    },
  },
});
  `;
  mongoEval(script);
  return rawToken;
}

function seedBoardDataInMongo() {
  const [listAId, listBId, listCId] = TEST_LIST_IDS;
  const script = `
const now = new Date();
db.cards.deleteMany({ boardId: ${toMongoLiteral(TEST_BOARD_ID)} });
db.lists.deleteMany({ boardId: ${toMongoLiteral(TEST_BOARD_ID)} });
db.swimlanes.deleteMany({ boardId: ${toMongoLiteral(TEST_BOARD_ID)} });
db.boards.deleteMany({ _id: ${toMongoLiteral(TEST_BOARD_ID)} });

db.boards.insertOne({
  _id: ${toMongoLiteral(TEST_BOARD_ID)},
  title: ${toMongoLiteral(TEST_BOARD_TITLE)},
  permission: 'private',
  migrationVersion: 1,
  slug: ${toMongoLiteral(TEST_BOARD_SLUG)},
  archived: false,
  createdAt: now,
  modifiedAt: now,
  stars: 0,
  members: [{
    userId: ${toMongoLiteral(TEST_USER_ID)},
    isAdmin: true,
    isActive: true,
    isNoComments: false,
    isCommentOnly: false,
    isWorker: false,
    isReadOnly: false,
    isReadAssignedOnly: false,
  }],
  color: 'belize',
  allowsCardCounterList: false,
  allowsBoardMemberList: false,
  subtasksDefaultBoardId: null,
  subtasksDefaultListId: null,
  dateSettingsDefaultBoardId: null,
  dateSettingsDefaultListId: null,
  allowsSubtasks: true,
  allowsAttachments: true,
  allowsChecklists: true,
  allowsComments: true,
  allowsDescriptionTitle: true,
  allowsDescriptionText: true,
  allowsDescriptionTextOnMinicard: false,
  allowsCoverAttachmentOnMinicard: true,
  allowsBadgeAttachmentOnMinicard: false,
  allowsCardSortingByNumberOnMinicard: false,
  allowsCardNumber: false,
  allowsActivities: true,
  allowsLabels: true,
  allowsCreator: true,
  allowsCreatorOnMinicard: false,
  allowsAssignee: true,
  allowsMembers: true,
  allowsRequestedBy: true,
  allowsCardSortingByNumber: true,
  allowsShowLists: true,
  allowsAssignedBy: true,
  allowsShowListsOnMinicard: false,
  allowsChecklistAtMinicard: false,
  allowsReceivedDate: true,
  allowsStartDate: true,
  allowsEndDate: true,
  allowsDueDate: true,
  presentParentTask: 'no-parent',
  isOvertime: false,
  type: 'board',
  sort: -1,
  showActivities: false,
});

db.swimlanes.insertOne({
  _id: ${toMongoLiteral(TEST_SWIMLANE_ID)},
  title: 'Default',
  boardId: ${toMongoLiteral(TEST_BOARD_ID)},
  archived: false,
  createdAt: now,
  updatedAt: now,
  modifiedAt: now,
  type: 'swimlane',
  height: -1,
  sort: 0,
});

db.lists.insertMany([
  {
    _id: ${toMongoLiteral(listAId)},
    title: ${toMongoLiteral(`Alpha ${RUN_ID}`)},
    boardId: ${toMongoLiteral(TEST_BOARD_ID)},
    sort: 1,
    type: 'list',
    swimlaneId: ${toMongoLiteral(TEST_SWIMLANE_ID)},
    starred: false,
    archived: false,
    createdAt: now,
    updatedAt: now,
    modifiedAt: now,
    wipLimit: { value: 1, enabled: false, soft: false },
    width: 272,
  },
  {
    _id: ${toMongoLiteral(listBId)},
    title: ${toMongoLiteral(`Beta ${RUN_ID}`)},
    boardId: ${toMongoLiteral(TEST_BOARD_ID)},
    sort: 2,
    type: 'list',
    swimlaneId: ${toMongoLiteral(TEST_SWIMLANE_ID)},
    starred: false,
    archived: false,
    createdAt: now,
    updatedAt: now,
    modifiedAt: now,
    wipLimit: { value: 1, enabled: false, soft: false },
    width: 272,
  },
  {
    _id: ${toMongoLiteral(listCId)},
    title: ${toMongoLiteral(`Gamma ${RUN_ID}`)},
    boardId: ${toMongoLiteral(TEST_BOARD_ID)},
    sort: 3,
    type: 'list',
    swimlaneId: ${toMongoLiteral(TEST_SWIMLANE_ID)},
    starred: false,
    archived: false,
    createdAt: now,
    updatedAt: now,
    modifiedAt: now,
    wipLimit: { value: 1, enabled: false, soft: false },
    width: 272,
  }
]);

db.cards.insertMany([
  {
    _id: ${toMongoLiteral(`e2eCard1${crypto.randomBytes(4).toString('hex')}`)},
    title: ${toMongoLiteral(`Seed One ${RUN_ID}`)},
    members: [],
    labelIds: [],
    customFields: [],
    listId: ${toMongoLiteral(listAId)},
    boardId: ${toMongoLiteral(TEST_BOARD_ID)},
    swimlaneId: ${toMongoLiteral(TEST_SWIMLANE_ID)},
    type: 'cardType-card',
    cardNumber: 1,
    archived: false,
    parentId: '',
    coverId: '',
    createdAt: now,
    modifiedAt: now,
    dateLastActivity: now,
    description: '',
    requestedBy: '',
    assignedBy: '',
    assignees: [],
    spentTime: 0,
    isOvertime: false,
    userId: ${toMongoLiteral(TEST_USER_ID)},
    sort: 100,
    subtaskSort: -1,
    linkedId: '',
    vote: { question: '', positive: [], negative: [], end: null, public: false, allowNonBoardMembers: false },
    targetId_gantt: [],
    linkType_gantt: [],
    linkId_gantt: [],
    showActivities: false,
    showListOnMinicard: false,
    showChecklistAtMinicard: false,
  },
  {
    _id: ${toMongoLiteral(`e2eCard2${crypto.randomBytes(4).toString('hex')}`)},
    title: ${toMongoLiteral(`Seed Two ${RUN_ID}`)},
    members: [],
    labelIds: [],
    customFields: [],
    listId: ${toMongoLiteral(listAId)},
    boardId: ${toMongoLiteral(TEST_BOARD_ID)},
    swimlaneId: ${toMongoLiteral(TEST_SWIMLANE_ID)},
    type: 'cardType-card',
    cardNumber: 2,
    archived: false,
    parentId: '',
    coverId: '',
    createdAt: now,
    modifiedAt: now,
    dateLastActivity: now,
    description: '',
    requestedBy: '',
    assignedBy: '',
    assignees: [],
    spentTime: 0,
    isOvertime: false,
    userId: ${toMongoLiteral(TEST_USER_ID)},
    sort: 200,
    subtaskSort: -1,
    linkedId: '',
    vote: { question: '', positive: [], negative: [], end: null, public: false, allowNonBoardMembers: false },
    targetId_gantt: [],
    linkType_gantt: [],
    linkId_gantt: [],
    showActivities: false,
    showListOnMinicard: false,
    showChecklistAtMinicard: false,
  },
  {
    _id: ${toMongoLiteral(`e2eCard3${crypto.randomBytes(4).toString('hex')}`)},
    title: ${toMongoLiteral(`Seed Three ${RUN_ID}`)},
    members: [],
    labelIds: [],
    customFields: [],
    listId: ${toMongoLiteral(listBId)},
    boardId: ${toMongoLiteral(TEST_BOARD_ID)},
    swimlaneId: ${toMongoLiteral(TEST_SWIMLANE_ID)},
    type: 'cardType-card',
    cardNumber: 3,
    archived: false,
    parentId: '',
    coverId: '',
    createdAt: now,
    modifiedAt: now,
    dateLastActivity: now,
    description: '',
    requestedBy: '',
    assignedBy: '',
    assignees: [],
    spentTime: 0,
    isOvertime: false,
    userId: ${toMongoLiteral(TEST_USER_ID)},
    sort: 100,
    subtaskSort: -1,
    linkedId: '',
    vote: { question: '', positive: [], negative: [], end: null, public: false, allowNonBoardMembers: false },
    targetId_gantt: [],
    linkType_gantt: [],
    linkId_gantt: [],
    showActivities: false,
    showListOnMinicard: false,
    showChecklistAtMinicard: false,
  },
  {
    _id: ${toMongoLiteral(`e2eCard4${crypto.randomBytes(4).toString('hex')}`)},
    title: ${toMongoLiteral(`Seed Four ${RUN_ID}`)},
    members: [],
    labelIds: [],
    customFields: [],
    listId: ${toMongoLiteral(listCId)},
    boardId: ${toMongoLiteral(TEST_BOARD_ID)},
    swimlaneId: ${toMongoLiteral(TEST_SWIMLANE_ID)},
    type: 'cardType-card',
    cardNumber: 4,
    archived: false,
    parentId: '',
    coverId: '',
    createdAt: now,
    modifiedAt: now,
    dateLastActivity: now,
    description: '',
    requestedBy: '',
    assignedBy: '',
    assignees: [],
    spentTime: 0,
    isOvertime: false,
    userId: ${toMongoLiteral(TEST_USER_ID)},
    sort: 100,
    subtaskSort: -1,
    linkedId: '',
    vote: { question: '', positive: [], negative: [], end: null, public: false, allowNonBoardMembers: false },
    targetId_gantt: [],
    linkType_gantt: [],
    linkId_gantt: [],
    showActivities: false,
    showListOnMinicard: false,
    showChecklistAtMinicard: false,
  }
]);
  `;
  mongoEval(script);
}

function cleanupMongoData() {
  const script = `
const boardId = ${toMongoLiteral(testBoardId || null)};
if (boardId) {
  db.cards.deleteMany({ boardId });
  db.lists.deleteMany({ boardId });
  db.swimlanes.deleteMany({ boardId });
  db.boards.deleteMany({ _id: boardId });
}
db.users.deleteOne({ _id: ${toMongoLiteral(TEST_USER_ID)} });
  `;
  mongoEval(script);
}

async function screenshot(name) {
  ensureDir(ARTIFACT_DIR);
  const filePath = path.join(ARTIFACT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

async function waitForMeteorGlobals(targetPage) {
  await targetPage.waitForFunction(
    () => typeof Meteor !== 'undefined' && typeof Boards !== 'undefined' && typeof Popup !== 'undefined',
    { timeout: 60000 },
  );
}

async function loginWithToken(targetPage, rawToken) {
  await targetPage.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle2' });
  await waitForMeteorGlobals(targetPage);
  const loginResult = await targetPage.evaluate(async token => {
    return await new Promise(resolve => {
      Meteor.loginWithToken(token, err => {
        resolve({
          error: err && (err.reason || err.message),
          userId: Meteor.userId(),
        });
      });
    });
  }, rawToken);
  assert(!loginResult.error, `Login with resume token failed: ${loginResult.error}`);
  assert(loginResult.userId === TEST_USER_ID, 'Unexpected logged-in test user');
  await targetPage.goto(BASE_URL, { waitUntil: 'networkidle2' });
}

async function seedBoardData() {
  seedBoardDataInMongo();
  await page.reload({ waitUntil: 'networkidle2' });
  return {
    boardId: TEST_BOARD_ID,
    swimlaneId: TEST_SWIMLANE_ID,
    listIds: TEST_LIST_IDS,
    slug: TEST_BOARD_SLUG,
  };
}

async function openBoard(boardId, slug) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await page.goto(`${BASE_URL}/b/${boardId}/${slug}`, { waitUntil: 'networkidle2' });
    await wait(2500);
    if (await page.$('.board-canvas, .js-lists') && await page.$('.js-list:not(.js-list-composer)')) {
      return;
    }
  }

  const debugInfo = await page.evaluate(() => ({
    path: location.pathname,
    listCount: document.querySelectorAll('.js-list:not(.js-list-composer)').length,
    body: document.body.innerText.slice(0, 1000),
  }));
  throw new Error(`Board lists did not render: ${JSON.stringify(debugInfo)}`);
}

async function closeVisibleComposers(listId) {
  const selector = `#js-list-${listId} .js-inlined-form .js-close-inlined-form`;
  while (await page.$(selector)) {
    await page.click(selector);
    await wait(200);
  }
}

async function submitComposerForList(listId, title) {
  const textareaSelector = `#js-list-${listId} .js-inlined-form textarea.js-card-title`;
  const submitSelector = `#js-list-${listId} .js-inlined-form button[type=submit]`;
  let found = false;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await page.waitForSelector(textareaSelector, { timeout: 4000 });
      found = true;
      break;
    } catch (error) {
      if (attempt === 3) {
        throw error;
      }
      await wait(500);
    }
  }
  assert(found, `Composer did not open for list ${listId}`);
  await page.$eval(
    textareaSelector,
    (textarea, value) => {
      textarea.focus();
      textarea.value = value;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    },
    title,
  );
  await page.click(submitSelector);
}

async function getCardTitles(listId) {
  return await page.$$eval(
    `#js-list-${listId} .js-minicard .minicard-title`,
    nodes => nodes.map(node => node.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean),
  );
}

async function assertCardAtPosition(listId, title, position) {
  const selector = `#js-list-${listId} .js-minicard .minicard-title`;
  try {
    await page.waitForFunction(
      ({ selector: currentSelector, expectedTitle, expectedPosition }) => {
        const titles = Array.from(document.querySelectorAll(currentSelector)).map(node =>
          node.innerText.replace(/\s+/g, ' ').trim(),
        ).filter(Boolean);
        if (!titles.includes(expectedTitle)) {
          return false;
        }
        return expectedPosition === 'first'
          ? titles[0] === expectedTitle
          : titles[titles.length - 1] === expectedTitle;
      },
      { timeout: 20000 },
      {
        selector,
        expectedTitle: title,
        expectedPosition: position,
      },
    );
  } catch (error) {
    const titles = await getCardTitles(listId);
    throw new Error(
      `Card ${JSON.stringify(title)} did not reach ${position} position. Current titles: ${JSON.stringify(titles)}`,
    );
  }
}

async function openListMenuAction(listId, actionSelector) {
  await page.click(`#js-list-${listId} .js-open-list-menu`);
  await page.waitForSelector(`.js-pop-over ${actionSelector}`, { timeout: 10000 });
  await page.$eval(`.js-pop-over ${actionSelector}`, el => el.click());
}

async function getListOrder(containerSelector = '.js-lists') {
  return await page.$$eval(
    `${containerSelector} .js-list:not(.js-list-composer)`,
    nodes => nodes.map(node => {
      const title = node.querySelector('.list-header-name');
      return title ? title.innerText.replace(/\s+/g, ' ').trim() : null;
    }).filter(Boolean),
  );
}

async function dragListAfter(sourceListId, targetListId) {
  const sourceHandle = await page.$(`#js-list-${sourceListId} .js-list-handle`) ||
    await page.$(`#js-list-${sourceListId} .js-list-header`);
  const target = await page.$(`#js-list-${targetListId}`);

  assert(sourceHandle, `Missing drag handle/header for list ${sourceListId}`);
  assert(target, `Missing target list ${targetListId}`);

  const sourceBox = await sourceHandle.boundingBox();
  const targetBox = await target.boundingBox();

  assert(sourceBox, 'Source bounding box missing');
  assert(targetBox, 'Target bounding box missing');

  const startX = sourceBox.x + sourceBox.width / 2;
  const startY = sourceBox.y + sourceBox.height / 2;
  const dropX = targetBox.x + targetBox.width + 60;
  const dropY = targetBox.y + targetBox.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 40, startY, { steps: 8 });
  await page.mouse.move(dropX, dropY, { steps: 25 });
  await page.mouse.up();
  await wait(1200);
}

async function switchBoardView(toggleSelector) {
  await page.click('.js-toggle-board-view');
  await page.waitForSelector(`.js-pop-over ${toggleSelector}`, { timeout: 10000 });
  await page.click(`.js-pop-over ${toggleSelector}`);
  await wait(1200);
}

async function runTest() {
  ensureDir(ARTIFACT_DIR);
  const rawToken = seedLoginUser();

  browser = await puppeteer.launch({
    headless: HEADLESS ? 'new' : false,
    executablePath: CHROMIUM_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1600, height: 1000 },
  });
  page = await browser.newPage();

  logStep('Logging in with a generated resume token');
  await loginWithToken(page, rawToken);

  logStep('Seeding a dedicated board with three lists and two cards');
  const seededBoard = await seedBoardData();
  await openBoard(seededBoard.boardId, seededBoard.slug);
  await screenshot('01-seeded-board');

  const [listAId, listBId, listCId] = seededBoard.listIds;

  logStep('Testing header add-card-to-top action');
  await closeVisibleComposers(listAId);
  await page.click(`#js-list-${listAId} .js-add-card.list-header-plus-top`);
  await submitComposerForList(listAId, TEST_CARD_NAMES.headerTop);
  await assertCardAtPosition(listAId, TEST_CARD_NAMES.headerTop, 'first');
  await screenshot('02-header-top-card');

  logStep('Testing popup add-card-to-top action');
  await closeVisibleComposers(listBId);
  await openListMenuAction(listBId, '.js-add-card.list-header-plus-top');
  await submitComposerForList(listBId, TEST_CARD_NAMES.popupTop);
  await assertCardAtPosition(listBId, TEST_CARD_NAMES.popupTop, 'first');
  await screenshot('03-popup-top-card');

  logStep('Testing popup add-card-to-bottom action');
  await closeVisibleComposers(listCId);
  await openListMenuAction(listCId, '.js-add-card.list-header-plus-bottom');
  await submitComposerForList(listCId, TEST_CARD_NAMES.popupBottom);
  await assertCardAtPosition(listCId, TEST_CARD_NAMES.popupBottom, 'last');
  await screenshot('04-popup-bottom-card');

  logStep('Testing list reorder persistence in Lists view');
  await switchBoardView('.js-open-lists-view');
  const listViewInitialOrder = await getListOrder('.list-group.js-lists');
  await dragListAfter(listAId, listCId);
  await page.waitForFunction(
    expectedFirstTitle => {
      const titles = Array.from(document.querySelectorAll('.list-group.js-lists .js-list .list-header-name')).map(node =>
        node.innerText.replace(/\s+/g, ' ').trim(),
      );
      return titles[0] !== expectedFirstTitle;
    },
    { timeout: 20000 },
    listViewInitialOrder[0],
  );
  const listViewMovedOrder = await getListOrder('.list-group.js-lists');
  assert(listViewMovedOrder[0] !== listViewInitialOrder[0], 'Lists view drag reorder did not change order');
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('.list-group.js-lists .js-list', { timeout: 60000 });
  const listViewReloadedOrder = await getListOrder('.list-group.js-lists');
  assert(
    JSON.stringify(listViewReloadedOrder) === JSON.stringify(listViewMovedOrder),
    'Lists view order was not persisted after reload',
  );
  await screenshot('05-lists-view-persisted');

  logStep('Testing persisted order from a fresh second session');
  const secondPage = await browser.newPage();
  await loginWithToken(secondPage, rawToken);
  await secondPage.goto(`${BASE_URL}/b/${seededBoard.boardId}/${seededBoard.slug}`, { waitUntil: 'networkidle2' });
  await secondPage.click('.js-toggle-board-view');
  await secondPage.waitForSelector('.js-pop-over .js-open-lists-view', { timeout: 10000 });
  await secondPage.click('.js-pop-over .js-open-lists-view');
  await wait(1000);
  const secondSessionOrder = await secondPage.$$eval(
    '.list-group.js-lists .js-list .list-header-name',
    nodes => nodes.map(node => node.innerText.replace(/\s+/g, ' ').trim()),
  );
  assert(
    JSON.stringify(secondSessionOrder) === JSON.stringify(listViewMovedOrder),
    'Second session did not see persisted list order',
  );
  await secondPage.close();

  logStep('Testing list reorder persistence in Swimlanes view');
  await switchBoardView('.js-open-swimlanes-view');
  const swimlaneInitialOrder = await getListOrder(`#swimlane-${testSwimlaneId}`);
  await dragListAfter(listCId, listAId);
  const swimlaneMovedOrder = await getListOrder(`#swimlane-${testSwimlaneId}`);
  assert(
    JSON.stringify(swimlaneMovedOrder) !== JSON.stringify(swimlaneInitialOrder),
    'Swimlanes view drag reorder did not change order',
  );
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector(`#swimlane-${testSwimlaneId} .js-list`, { timeout: 60000 });
  const swimlaneReloadedOrder = await getListOrder(`#swimlane-${testSwimlaneId}`);
  assert(
    JSON.stringify(swimlaneReloadedOrder) === JSON.stringify(swimlaneMovedOrder),
    'Swimlanes view order was not persisted after reload',
  );
  await screenshot('06-swimlanes-view-persisted');

  const finalListATitles = await getCardTitles(listAId);
  const finalListBTitles = await getCardTitles(listBId);
  const finalListCTitles = await getCardTitles(listCId);
  assert(finalListATitles.includes(TEST_CARD_NAMES.headerTop), 'Header top card missing from first list');
  assert(finalListBTitles.includes(TEST_CARD_NAMES.popupTop), 'Popup top card missing from second list');
  assert(finalListCTitles.includes(TEST_CARD_NAMES.popupBottom), 'Popup bottom card missing from third list');

  console.log('\n[wekan-e2e] PASS');
  console.log(`[wekan-e2e] Artifacts: ${ARTIFACT_DIR}`);
}

(async () => {
  try {
    await runTest();
  } catch (error) {
    console.error(`\n[wekan-e2e] FAIL: ${error.message}`);
    if (page) {
      try {
        const failureShot = await screenshot('failure');
        console.error(`[wekan-e2e] Failure screenshot: ${failureShot}`);
      } catch (screenshotError) {
        console.error(`[wekan-e2e] Could not capture failure screenshot: ${screenshotError.message}`);
      }
    }
    process.exitCode = 1;
  } finally {
    if (browser) {
      await browser.close();
    }
    if (!KEEP_E2E_DATA) {
      try {
        cleanupMongoData();
      } catch (cleanupError) {
        console.error(`[wekan-e2e] Cleanup warning: ${cleanupError.message}`);
      }
    }
  }
})();
