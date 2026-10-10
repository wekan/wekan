// Esperanto has no remaining current fill placeholders, including pending keys.
'use strict';
const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const node = process.execPath;
const fill = path.join(ROOT, 'releases/translations/fill-translations.mjs');
assert.deepStrictEqual(JSON.parse(childProcess.execFileSync(node,
  [fill, '--list', 'eo'], { cwd: ROOT, encoding: 'utf8' })), {});
const translated = JSON.parse(fs.readFileSync(path.join(ROOT,
  'imports/i18n/data/eo.i18n.json'), 'utf8'));
for (const key of ['no-boards-selected', 'office-report-desc', 'api-report-desc']) {
  assert.match(translated[key], /ĉ|ĝ|ĵ|ŝ|ŭ|tabul|ensalut|finpunkt/u);
  assert.doesNotMatch(translated[key], /You did not|Where people|Which REST/);
}
assert.match(translated['api-no-calls'], /WITH_API=true/);
const english = JSON.parse(fs.readFileSync(path.join(ROOT,
  'imports/i18n/data/en.i18n.json'), 'utf8'));
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
assert.deepStrictEqual(Object.keys(translated), Object.keys(english));
for (const key of Object.keys(english)) {
  assert.deepStrictEqual(translationTokens(translated[key]), translationTokens(english[key]), key);
}
// Import names, file formats and parsed header literals must remain usable.
for (const [key, literals] of Object.entries({
  'import-board-instruction-orgmode': ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED'],
  'import-board-instruction-businessmap': ['Title', 'Column', 'Lane', 'Owner', 'Deadline', '.xlsx'],
  'import-board-instruction-teamwork': ['Tasklist', 'Assign to', 'Estimated time', '--', '##', '>>'],
  'import-board-instruction-redmine': ['All columns', 'Description', 'My account', '% Done'],
  'import-board-instruction-vikunja': ['data.json', '.zip'],
  'r-wrike-workflow-note': ['GET /workflows', 'Active', 'Completed', 'Deferred', 'Cancelled'],
  'ldap-sync-now-nothing': ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED'],
  'external-link-rules-description': ['{number}', '{identifier}', ' = ', 'https://tracker.example.com/{identifier}/{number}'],
})) for (const literal of literals) assert.ok(translated[key].includes(literal), `${key}: ${literal}`);
assert.match(translated['custom-field-links-hint'], /sama nomo kaj tipo.*ambaŭ kartoj.*nur unu karto.*senŝanĝaj/);
assert.match(translated['custom-field-link-both'], /Ambaŭdirekte/);
assert.match(translated['custom-field-link-send'], /Unudirekte.*ĉefa karto/);
assert.match(translated['field-link-not-allowed'], /rajti redakti ambaŭ/);
assert.strictEqual(translated['import-members-mode-me'], 'Anstataŭigi ilin ĉiujn per mi');
assert.match(translated['read-only-field'], /ĉiu membro vidas.*nur tabuladministrantoj ŝanĝas/);
for (const format of ['nullboard', 'kanri']) assert.match(translated[`import-board-instruction-${format}`], /unua tabulo/);
for (const format of ['taiga', 'vikunja']) assert.match(translated[`import-board-instruction-${format}`], /Aldonaĵoj ne estas importitaj/);
assert.match(translated['import-board-instruction-plane'], /ne enhavas priskribojn aŭ aldonaĵojn/);
assert.match(translated['stuck-sync-operation-discard-confirm'], /aplikitaj ŝanĝoj restas.*ceteraj neniam estos skribitaj/);
assert.match(translated['interrupted-import-description'], /ne povas esti daŭrigita.*fontdosiero ne estas konservata/);
assert.match(translated['interrupted-import-description'], /inkluzive de ĉio aldonita poste/);
assert.match(translated['interrupted-import-keep-confirm'], /Nenio estas forigita/);
assert.match(translated['interrupted-import-discard-confirm'], /tuta enhavo estos definitive forigitaj/);
assert.match(translated['scrum-history-checkpoint-hint'], /nur kiam neniu alia ŝanĝis/);
assert.match(translated['scrum-history-checkpoint-hint'], /ŝanĝas neniujn registrojn/);
assert.match(translated['sync-planning-hint'], /unua sinkronigo neniam forigas planadon/);
assert.match(translated['notification-delivery-quiet'], /atendi ĝis ilia fino/);
assert.notStrictEqual(translated['subtask-mark-done'], translated['subtask-mark-not-done']);
console.log('Esperanto: full current fill, exact tokens, import literals, permissions and recovery semantics pass.');
