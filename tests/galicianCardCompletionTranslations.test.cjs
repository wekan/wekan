'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/gl.i18n.json'), 'utf8'));
const template = fs.readFileSync(path.join(root, 'client/components/rules/actions/cardActions.jade'), 'utf8');
for (const [action, key, adjective] of [
  ['markCardComplete', 'r-mark-complete', 'completa'],
  ['markCardIncomplete', 'r-mark-incomplete', 'incompleta'],
]) {
  assert.ok(template.includes(`option(value="${action}") {{_'${key}'}}`));
  assert.equal(data[key], `Marcar a tarxeta como ${adjective}`);
  assert.doesNotMatch(data[key], /cartão|cartao|\b(completo|incompleto)\b/);
}
assert.notEqual(data['r-mark-complete'], data['r-mark-incomplete']);
console.log('Galician complete/incomplete card actions: actual template wiring, native noun agreement and distinct actions verified; browser not run');
