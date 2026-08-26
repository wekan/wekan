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
assert.equal(Object.keys(remaining).length, 1167);

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
