// Basque covers the full current catalog; Uyghur retains its historical gate.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const node = process.execPath;
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');

for (const language of ['eu', 'ug']) {
  const result = spawnSync(node, [fillScript, ...(language === 'ug' ? ['--completed-catalog'] : []), '--list', language], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '{}\n');
}

const basque = JSON.parse(
  fs.readFileSync(path.join(root, 'imports/i18n/data/eu.i18n.json'), 'utf8'),
);
const uyghur = JSON.parse(
  fs.readFileSync(path.join(root, 'imports/i18n/data/ug.i18n.json'), 'utf8'),
);

assert.equal(basque['select-none'], 'Ez hautatu bat ere');
assert.match(basque['office-report-desc'], /IPv4.*IPv6/);
assert.match(basque['api-no-calls'], /REST API.*WITH_API=true/);

assert.equal(uyghur['activity-on'], '%s دا');
assert.match(uyghur['office-report-desc'], /IPv4.*IPv6/);
assert.match(uyghur['api-no-calls'], /REST API.*WITH_API=true/);
assert.match(
  uyghur['globalSearch-instructions-operator-number'],
  /__operator_number__:<number>.*<number>/,
);
assert.match(uyghur['select-none'], /[\u0600-\u06ff]/);

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
  assert.deepEqual(Object.keys(basque), Object.keys(english));
  for (const key of Object.keys(english)) {
    assert.deepEqual(translationTokens(basque[key]), translationTokens(english[key]), key);
  }
  assert.match(basque['custom-field-links-hint'], /Bi txarteletan izen eta mota bera/);
  assert.match(basque['custom-field-links-hint'], /Txartela bakar batean dauden eremuak ez dira aldatzen/);
  assert.match(basque['custom-field-link-inactive'], /ezin ditu jada bi txartelak editatu.*biltegian/);
  assert.match(basque['custom-field-link-both'], /Bi noranzkoetan.*edozein txarteletako/);
  assert.match(basque['custom-field-link-send'], /Noranzko bakarrean.*txartela nagusira/);
  assert.match(basque['field-link-not-allowed'], /Bi txartelak editatzeko baimena/);
  assert.equal(basque['import-members-mode-me'], 'Ordezkatu guztiak nire erabiltzailearekin');
  assert.match(basque['import-many-boards-hint'], /kideen esleipenik gabe/);
  assert.match(basque['import-many-boards-hint'], /Berez esportazio bakarra.*arbel bakarra da/);
  assert.match(basque['export-all-boards-hint'], /Esporta dezakezun.*lan-liburu.*\.zip/);
  assert.match(basque['webhook-payload-description'], /heredatutako ezarpena mantentzen du/);
  assert.match(basque['notification-delivery-quiet'], /itxaron amaitu arte/);
  assert.match(basque['r-wrike-workflow-note'], /osatutzat.*Completed.*Cancelled.*osatu gabetzat.*Active.*Deferred/);
  for (const literal of ['GET /workflows', 'Active', 'Completed', 'Deferred', 'Cancelled']) {
    assert.ok(basque['r-wrike-workflow-note'].includes(literal), literal);
  }
  assert.ok(basque['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
  assert.match(basque['subtask-mark-done'], /eginda$/);
  assert.match(basque['subtask-mark-not-done'], /egin gabe$/);
  assert.match(basque['stuck-sync-operation-discard-confirm'], /aldaketak mantenduko dira.*gainerakoak ez dira inoiz idatziko/);
  assert.match(basque['stuck-sync-operation-replayable'], /bere kabuz amaituko da.*ez da baztertu/);
  assert.match(basque['interrupted-import-description'], /iturburu-fitxategia ez delako gordetzen.*geroztik gehitutakoa barne/);
  assert.match(basque['interrupted-import-keep-confirm'], /Ez da ezer kentzen/);
  assert.match(basque['interrupted-import-discard-confirm'], /bertako guztia betiko kenduko dira/);
  assert.match(basque['interrupted-import-foreign-board'], /ez zuen inportazio honek sortu.*ez da ukitu/);
  for (const key of ['taiga', 'vikunja']) assert.match(basque[`import-board-instruction-${key}`], /Eranskinak ez dira inportatzen/);
  assert.match(basque['import-board-instruction-redmine'], /jarri hizkuntza ingelesez My account atalean esportatu aurretik/);
  assert.match(basque['import-board-instruction-businessmap'], /Title, Column, Lane, Owner, Deadline/);
  for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) assert.ok(basque['import-board-instruction-orgmode'].includes(literal));
  assert.match(basque['login-setting-env-only'], /Zerbitzariaren inguruneak soilik.*irakurtzeko soilik/);
  console.log('Basque current catalog, tokens, import semantics and recovery choices verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
