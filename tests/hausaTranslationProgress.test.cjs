const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'ha'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 567);

const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const hausa = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/ha.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(/__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)].map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)].map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(hausa)) {
  if (value !== english[key]) assert.deepEqual(tokens(value), tokens(english[key]), key);
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(hausa.accept, 'Karɓa');
assert.match(hausa['act-createBoard'], /allo/i);
assert.match(hausa['act-createCard'], /kati/i);
assert.equal(hausa.Database_type, "Nau'in ma'ajiyar bayanai");
assert.match(hausa['org-domains-description'], /MULTITENANCY=true/);
assert.equal(hausa['active-person'], 'Mutum mai aiki');
assert.equal(hausa['default-subtasks-board'], 'Ƙananan ayyuka na allon __board__');
assert.equal(hausa['boardDeletePopup-title'], 'A share allo?');
assert.deepEqual(tokens(hausa['activity-added-label']), ['%s', '%s']);
assert.deepEqual(tokens(hausa['activity-set-customfield']), ['%s', '%s', '%s']);
assert.equal(hausa['r-w-every-day-at'], 'Kowace rana da __time__');
assert.equal(hausa['r-import-done'], "An shigo da ƙa'idoji __count__");
assert.equal(hausa['r-import-unmapped'], 'Ba a iya daidaita layuka __count__ ba');
assert.match(hausa['r-import-workflow-note'], /n8n.*Node-RED.*WeKan/);
assert.equal(hausa['r-for-n-days'], 'na kwanaki N');
assert.equal(hausa['r-d-move-to-top-gen'], 'Matsar da kati zuwa saman jerinsa');
assert.equal(hausa['r-d-move-to-bottom-spec'], 'Matsar da kati zuwa ƙasan jeri');
assert.equal(hausa['r-d-send-email'], 'Aika imel');
assert.equal(hausa['r-items-list'], 'abu1,abu2,abu3');
assert.match(hausa['custom-head-manifest-content'], /JSON/);
assert.equal(hausa['authentication-method'], 'Hanyar tantancewa');
assert.deepEqual(tags(hausa['add-custom-html-after-body-start']), ['<body>']);
assert.deepEqual(tokens(hausa['act-a-dueAt']),
  ['__card__', '__timeOldValue__', '__timeValue__']);
assert.deepEqual(tokens(hausa['act-atUserComment']),
  ['__board__', '__card__', '__comment__', '__list__', '__swimlane__']);
assert.equal(hausa.monday, 'Litinin');
assert.equal(hausa.sunday, 'Lahadi');
assert.match(hausa['roles-info'], /Shafin Gudanarwa/);
assert.equal(hausa['globalSearchViewChange-choice-me'], 'Katunana');
assert.deepEqual(tokens(hausa['board-title-not-found']), ['%s']);
assert.match(hausa['shared-templates-info'], /Ƙungiya.*Tawaga/);
assert.deepEqual(tokens(hausa['n-n-of-n-cards-found']),
  ['__end__', '__start__', '__total__']);
assert.equal(hausa['operator-board'], 'allo');
assert.equal(hausa['predicate-overdue'], 'ya-wuce-lokaci');
assert.deepEqual(tokens(hausa['operator-number-expected']),
  ['__operator__', '__value__']);
assert.match(hausa['globalSearch-instructions-description'], /__operator_list__/);
assert.match(hausa['globalSearch-instructions-notes-3'], /\*AND\*/);
assert.deepEqual(tokens(hausa['import-dependencies-done']),
  ['__imported__', '__unmatched__']);
assert.deepEqual(tokens(hausa['background-too-big']), ['{{size}}']);
assert.equal(hausa['dependency-type-blocks'], 'Yana hana');
assert.deepEqual(tokens(hausa['custom-field-stringtemplate-format']), ['%{value}']);
assert.match(hausa['server-error-troubleshooting'], /sudo snap logs wekan\.wekan/);
assert.match(hausa['office-report-desc'], /IPv4.*IPv6/);
assert.match(hausa['api-no-calls'], /REST API.*WITH_API=true/);
assert.match(hausa['recovery-report-desc'], /MongoDB/);
assert.equal(hausa['ticket-number'], 'Lambar tikiti');
assert.match(hausa.Node_heap_total_heap_size, /Node/);
assert.equal(hausa['attachment-move-storage-gridfs'], 'Matsar da maƙala zuwa GridFS');
assert.equal(hausa['attachment-move-storage-s3'], 'Matsar da maƙala zuwa S3');
