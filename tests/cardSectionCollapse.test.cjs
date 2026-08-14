'use strict';

// Every section of an opened card collapses, from its own caret.
// Run: node tests/cardSectionCollapse.test.cjs
//
// A card had ONE caret, in its header, which collapsed the whole card - and
// Activities had an EYE beside its heading. Everything else was a heading with
// no control at all, and the `hr`s between sections were written by hand where
// somebody remembered one.
//
// Now each section - Labels, Date Format, Members, Dependencies, Sort, Custom
// Fields, Description, Checklists, Subtasks, Attachments, Comments and
// Activities - has a caret that collapses it, and one rule above it. Both come
// from ONE template, `cardSectionHeader`, so eleven sections cannot end up with
// ten separators and nine carets.
//
// Activities starts CLOSED and everything else open: a card is opened to read
// the card, and its history is the thing you go looking for.
//
// THE EYE WAS NOT THE SAME AS THE CARET, which is worth writing down because it
// looks like a straight swap. `showActivities: false` - the default - subscribed
// to `activityType: 'addComment'` ONLY (server/publications/activities.js), so
// the eye chose between "comments" and "the whole history" as well as showing
// and hiding. With it gone: a closed section subscribes to nothing at all, and
// an opened one asks for the whole history.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const jade = read('client/components/cards/cardDetails.jade');
const js = read('client/components/cards/cardDetails.js');
const css = read('client/components/cards/cardDetails.css');
const activities = read('client/components/activities/activities.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('cardSectionCollapse:');

const SECTIONS = [
  'labels', 'date-format', 'members', 'dependencies', 'sort', 'custom-fields',
  'description', 'checklists', 'subtasks', 'attachments', 'comments', 'activities',
];

test('every named section has a caret header', () => {
  for (const section of SECTIONS) {
    assert.ok(new RegExp(`\\+cardSectionHeader\\(section="${section}"`).test(jade),
      `${section} has a section header`);
  }
});

test('and its content is behind that section\'s own switch', () => {
  for (const section of SECTIONS) {
    assert.ok(new RegExp(`isSectionOpen "${section}"`).test(jade),
      `${section} collapses`);
  }
});

test('the rule and the caret come from ONE template', () => {
  const header = jade.slice(jade.indexOf('template(name="cardSectionHeader")'));
  assert.ok(/hr\.card-details-section-rule/.test(header.slice(0, 400)),
    'the separator is part of the header');
  assert.ok(/js-toggle-card-section/.test(header.slice(0, 600)), 'and so is the toggle');
  // Which is what stops a section from having a rule and no caret, or two rules.
  const headers = (jade.match(/\+cardSectionHeader\(section=/g) || []).length;
  assert.ok(headers >= SECTIONS.length,
    `every section uses it (${headers} of ${SECTIONS.length})`);
});

test('Activities starts collapsed, everything else open', () => {
  assert.ok(/COLLAPSED_BY_DEFAULT = \['activities'\]/.test(js),
    'activities is the one that starts closed');
  assert.ok(/state === undefined \? true : state/.test(js),
    'and an unknown section defaults to OPEN - a new one must show up, not hide');
});

test('the caret mirrors in RTL, and only when closed', () => {
  assert.ok(/isCardSectionOpen\(section\)\) return 'fa-caret-down'/.test(js),
    'open is always down');
  assert.ok(/rtl \? 'fa-caret-left' : 'fa-caret-right'/.test(js),
    'closed points the way the reader reads');
  assert.ok(/getLanguageDirection/.test(js), 'read from the language, not guessed');
});

test('the heading is operable by keyboard, not only by mouse', () => {
  const header = jade.slice(jade.indexOf('template(name="cardSectionHeader")'));
  assert.ok(/role="button"/.test(header.slice(0, 600)) && /tabindex="0"/.test(header.slice(0, 600)),
    'it announces itself as a button and can be focused');
  assert.ok(/'keydown \.js-toggle-card-section'/.test(js), 'and Enter/Space toggle it');
  assert.ok(/cursor: pointer/.test(css), 'while a mouse sees a button too');
});

// ── the eye ────────────────────────────────────────────────────────────────

test('the Activities eye is gone, with its handler', () => {
  assert.ok(!/activities-eye-toggle/.test(jade), 'no eye in the template');
  assert.ok(!/js-toggle-show-activities-card/.test(js), 'and no handler left behind');
});

test('removing it did not quietly turn the history into comments-only', () => {
  // The trap: `showActivities` defaults to false, and false means
  // `activityType: 'addComment'` in the publication. With the eye gone and
  // nothing left to set the flag, an opened section would have shown comments
  // only - a feature lost by accident rather than by decision.
  assert.ok(/card\?\.showActivities \?\? true/.test(activities),
    'a card section that is open asks for the whole history');
  assert.ok(/comments ONLY/.test(activities),
    'and the reason the default flipped is written down');
  const publication = read('server/publications/activities.js');
  assert.ok(/activityType: 'addComment'/.test(publication),
    'the publication still has both modes; only the card default changed');
});

test('a closed Activities section subscribes to nothing at all', () => {
  // The cheaper half of what the eye was for, without a control for it.
  const right = jade.slice(jade.indexOf('.card-details-right'));
  const open = right.indexOf('isSectionOpen "activities"');
  const render = right.indexOf('+activities(card=this');
  assert.ok(open !== -1 && open < render,
    'the +activities templates are inside the open branch, so nothing subscribes while closed');
});

test('the sections not in the list are left alone (negative)', () => {
  // Stickers, Location, the four dates, Creator, Assignees and Spent time were
  // not asked for and keep the headings they had.
  for (const untouched of ['card-details-item-stickers', 'card-details-item-location',
    'card-details-item-received', 'card-details-item-creator']) {
    const at = jade.indexOf(untouched);
    assert.ok(at !== -1, `${untouched} is still there`);
    const block = jade.slice(at, at + 200);
    assert.ok(/h3\.card-details-item-title/.test(block),
      `${untouched} keeps its plain heading`);
  }
});

test('a section is a full-width row, so its rule spans the card', () => {
  // `.card-details-items` is a wrapping flex row. A rule inside one of its
  // items is as wide as that item, which is how eleven sections came to be
  // separated by SHORT lines beside their headings instead of one line across
  // the card.
  for (const item of ['card-details-item-labels', 'card-details-item-date-format',
    'card-details-item-members', 'card-details-item-dependencies',
    'card-details-sort-order', 'card-details-item-customfield']) {
    assert.ok(new RegExp(`${item}\\.card-details-section`).test(jade),
      `${item} is marked as a full-width section`);
  }
  assert.ok(/\.card-details-item\.card-details-section \{[\s\S]{0,120}flex: 0 0 100%/.test(css),
    'and the class makes it a row of its own');
  assert.ok(/\.card-details-section-rule \{[\s\S]{0,80}width: 100%/.test(css),
    'so the rule in it spans the card');
});

test('the items that are NOT sections still share rows (negative)', () => {
  // Stickers, Location, the four dates, Creator and Assignees were laid out
  // side by side on purpose; making everything full width would be a different
  // change from the one asked for.
  for (const item of ['card-details-item-stickers', 'card-details-item-location',
    'card-details-item-received', 'card-details-item-creator']) {
    assert.ok(!new RegExp(`${item}\\.card-details-section`).test(jade),
      `${item} is not turned into a full-width row`);
  }
});

test('a section is named ONCE (negative)', () => {
  // Checklists and Subtasks drew their own <h3> as well, so a card showed each
  // of those two names twice, one above the other.
  const checklists = read('client/components/cards/checklists.jade');
  const subtasks = read('client/components/cards/subtasks.jade');
  assert.ok(!/\| \{\{_ 'checklists'\}\}/.test(checklists),
    'the checklists template no longer prints its own title');
  assert.ok(!/\| \{\{_ 'subtasks'\}\}/.test(subtasks),
    'nor does the subtasks template');
  // What belongs to the LIST rather than to the section stays with the list.
  assert.ok(/js-add-checklist/.test(checklists), 'adding a checklist is still there');
  assert.ok(/js-add-subtask/.test(subtasks), 'and adding a subtask');
});

test('the first section has no rule above it, and Members none either', () => {
  // Labels is first - there is nothing above it to separate it from - and
  // Members already sits under the rule the layout draws above Creator, so a
  // second one there is two lines with a heading between them.
  for (const section of ['labels', 'members']) {
    assert.ok(new RegExp(`section="${section}"[^)]*noRule=true`).test(jade),
      `${section} asks for no rule`);
  }
  const header = jade.slice(jade.indexOf('template(name="cardSectionHeader")'));
  assert.ok(/unless noRule\n\s+hr\.card-details-section-rule/.test(header),
    'and the header honours it');
  // Every other section still gets one.
  for (const section of ['date-format', 'dependencies', 'sort', 'description',
    'checklists', 'subtasks', 'attachments', 'comments', 'activities']) {
    assert.ok(!new RegExp(`section="${section}"[^)]*noRule`).test(jade),
      `${section} keeps its rule`);
  }
});

test('the rule is the page\'s own hr, not a heavier one', () => {
  // The lighter line that was already above Creator: `hr` in layouts.css. The
  // section rule only sets its margin.
  const rule = css.slice(css.indexOf('.card-details .card-details-section-rule'));
  const block = rule.slice(0, rule.indexOf('}'));
  assert.ok(!/border-top|background/.test(block),
    'no border or background of its own - it inherits the page hr');
  assert.ok(/margin:/.test(block), 'only the spacing is this rule\'s');
});

test('the Activities rule is above the heading, not beside it', () => {
  // `.activity-title` is `display: flex`, so a rule inside it becomes a flex
  // ITEM - which is how the line ended up to the left of "Activities".
  const right = jade.slice(jade.indexOf('.card-details-right'));
  const title = right.indexOf('.activity-title');
  const header = right.indexOf('+cardSectionHeader(section="activities"');
  assert.ok(header > title, 'the header comes after the .activity-title line');
  const between = right.slice(title, header);
  const headerIndent = right.slice(0, header).split('\n').pop().length;
  const titleIndent = right.slice(0, title).split('\n').pop().length;
  assert.ok(headerIndent <= titleIndent,
    'and is NOT nested inside it - a flex child would be a line beside the heading');
  assert.ok(/display: flex/.test(read('client/components/activities/activities.css')
    .slice(0, 200)), 'which is what .activity-title is');
});

console.log(`\ncardSectionCollapse: ${passed} tests passed`);
