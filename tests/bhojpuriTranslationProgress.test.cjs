const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'bho'], { cwd: root, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 0);
const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const bhojpuri = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/bho.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(/__[A-Za-z0-9]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)].map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)].map(([tag]) => tag).sort();
for (const [key, value] of Object.entries(bhojpuri)) {
  if (value !== english[key]) assert.deepEqual(tokens(value), tokens(english[key]), key);
  assert.deepEqual(tags(value), tags(english[key]), key);
}
assert.equal(bhojpuri.accept, 'स्वीकार करीं');
assert.match(bhojpuri['act-addChecklistItem'], /जाँच-सूची.*जोड़ल गइल/);
for (const token of ['__checklistItem__', '__checklist__', '__card__', '__list__', '__swimlane__', '__board__']) {
  assert.match(bhojpuri['act-addChecklistItem'], new RegExp(token));
}
