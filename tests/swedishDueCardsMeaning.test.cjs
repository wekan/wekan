const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
test('Swedish Due Cards labels include future due dates rather than implying overdue only', () => {
  const d = JSON.parse(fs.readFileSync('imports/i18n/data/sv.i18n.json', 'utf8'));
  for (const key of ['dueCards-title', 'dueCardsViewChange-title', 'dueCardsViewChangePopup-title']) {
    assert.match(d[key], /kort med förfallodatum/i);
    assert.doesNotMatch(d[key], /förfallna/i);
  }
  const context = {}; vm.createContext(context);
  vm.runInContext(fs.readFileSync('client/components/main/dueCardsLogic.js', 'utf8').replace(/^export /gm, ''), context);
  const result = context.filterAndSortDueCards([
    { _id: 'future', dueAt: '2099-01-01' }, { _id: 'past', dueAt: '2000-01-01' },
  ], { allUsers: true });
  assert.equal(result.length, 2);
  assert.equal(result[1]._id, 'future');
});

test('Swedish planning and recovery translations preserve keys, tokens and meaning', async () => {
  const { spawnSync } = require('node:child_process');
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const en = JSON.parse(fs.readFileSync('imports/i18n/data/en.i18n.json', 'utf8'));
  const sv = JSON.parse(fs.readFileSync('imports/i18n/data/sv.i18n.json', 'utf8'));
  assert.deepEqual(Object.keys(sv), Object.keys(en));
  for (const key of Object.keys(en)) {
    assert.deepEqual(translationTokens(sv[key]), translationTokens(en[key]), key);
  }
  for (const key of ['filter-column-age-hint', 'scrum-total', 'sync-preview-saved',
    'email-recovery-description', 'activity-recovery-busy', 'saml-login-not-started',
    'r-rule-any-trigger-help', 'move-selection-before', 'move-selection-after']) {
    assert.ok(sv[key]?.trim(), key);
    assert.notEqual(sv[key], en[key], key);
  }
  assert.equal(sv['move-selection-before'], 'Före');
  assert.equal(sv['move-selection-after'], 'Efter');
  assert.match(sv['scrum-report-help'], /inte nolluppskattningar/);
  assert.match(sv['sync-conflict-hint'], /Ingenting skickas till källsystemet/);
  assert.match(sv['activity-recovery-cancel-confirm'], /kan inte återupptas/);
  assert.equal(sv['blockly-MATH_ADDITION_SYMBOL_ARIA'], 'plus');
  const result = spawnSync(process.execPath,
    ['releases/translations/fill-translations.mjs', '--list', 'sv', '--completed-catalog'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {});
});
