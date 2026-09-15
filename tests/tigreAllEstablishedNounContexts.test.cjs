'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const tigre = read('tig');
const families = [
  { name: 'File', source: /\bfile\b/i, old: /ፋይል/u },
  { name: 'User', source: /\busers?\b/i, old: /ተጠቃሚ|ተጠቀምቲ/u },
  { name: 'Name', source: /\bnames?\b/i, old: /ስም|ስማት/u },
  { name: 'Label', source: /\blabels?\b/i, old: /ምልክት|ምልክታት/u },
  { name: 'Organization', source: /\borganizations?\b/i, old: /ውድብ|ውድባት|ትካላት/u },
  { name: 'Team', source: /\bteams?\b/i, old: /ጉጅለ|ጉጅለታት|ጋንታ/u },
  { name: 'Path', source: /\bpaths?\b/i, old: /መንገዲ/u },
  { name: 'Status', source: /\bstatus(?:es)?\b/i, old: /ኩነታት/u },
  { name: 'Size', source: /\bsizes?\b/i, old: /ዓቐን/u },
  { name: 'Color', source: /\bcolors?\b/i, old: /ሕብሪ/u },
  { name: 'Count', source: /\bcounts?\b/i, old: /ብዝሒ/u },
];
const counts = Object.fromEntries(families.map(({ name }) => [name, 0]));
for (const [key, value] of Object.entries(tigre)) {
  for (const family of families) {
    if (!family.source.test(english[key] || '')) continue;
    assert.doesNotMatch(value, family.old,
      `${key}: Tigrinya ${family.name} component`);
    counts[family.name] += 1;
  }
}
for (const family of families) assert.ok(counts[family.name] > 0, family.name);
assert.equal(tigre.file, 'ፈይል');
assert.equal(tigre['operator-user'], 'መትነፍዓይ');
assert.equal(tigre.name, 'ስሜት');
assert.match(tigre['add-label'], /እሻረት/u);
assert.equal(tigre['operator-org'], 'መነዘመት');
assert.equal(tigre.team, 'ፈሪቅ');
assert.equal(tigre.path, 'ገበይ');
assert.equal(tigre.status, 'ሓላት');
assert.equal(tigre.size, 'ቅያስ');
assert.equal(tigre['dependency-color'], 'ሕብር');
assert.equal(tigre['stats-count'], 'ዐደድ');
assert.match(tigre['cardDependencyIconPopup-title'], /ምልክት/u,
  'Icon remains distinct from Label');
assert.match(tigre.clipboard, /ሰሌዳ/u,
  'Clipboard remains distinct from Board');
console.log('Tigre established noun contexts:', counts);
