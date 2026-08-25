const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'chr'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 1566);

const english = JSON.parse(
  fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'),
);
const cherokee = JSON.parse(
  fs.readFileSync(path.join(root, 'imports/i18n/data/chr.i18n.json'), 'utf8'),
);
const tokens = (value) =>
  [
    ...value.matchAll(
      /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
    ),
  ]
    .map(([token]) => token)
    .sort();
const tags = (value) =>
  [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
    .map(([tag]) => tag)
    .sort();

for (const [key, value] of Object.entries(cherokee)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(cherokee.accept, 'ᎠᏓᏂᎸᏤᏗ');
assert.deepEqual(tokens(cherokee['act-addChecklistItem']), [
  '__board__',
  '__card__',
  '__checklistItem__',
  '__checklist__',
  '__list__',
  '__swimlane__',
]);
assert.match(cherokee['act-createBoard'], /ᎦᏍᎩᎸ/);
assert.deepEqual(tokens(cherokee['act-moveCard']), [
  '__board__',
  '__card__',
  '__list__',
  '__oldList__',
  '__oldSwimlane__',
  '__swimlane__',
]);
assert.match(cherokee['activity-checklist-added'], /ᏗᎪᏪᎵ/);
assert.match(cherokee['workspace-settings'], /ᎠᏛᏁᏗ ᎦᏙᎯ/);
assert.deepEqual(tokens(cherokee['activity-dueDate']), ['%s', '%s']);
assert.match(cherokee['home-board-remove-confirm'], /ᎦᏍᎩᎸ/);
assert.match(cherokee['setSwimlaneHeightPopup-title'], /ᏍᏫᎻᎴᏅ/);
assert.deepEqual(tokens(cherokee['and-n-other-card']), ['__count__']);
assert.deepEqual(tags(cherokee['board-private-info']), [
  '</strong>',
  '<strong>',
]);
assert.match(cherokee['board-private-info'], /ᎤᏕᎵᏛ/);
assert.deepEqual(tokens(cherokee['board-open-and-move-between-remaining-and-workspaces']), ['__workspaces__']);
assert.deepEqual(tags(cherokee['board-public-info']), ['</strong>', '<strong>']);
assert.deepEqual(tokens(cherokee['card-comments-title']), ['%s']);
assert.match(cherokee['cardStartVotingPopup-title'], /ᎤᏂᏁᎫᏥ/);
assert.match(cherokee['cardStartPlanningPokerPopup-title'], /ᏉᎧ/);
assert.match(cherokee['importSwimlanePopup-title'], /ᏍᏫᎻᎴᏅ/);
assert.match(cherokee['map-to-existing-user'], /ᎬᏗᏍᎩ/);
assert.match(cherokee['changeLanguagePopup-title'], /ᎦᏬᏂᎯᏍᏗ/);
assert.match(cherokee['font-preview-text'], /0123456789/);
assert.match(cherokee['color-blue'], /ᏌᎪᏂᎨ/);
assert.match(cherokee['color-red'], /ᎩᎦᎨ/);
assert.match(cherokee['move-card-up'], /ᎦᎸᎳᏗ/);
assert.equal(JSON.parse(cherokee['copyManyCardsPopup-format']).length, 3);
assert.match(cherokee['comment-only'], /ᎧᏃᎮᏓ/);
assert.match(cherokee['custom-field-number'], /ᎠᏎᎸ/);
assert.deepEqual(tokens(cherokee['email-enrollAccount-text']), [
  '__url__',
  '__user__',
]);
assert.deepEqual(tokens(cherokee['email-invite-text']), [
  '__board__',
  '__inviter__',
  '__url__',
  '__user__',
]);
assert.match(cherokee['error-import-empty-board'], /WeKan/);
assert.match(cherokee['export-card-pdf'], /PDF/);
assert.match(cherokee['export-card-excel'], /Excel/);
assert.match(cherokee['filter-due-today'], /ᎪᎯ/);
assert.deepEqual(tokens(cherokee['import-board-instruction-issues']), [
  '__endpoint__',
  '__sourceName__',
]);
assert.match(cherokee['advanced-filter-description'], /F1 == \/Tes\.\*\/i/);
assert.match(cherokee['import-board-instruction-openproject'], /GET \/api\/v3\/work_packages/);
