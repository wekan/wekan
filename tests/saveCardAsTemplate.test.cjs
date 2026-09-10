// #2209 "Create template from element": save an EXISTING card as a card
// template, the reverse direction of the existing "insert a card FROM a
// template" flow. Pure source checks (no server/database needed): the UI
// wires up the action, the client posts to the right server method, and the
// server method reuses the existing lazy per-user Templates board and card
// copy machinery rather than reinventing either.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

const jade = fs.readFileSync(
  path.join(ROOT, 'client/components/cards/cardDetails.jade'),
  'utf8',
);
const clientJs = fs.readFileSync(
  path.join(ROOT, 'client/components/cards/cardDetails.js'),
  'utf8',
);
const serverCards = fs.readFileSync(
  path.join(ROOT, 'server/models/cards.js'),
  'utf8',
);
const serverUsers = fs.readFileSync(
  path.join(ROOT, 'server/models/users.js'),
  'utf8',
);

test('the card menu offers a "Save as Template" action beside Copy Card', () => {
  // Both menu variants in the file (the collapsed and the full one) must
  // offer it, each right next to js-copy-card, so it is never present in one
  // rendering of the menu and missing from the other.
  const copyCardCount = (jade.match(/a\.js-copy-card\n/g) || []).length;
  const templateLinkCount = (jade.match(/a\.js-save-card-as-template\n/g) || []).length;
  assert.ok(copyCardCount >= 2, 'js-copy-card appears in both menu variants');
  assert.strictEqual(
    templateLinkCount,
    copyCardCount,
    'a.js-save-card-as-template must appear once per a.js-copy-card',
  );
  assert.match(jade, /a\.js-save-card-as-template[\s\S]{0,80}\{\{_ 'save-card-as-template'\}\}/);
});

test('the click handler calls the saveCardAsTemplate server method', () => {
  const start = clientJs.indexOf("'click .js-save-card-as-template'");
  assert.notEqual(start, -1, 'handler is registered');
  const end = clientJs.indexOf('\n  },', start);
  const handler = clientJs.slice(start, end);
  assert.match(handler, /Meteor\.callAsync\('saveCardAsTemplate', cardId\)/);
});

test('saveCardAsTemplate requires board membership before copying', () => {
  const start = serverCards.indexOf('async saveCardAsTemplate(cardId)');
  assert.notEqual(start, -1);
  const end = serverCards.indexOf('\n  },', start);
  const method = serverCards.slice(start, end);
  assert.match(method, /check\(cardId, String\)/);
  assert.match(method, /if \(!this\.userId\) throw new Meteor\.Error\('not-authorized'\)/);
  assert.match(method, /allowIsBoardMember\(this\.userId, sourceBoard\)/);
});

test('saveCardAsTemplate reuses ensureTemplatesBoardForUserId and card.copy(), and marks the copy a template-card', () => {
  const start = serverCards.indexOf('async saveCardAsTemplate(cardId)');
  const end = serverCards.indexOf('\n  },', start);
  const method = serverCards.slice(start, end);
  assert.match(method, /ensureTemplatesBoardForUserId\(this\.userId\)/);
  assert.match(method, /card\.type = 'template-card'/);
  assert.match(method, /await card\.copy\(templatesBoardId, swimlaneId, list\._id\)/);
});

test('ensureTemplatesBoardForUserId is exported once and used by both the Meteor method and saveCardAsTemplate', () => {
  assert.match(serverUsers, /export async function ensureTemplatesBoardForUserId\(userId\)/);
  // The public Meteor method (still callable directly, e.g. from the "Add
  // Template Board" flow) now just delegates to it - no duplicated logic.
  const methodStart = serverUsers.indexOf('async ensureTemplatesBoard()');
  const methodEnd = serverUsers.indexOf('\n  },', methodStart);
  const method = serverUsers.slice(methodStart, methodEnd);
  assert.match(method, /return await ensureTemplatesBoardForUserId\(this\.userId\)/);
});

test('negative: no OTHER card action re-implements templates-board creation inline', () => {
  // The fault this guards against: a second "save as template"-shaped action
  // (card, list, swimlane or board) that duplicates the Templates board /
  // swimlane lookup instead of calling ensureTemplatesBoardForUserId, and so
  // drifts from it over time. Search every client component for a literal
  // 'profile.templatesBoardId' WRITE outside the one place that is allowed to
  // create it.
  const usersDir = path.join(ROOT, 'server/models');
  const offenders = [];
  for (const file of fs.readdirSync(usersDir)) {
    if (!file.endsWith('.js')) continue;
    const content = fs.readFileSync(path.join(usersDir, file), 'utf8');
    const matches = content.match(/\$set:\s*\{\s*'profile\.templatesBoardId'/g) || [];
    if (file === 'users.js') {
      assert.strictEqual(matches.length, 1, 'users.js creates the Templates board in exactly one place');
    } else if (matches.length > 0) {
      offenders.push(file);
    }
  }
  assert.deepStrictEqual(offenders, []);
});

test('en.i18n.json: save-card-as-template sits right after copyCardPopup-title', () => {
  const en = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'imports/i18n/data/en.i18n.json'), 'utf8'),
  );
  const keys = Object.keys(en);
  const idx = keys.indexOf('copyCardPopup-title');
  assert.ok(idx > 0);
  assert.strictEqual(keys[idx + 1], 'save-card-as-template');
  assert.strictEqual(en['save-card-as-template'], 'Save as Template');
});

test('every locale file has save-card-as-template in the same relative position', () => {
  const dir = path.join(ROOT, 'imports/i18n/data');
  const bad = [];
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.i18n.json'))) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const keys = Object.keys(data);
    const anchor = keys.indexOf('copyCardPopup-title');
    const own = keys.indexOf('save-card-as-template');
    if (anchor === -1 || own !== anchor + 1) bad.push(f);
  }
  assert.deepStrictEqual(bad, []);
});

test('most non-English locales have a real (non-English) translation of save-card-as-template', () => {
  const dir = path.join(ROOT, 'imports/i18n/data');
  let translated = 0;
  let total = 0;
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.i18n.json'))) {
    const lang = f.replace('.i18n.json', '');
    if (lang === 'en' || lang.startsWith('en-') || lang.startsWith('en_')) continue;
    total++;
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    if (data['save-card-as-template'] && data['save-card-as-template'] !== 'Save as Template') {
      translated++;
    }
  }
  assert.ok(total > 200, `expected 200+ non-English locale files, found ${total}`);
  assert.strictEqual(translated, total, 'every non-English locale got a direct (non-English) translation');
});
