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

const attachment = template.slice(template.indexOf("{{_'r-when-a-attach'}}"), template.indexOf('div.trigger-item(title='));
assert.match(attachment, /option\(value="added"\) {{_'r-attachment-added-to'}}/);
assert.match(attachment, /option\(value="removed"\) {{_'r-attachment-removed-from'}}/);
assert.doesNotMatch(attachment, /{{_'r-(?:added-to|removed-from)'}}/, 'attachment cannot reuse feminine action labels');
for (const locale of ['gl', 'gl-ES']) {
 const data = JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${locale}.i18n.json`)));
 assert.equal(data['r-attachment-added-to'], 'Engadido a');
 assert.equal(data['r-attachment-removed-from'], 'Quitado de');
 for (const [action, value] of [['added', 'Engadido a'], ['removed', 'Quitado de']]) {
  assert.equal(`${data['r-when-a-attach']} ${data['r-is']} ${data[`r-attachment-${action === 'added' ? 'added-to' : 'removed-from'}`]} ${data['r-a-card']}`, `Cando un anexo é ${value} unha tarxeta`);
 }
}
for (const file of fs.readdirSync(path.join(root, 'imports/i18n/data')).filter(file => file.endsWith('.i18n.json'))) {
 if (['gl.i18n.json', 'gl-ES.i18n.json'].includes(file)) continue;
 const data = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data', file)));
 assert.equal(data['r-attachment-added-to'], data['r-added-to'], `${file}: preserve existing translated add action`);
 assert.equal(data['r-attachment-removed-from'], data['r-removed-from'], `${file}: preserve existing translated removal action`);
}
console.log('Galician attachment agreement: masculine attachment labels, feminine other subjects and all locale reuse verified; live browser remains open');
