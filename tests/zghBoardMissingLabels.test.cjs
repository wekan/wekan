'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(
  path.join(root, `imports/i18n/data/${name}.i18n.json`), 'utf8'));
const en = read('en');
const zgh = read('zgh');
const cases = {
  'board-not-found': ['Board not found', 'ⵓⵔ ⵜⵍⵍⵉ ⵜⴰⴼⵍⵡⵉⵜ', 'لوحة مفقودة'],
  'page-not-found': ['Page not found.', 'ⵓⵔ ⵜⵍⵍⵉ ⵜⴰⵙⵏⴰ', 'صفحة غير موجودة'],
  'board-title-not-found': ["Board '%s' not found.", "ⵓⵔ ⵜⵍⵍⵉ ⵜⴰⴼⵍⵡⵉⵜ '%s'.", "Tableau '%s' non trouvé."],
  'swimlane-title-not-found': ["Swimlane '%s' not found.", "ⵓⵔ ⵉⵍⵍⴰ ⵓⴱⵔⵉⴷ '%s'.", "Couloir '%s' non trouvé."],
  'list-title-not-found': ["List '%s' not found.", "ⵓⵔ ⵜⵍⵍⵉ ⵜⴰⵍⴳⴰⵎⵜ '%s'.", "Liste '%s' non trouvée."],
  'board-view-swimlanes': ['Swimlanes', 'ⵉⴱⵔⵉⴷⵏ', 'خطوط السباحة'],
};
for (const [key, [source, value, former]] of Object.entries(cases)) {
  assert.equal(en[key], source, key);
  assert.equal(zgh[key], value, key);
  assert.notEqual(zgh[key], former, key);
  assert.equal((zgh[key].match(/%s/g) || []).length, (source.match(/%s/g) || []).length, `${key}: name placeholder`);
}
assert.match(zgh['board-title-not-found'], /ⵜⴰⴼⵍⵡⵉⵜ/);
assert.match(zgh['list-title-not-found'], /ⵜⴰⵍⴳⴰⵎⵜ/);
console.log('zghBoardMissingLabels: six native labels and placeholders verified');
