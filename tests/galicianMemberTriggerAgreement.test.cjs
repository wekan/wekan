'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const d = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/gl.i18n.json')));
const template = fs.readFileSync(path.join(root, 'client/components/rules/triggers/cardTriggers.jade'), 'utf8');
for (const noun of ['member', 'assignee']) {
 const subject = noun === 'member' ? 'persoa membro' : 'persoa asignada';
 const generic = `r-when-a-${noun}`, specific = `r-when-the-${noun}`;
 assert.ok(template.includes(`{{_'${generic}'}}`));
 assert.ok(template.includes(`{{_'${specific}'}}`));
 assert.equal(d[generic], `Cando unha ${subject} é`);
 assert.equal(d[specific], `Cando a ${subject}`);
 assert.doesNotMatch(d[generic], /Cando un (membro|asignado) é/);
 for (const [key, participle] of [['r-added-to', 'Engadida a'], ['r-removed-from', 'Quitada de']]) {
  assert.equal(d[key], participle);
  assert.equal(`${d[generic]} ${d[key]} ${d['r-a-card']}`, `Cando unha ${subject} é ${participle} unha tarxeta`);
  assert.equal(`${d[specific]} Ana ${d['r-is']} ${d[key]} ${d['r-a-card']}`, `Cando a ${subject} Ana é ${participle} unha tarxeta`);
 }
}
console.log('Galician member/assignee trigger agreement: generic/specific template subjects and shared actions checked; attachment and live browser remain open');
