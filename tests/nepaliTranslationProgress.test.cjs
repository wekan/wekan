'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const result = spawnSync(process.execPath,
  [path.join(root, 'releases/translations/fill-translations.mjs'),
    '--list', 'ne'], { cwd: root, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
assert.equal(Object.keys(JSON.parse(result.stdout)).length, 1867);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const nepali = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/ne.i18n.json'), 'utf8'));
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(nepali)) {
  assert.deepEqual(tokens(value), tokens(english[key]), key);
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(nepali.accept, 'स्वीकार गर्नुहोस्');
assert.deepEqual(tokens(nepali['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(nepali['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(nepali['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.deepEqual(tokens(nepali['act-setCustomField']),
  ['__board__', '__card__', '__customFieldValue__', '__customField__',
    '__list__', '__swimlane__']);
assert.match(nepali['act-createBoard'], /बोर्ड/);
assert.match(nepali['act-createCard'], /कार्ड/);
assert.match(nepali['act-addChecklist'], /जाँचसूची/);
assert.match(nepali['act-addAttachment'], /संलग्नक/);
assert.deepEqual(tokens(nepali['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(nepali['activity-imported']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(nepali['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(nepali['allboards.workspaces'], 'कार्यस्थानहरू');
assert.match(nepali['allboards.edit-workspace-icon'], /markdown/);
assert.deepEqual(tokens(nepali['activity-dueDate']), ['%s', '%s']);
assert.match(nepali['set-list-width-value'], /पिक्सेल/);
assert.match(nepali['list-width-error-message'], /270/);
assert.match(nepali['set-swimlane-height-value'], /पिक्सेल/);
assert.equal(nepali['add-checklist'], 'जाँचसूची थप्नुहोस्');
assert.deepEqual(tokens(nepali['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(nepali['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(nepali['avatar-too-big']), ['__size__']);
assert.match(nepali['board-background-image-url'], /URL/);
assert.deepEqual(tokens(nepali['board-nb-stars']), ['%s']);
assert.deepEqual(tags(nepali['board-private-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tags(nepali['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(nepali[
  'board-open-and-move-between-remaining-and-workspaces']), ['__workspaces__']);
assert.match(nepali['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(nepali['card-comments-title']), ['%s']);
assert.equal(nepali['vote-question'], 'मतदानको प्रश्न');
assert.match(nepali['cardStartPlanningPokerPopup-title'], /प्लानिङ पोकर/);
assert.equal(nepali['cardDependenciesPopup-title'], 'निर्भरता थप्नुहोस्');
assert.equal(nepali['importCardPopup-title'], 'कार्ड आयात गर्नुहोस्');

console.log('Nepali translation progress checks passed.');
