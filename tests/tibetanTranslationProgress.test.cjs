const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'bo'], { cwd: root, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 0);
const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const tibetan = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/bo.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(/__[A-Za-z0-9]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)].map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)].map(([tag]) => tag).sort();
for (const [key, value] of Object.entries(tibetan)) {
  if (value !== english[key]) assert.deepEqual(tokens(value), tokens(english[key]), key);
  assert.deepEqual(tags(value), tags(english[key]), key);
}
assert.equal(tibetan.accept, 'ངོས་ལེན།');
assert.equal(tibetan['cron-job-delete-failed'], 'དུས་བཀག་ལས་འགན་སུབ་མ་ཐུབ།');
assert.match(tibetan['database-migration-description'], /MongoDB/);
assert.match(tibetan['database-migration-description'], /FerretDB v1 \(SQLite\)/);
assert.match(tibetan['database-migration-description'], /WEKAN_FERRETDB_URL \/ WEKAN_MONGODB_URL/);
assert.match(tibetan['database-migration-confirm'], /__db__/);
assert.match(tibetan['cards-loading-description'], /CARDS_LOADING \(all\/lazy\/auto\)/);
assert.match(tibetan['always-show-code-as-text-description'], /<!-- -->/);
assert.match(tibetan['backup-description'], /backup\/YYYY\/MM\/DD\/HH_MM_SS\/backup\.zip/);
assert.equal(tibetan['backup-frequency-daily'], 'ཉིན་རེ།');
assert.match(tibetan['gcs-permissions-note'], /client_email/);
assert.match(tibetan['gcs-credentials-menu-path'], /IAM & Admin/);
assert.equal(tibetan['gridfs-enabled'], 'GridFS སྤྱོད་ཆོག');
assert.match(tibetan['s3-region-description'], /us-east-1/);
assert.match(tibetan['restore-lost-cards-migration-description'], /swimlaneId/);
assert.match(tibetan['restore-lost-cards-migration-description'], /listId/);
assert.equal(tibetan['cpu-cores'], 'CPU སྙིང་པོ།');
assert.equal(tibetan['step-fix-file-urls'], 'ཡིག་ཆ་ URL ཉམས་གསོ་བཞིན་པ།');
assert.equal(tibetan['migration-cpu-threshold'], 'CPU མཚམས་ཚད་ (%)།');
assert.match(tibetan['migration-delay-ms-description'], /100-10000/);
assert.match(tibetan['repair-broken-cards-done-unfixable'], /__fixed__/);
assert.match(tibetan['repair-broken-cards-done-unfixable'], /__unfixable__/);
assert.match(tibetan['globalSearch-instructions-operator-number'], /__operator_number__:<number>/);
assert.match(tibetan['act-addChecklistItem'], /ཞིབ་བཤེར་ཐོ.*ཁ་སྣོན/);
for (const token of ['__checklistItem__', '__checklist__', '__card__', '__list__', '__swimlane__', '__board__']) {
  assert.match(tibetan['act-addChecklistItem'], new RegExp(token));
}
