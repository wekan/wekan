const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root,
  'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'mr'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 1717);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const marathi = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/mr.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(marathi)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(marathi.accept, 'स्वीकारा');
assert.match(marathi.accept, /[\u0900-\u097F]/);
assert.deepEqual(tokens(marathi['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(marathi['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(marathi['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.deepEqual(tokens(marathi['act-setCustomField']),
  ['__board__', '__card__', '__customFieldValue__', '__customField__',
    '__list__', '__swimlane__']);
assert.match(marathi['board-members-same-org-only'], /संस्थेतील/);
assert.match(marathi['board-members-same-team-only'], /संघातील/);
assert.deepEqual(tokens(marathi['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(marathi['activity-imported']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(marathi['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(marathi['allboards.workspaces'], 'कार्यस्थाने');
assert.match(marathi['allboards.edit-workspace-icon'], /markdown/);
assert.equal(marathi['workspaceActionsPopup-title'], 'कार्यस्थान सेटिंग्ज');
assert.deepEqual(tokens(marathi['activity-dueDate']), ['%s', '%s']);
assert.match(marathi['list-width-error-message'], /270/);
assert.match(marathi['set-list-width-value'], /पिक्सेल/);
assert.match(marathi['set-swimlane-height-value'], /पिक्सेल/);
assert.equal(marathi['add-checklist'], 'तपासणीसूची जोडा');
assert.deepEqual(tokens(marathi['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(marathi['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(marathi['avatar-too-big']), ['__size__']);
assert.match(marathi['board-background-image-url'], /URL/);
assert.deepEqual(tokens(marathi['board-nb-stars']), ['%s']);
assert.deepEqual(tags(marathi['board-private-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tags(marathi['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  marathi['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.match(marathi['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(marathi['card-comments-title']), ['%s']);
assert.equal(marathi['card-edit-custom-fields'],
  'सानुकूल क्षेत्रे संपादित करा');
assert.match(marathi['cardStartPlanningPokerPopup-title'], /Planning Poker/);
assert.match(marathi['editPokerEndDatePopup-title'], /Planning Poker/);
assert.equal(marathi['importDependenciesPopup-title'],
  'अवलंबित्वे आयात करा');
assert.equal(marathi['exportChecklistPopup-title'],
  'तपासणीसूची निर्यात करा');
assert.equal(marathi['importSwimlanePopup-title'], 'स्विमलेन आयात करा');
assert.match(marathi.casSignIn, /CAS/);
assert.equal(marathi['cardType-linkedBoard'], 'जोडलेला फलक');
assert.match(marathi['map-to-existing-user-desc'],
  /कार्डे.*टिप्पण्या.*क्रियाकलाप/);
assert.equal(marathi['map-to-existing-user-no-results'],
  'जुळणारे वापरकर्ते सापडले नाहीत.');
assert.match(marathi['font-preview-text'], /0123456789/);
assert.equal(marathi['auto-list-width'], 'स्वयंचलित यादी रुंदी');
assert.match(marathi['card-aging-days'], /3/);
assert.equal(marathi['move-card-up'], 'कार्ड वर हलवा');
assert.equal(marathi['color-red'], 'लाल');
assert.equal(marathi['color-silver'], 'चंदेरी');
assert.equal(marathi['color-magenta'], 'मॅजेंटा');
assert.equal(marathi['color-white'], 'पांढरा');
assert.equal(marathi['read-only'], 'फक्त वाचन');
assert.equal(marathi.worker, 'कार्यकर्ता');
const bulkCardExample = JSON.parse(marathi['copyManyCardsPopup-format']);
assert.deepEqual(Object.keys(bulkCardExample[0]), ['title', 'description']);
assert.equal(marathi['custom-field-number'], 'संख्या');

console.log('Marathi translation progress checks passed.');
