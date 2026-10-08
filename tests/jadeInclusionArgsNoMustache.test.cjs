'use strict';
// Spacebars does not evaluate {{...}} inside an argument string of a template
// inclusion: `+dateBadgeBody(showTitle="{{_ 'card-due'}}")` passed the text
// "{{_ 'card-due'}}" itself, and every minicard date badge's title read
// "{{_ 'card-due'}} week 41" (seen by the #6750 browser spec's snapshot). A
// translated argument is passed as a key (titleKey="card-due") and translated
// in the included template.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SHAPE = /^\s*\+[\w.-]+\([^)]*=\s*"[^"]*\{\{/;
function jadeFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) jadeFiles(full, out); else if (entry.name.endsWith('.jade')) out.push(full);
  }
  return out;
}
const root = path.resolve(__dirname, '..');
const offenders = [];
for (const dir of ['client', 'packages']) {
  if (!fs.existsSync(path.join(root, dir))) continue;
  for (const file of jadeFiles(path.join(root, dir))) {
    fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (SHAPE.test(line)) offenders.push(`${path.relative(root, file)}:${i + 1}`);
    });
  }
}
assert.deepEqual(offenders, [], 'pass a key and translate it inside the included template');

// The minicard date badges pass keys, and the badge translates them.
const cardDate = fs.readFileSync(path.join(root, 'client/components/cards/cardDate.jade'), 'utf8');
for (const key of ['card-received', 'card-start', 'card-due', 'card-end', 'date']) {
  assert.ok(cardDate.includes(`titleKey="${key}"`), key);
}
assert.equal((cardDate.match(/\{\{#if titleKey\}\}\{\{_ titleKey\}\}\{\{else\}\}\{\{showTitle\}\}\{\{\/if\}\}/g) || []).length, 2);

// Negative: the guard recognises the broken form.
assert.ok(SHAPE.test(`  +dateBadgeBody(canModifyCard=canModifyCard showTitle="{{_ 'card-due'}}" baseClass="card-date")`));
assert.ok(!SHAPE.test('  +dateBadgeBody(canModifyCard=canModifyCard titleKey="card-due" baseClass="card-date")'));
assert.ok(!SHAPE.test(`    a.js-edit-date(title="{{showTitle}}")`), 'element attributes may use {{...}}');

console.log('jadeInclusionArgsNoMustache: no inclusion passes a {{...}} argument string');
