'use strict';

// #1591 "Collapsable checklist on card" (open since 2018):
//
//   "Long checklists can make a card pretty cluttered, so being able to collapse
//    them and expand only when needed would keep the board much cleaner."
//
// Run: node tests/checklistCollapse.test.cjs
//
// WeKan already had something adjacent and it is NOT this: a checklist's own
// `hideAllChecklistItems` field, reachable through a toggle switch inside the
// checklist actions popup. That is a field ON THE CHECKLIST, so flipping it
// changes what EVERYONE on the board sees, and it is a data edit rather than a
// view preference - the wrong thing for "get this out of my way while I read the
// card", and buried where nobody folding a list would look.
//
// Collapsing is per-user, and WeKan already says so twice in its own models:
//
//   models/lists.js:      "collapsed state is per-user only, stored in user
//                          profile.collapsedLists"
//   models/swimlanes.js:  "collapsed state is per-user only ... Use
//                          user.setCollapsedSwimlane(boardId, swimlaneId, ...)"
//
// So cards follow that: profile.collapsedCardSections[cardId][sectionKey], with
// a caret on the title rather than a third entry in a menu. ONE map covers every
// foldable thing on a card - a whole feature group uses its own section name, an
// individual checklist uses 'checklist-<id>' - so the opened card and the
// minicard agree about what was folded. This suite pins the shape against the
// two siblings, because the value of following an existing pattern is entirely
// in actually following it.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const usersModel = read('models/users.js');
const jade = read('client/components/cards/checklists.jade');
const js = read('client/components/cards/checklists.js');
const css = read('client/components/cards/checklists.css');
const minicardJade = read('client/components/cards/minicard.jade');
const minicardJs = read('client/components/cards/minicard.js');
const detailsJs = read('client/components/cards/cardDetails.js');
const detailsCss = read('client/components/cards/cardDetails.css');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// ── the state, and where it lives ───────────────────────────────────────────

test('the collapsed state is per user, beside lists and swimlanes', () => {
  assert.ok(/'profile\.collapsedCardSections': \{/.test(usersModel),
    'it belongs in the user profile, like collapsedLists and collapsedSwimlanes');
  for (const sibling of ['profile.collapsedLists', 'profile.collapsedSwimlanes']) {
    assert.ok(usersModel.includes(`'${sibling}': {`),
      `${sibling} must still be there - this is meant to sit alongside them`);
  }
});

test('ONE map covers every foldable thing on a card', () => {
  assert.ok(/getCollapsedCardSection\(cardId, sectionKey\)/.test(usersModel));
  assert.ok(/setCollapsedCardSection\(cardId, sectionKey, collapsed\)/.test(usersModel));
  assert.ok(/current\[cardId\]\[sectionKey\] = !!collapsed;/.test(usersModel),
    'two checklists on the same card fold independently, so the section key ' +
    'cannot be dropped');
  assert.ok(/checklistSectionKey\(checklistId\) \{[\s\S]{0,120}checklist-\$\{checklistId\}/.test(usersModel),
    'a checklist needs ONE key, because the opened card and the minicard have ' +
    'to agree about which thing was folded');
});

test('"never set" is distinguishable from "expanded"', () => {
  const at = usersModel.indexOf('getCollapsedCardSection(cardId, sectionKey)');
  const body = usersModel.slice(at, usersModel.indexOf('\n  },', at));
  assert.ok(/typeof collapsedCardSections\[cardId\]\[sectionKey\] === 'boolean'/.test(body),
    'a stored false and an absent entry must not be the same thing, or a ' +
    'deliberate expand cannot be told from a default');
  assert.ok(/return null;/.test(body), 'absent returns null, as the siblings do');
});

test('it does NOT touch the checklist document', () => {
  // The distinction this whole feature turns on.
  const setter = usersModel.slice(usersModel.indexOf('async setCollapsedCardSection'));
  const body = setter.slice(0, setter.indexOf('\n  },'));
  assert.ok(/Users\.updateAsync/.test(body), 'it writes the USER');
  assert.ok(!/Checklists\./.test(body),
    'writing the checklist would change what everyone on the board sees, which ' +
    'is what hideAllChecklistItems already does and is not what was asked for');
});

test('the existing shared hideAllChecklistItems is left exactly as it was', () => {
  const checklists = read('models/checklists.js');
  assert.ok(/toggleHideAllChecklistItems/.test(checklists),
    'it has its own uses (it also drives showChecklist / isFinished) and this ' +
    'feature must not have quietly replaced it');
  assert.ok(/hideAllChecklistItems/.test(jade),
    'and its effect on items is still rendered');
});

// ── the control ─────────────────────────────────────────────────────────────

test('the caret is on the title, not another entry in the actions menu', () => {
  assert.ok(/a\.fa\.checklist-collapse\.js-collapse-checklist\(/.test(jade),
    'the point is to fold at a glance while reading the card');
  const titleAt = jade.indexOf('.checklist-title');
  const caretAt = jade.indexOf('js-collapse-checklist');
  const menuAt = jade.indexOf('js-open-checklist-details-menu');
  assert.ok(titleAt < caretAt && caretAt < menuAt,
    'inside the title row, before the actions menu');
});

test('the caret says which way it goes, and to a screen reader too', () => {
  const block = jade.slice(jade.indexOf('js-collapse-checklist'), jade.indexOf('js-open-checklist-details-menu'));
  assert.ok(/fa-caret-right/.test(block) && /fa-caret-down/.test(block),
    'right when folded, down when open - or it is a button with no state');
  assert.ok(/aria-expanded=/.test(block), 'and the state is exposed, not just drawn');
  assert.ok(/role="button"/.test(block) && /tabindex="0"/.test(block),
    'it is an <a> with no href, so it needs both to be reachable');
});

test('folding hides the items and keeps the progress bar', () => {
  assert.ok(/unless checklistCollapsed\s*\n\s*\+checklistItems/.test(jade),
    'the items are what gets folded away');
  const progressAt = jade.indexOf('.checklist-progress-bar-container');
  const unlessAt = jade.indexOf('unless checklistCollapsed');
  assert.ok(progressAt !== -1 && progressAt < unlessAt,
    'the progress bar stays: it is the summary of what was folded, so hiding it ' +
    'too would leave a title that says nothing');
});

test('the click does not also open the rename form underneath it', () => {
  const at = js.indexOf("'click .js-collapse-checklist'");
  const body = js.slice(at, js.indexOf('\n  },', at));
  assert.ok(/event\.preventDefault\(\)/.test(body) && /event\.stopPropagation\(\)/.test(body),
    'the caret sits inside the title, which opens the inline rename form');
  assert.ok(/setCollapsedCardSection\(cardId, key, !collapsed\)/.test(body),
    'and it toggles this user\'s state');
});

test('it works from the keyboard', () => {
  assert.ok(/'keydown \.js-collapse-checklist'/.test(js),
    'a link with no href is not reachable by keyboard without this');
  const at = js.indexOf("'keydown .js-collapse-checklist'");
  const body = js.slice(at, js.indexOf('\n  },', at));
  assert.ok(/event\.key !== 'Enter' && event\.key !== ' '/.test(body),
    'Enter and Space are the keys a button answers');
});

test('a logged-out reader is not broken by it', () => {
  const at = js.indexOf('checklistCollapsed() {');
  const body = js.slice(at, js.indexOf('\n  },', at));
  assert.ok(/if \(!user\) return false;/.test(body),
    'public boards have no current user; the checklist must render expanded ' +
    'rather than throwing');
});

test('the caret is styled and has a hit area', () => {
  assert.ok(/\.checklist-title \.checklist-collapse \{/.test(css));
  assert.ok(/padding:/.test(css.slice(css.indexOf('.checklist-title .checklist-collapse {'))),
    'a single glyph you have to aim at is worse than no glyph');
  assert.ok(/:focus-visible/.test(css), 'and keyboard focus has to be visible on it');
});

test('both labels exist in English', () => {
  assert.strictEqual(en['collapse-checklist'], 'Collapse checklist');
  assert.strictEqual(en['expand-checklist'], 'Expand checklist');
  const block = jade.slice(jade.indexOf('js-collapse-checklist'), jade.indexOf('js-open-checklist-details-menu'));
  assert.ok(/_ 'expand-checklist'/.test(block) && /_ 'collapse-checklist'/.test(block),
    'the title has to say what the click will DO, which is the opposite of the ' +
    'current state');
});


// ── the minicard, and the other feature groups ──────────────────────────────

test('the minicard has the same caret, under the same key', () => {
  assert.ok(/js-collapse-checklist/.test(minicardJade),
    'a checklist shown on a minicard must fold there too');
  assert.ok(/unless checklistCollapsed\s*\n\s*\.checklist-items/.test(minicardJade),
    'and folding must hide its items');
  const at = minicardJs.indexOf("'click .js-collapse-checklist'");
  assert.notStrictEqual(at, -1, 'the minicard needs its own handler');
  const body = minicardJs.slice(at, minicardJs.indexOf('\n  },', at));
  assert.ok(/user\.checklistSectionKey\(checklist\._id\)/.test(body),
    'the SAME key as the opened card, or folding in one place would not fold in ' +
    'the other');
  assert.ok(/event\.preventDefault\(\)/.test(body) && /event\.stopPropagation\(\)/.test(body),
    'a minicard is a link to the card; folding must not open it');
});

test('the card\'s own fields are folded by their SECTION, not one by one', () => {
  // #1591 folded each field by its own title and stored a class per card in
  // this same map. The section carets replaced it - one handle per section, on
  // the heading - and for a while both ran: clicking a section's caret also
  // fired the old per-field handler, so the field the heading was drawn on was
  // left `is-collapsed` with no caret of its own left to open it again. That is
  // where the Date Format select went. The old half is gone.
  assert.ok(!/'click \.card-details-item > \.card-details-item-title'/.test(detailsJs),
    'no per-field handler');
  assert.ok(!/\.card-details-item\.is-collapsed/.test(detailsCss),
    'and nothing hides a field on its own');
  assert.ok(/js-toggle-card-section/.test(detailsJs),
    'the section heading is the handle now');
});

test('the checklists still have this store to themselves (negative)', () => {
  // Removing the card half must not take the checklists' fold with it: they
  // key their own entries by `checklist-<id>` in the same map, which is what
  // makes a checklist folded on the card folded on its minicard too.
  assert.ok(/getCollapsedCardSection/.test(js) && /setCollapsedCardSection/.test(js),
    'the opened card\'s checklists read and write it');
  assert.ok(/checklistSectionKey/.test(minicardJs), 'and so does the minicard');
  assert.ok(/'profile\.collapsedCardSections'/.test(usersModel), 'the store is still there');
  assert.ok(/checklistSectionKey\(checklistId\)/.test(usersModel),
    'with the key that names one');
});

test('the caret CSS is direction-agnostic', () => {
  // tests/rtl.test.js enforces this across component CSS; named here because a
  // caret is exactly the kind of thing that gets a physical float.
  assert.ok(!/float:\s*(left|right)/.test(css),
    'a caret floated left sits on the wrong side of an RTL card');
  assert.ok(/float:\s*inline-start/.test(css));
});

console.log(`\n${passed} passed`);
