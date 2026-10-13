// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const languages = ['az-AZ', 'az-LA', 'az', 'hr', 'pl-PL', 'pl', 'sk'];
const locales = {};
for (const language of languages) {
  const result = spawnSync(process.execPath, [fillScript, '--completed-catalog', '--list', language], {
    cwd: root, encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '{}\n');
  locales[language] = JSON.parse(fs.readFileSync(
    path.join(root, `imports/i18n/data/${language}.i18n.json`), 'utf8',
  ));
}
for (const language of ['az-AZ', 'az-LA', 'az']) {
  assert.equal(locales[language]['select-none'], 'Heç birini seçmə');
}
assert.equal(locales.hr['select-none'], 'Ne odaberi ništa');
for (const language of ['pl-PL', 'pl']) {
  assert.equal(locales[language]['office-logins'], 'Logowania');
}
assert.equal(locales.sk.checklist, 'Kontrolný zoznam');
assert.match(locales.sk.DDP_transport, /DDP.*DDP_TRANSPORT/);
for (const locale of Object.values(locales)) {
  assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
  assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);
}

// Azerbaijani Kanban boards are lövhə, not a council (şura); assignees
// are the people assigned, not the people doing the assignment.
for (const code of ['az', 'az-AZ', 'az-LA']) {
  const data = locales[code];
  assert.equal(data.board, 'Lövhə');
  assert.equal(data['r-board'], 'Lövhə');
  assert.equal(data['interrupted-import-board'], 'Lövhə');
  assert.equal(data['restore-board'], 'Lövhəni bərpa edin');
  assert.equal(data['schedule-board-archive'], 'Lövhənin arxivləşdirilməsini planlaşdırın');
  assert.equal(data['unmigrated-boards'], 'Köçürülməmiş lövhələr');
  assert.equal(data['createBoardPopup-title'], 'Lövhə yaradın');
  assert.equal(data['headerBarCreateBoardPopup-title'], 'Lövhə yaradın');
  assert.equal(data['linkCardToBoardPopup-title'], 'Lövhəyə keçid');
  assert.equal(data.linkCardToNewBoard, 'Bu kartdan lövhə yaradın');
  for (const key of ['assignee', 'cardAssigneePopup-title', 'cardAssigneesPopup-title', 'r-when-a-assignee', 'r-when-the-assignee']) {
    assert.equal(data[key], 'Təyin edilmiş şəxs');
  }
  assert.match(data['r-w-assignee-added'], /Təyin edilmiş şəxs əlavə edilir/);
  assert.match(data['r-w-assignee-removed'], /Təyin edilmiş şəxs silinir/);
  assert.equal(data['board-public-info'], 'Bu lövhə <strong>açıq</strong> olacaq.');
  assert.match(data['public-desc'], /hər kəs onu görə bilər.*Yalnız lövhəyə əlavə edilmiş şəxslər redaktə edə bilər/);
  assert.match(data['admin-desc'], /lövhənin parametrlərini dəyişə bilər/);
  for (const value of Object.values(data)) assert.doesNotMatch(value, /[Şş]ura|[Tt]əyinatçı/);
  for (const key of ['email-invite-text', 'push-invite-text', 'email-invite-register-text']) {
    assert.match(data[key], /lövhəsinə.*dəvət edir/);
    assert.ok(data[key].includes('__url__'));
  }
  assert.ok(data['email-invite-register-text'].includes('__icode__'));
  assert.ok(data['globalSearch-instructions-operator-assignee'].includes('`__operator_assignee__:<username>`'));
  assert.ok(data['globalSearch-instructions-operator-team'].includes('`__operator_team__:<display name|short name>`'));
  assert.ok(data['globalSearch-instructions-operator-team'].includes('*<name>*'));
}
(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const source = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json')));
  for (const code of ['az', 'az-AZ', 'az-LA']) {
    const data = locales[code];
    assert.deepEqual(Object.keys(data), Object.keys(source));
    for (const key of Object.keys(source)) assert.deepEqual(translationTokens(data[key]), translationTokens(source[key]), `${code}:${key}`);
    const i18n = require('i18next').createInstance();
    await i18n.init({ lng: code, fallbackLng: 'en', initImmediate: false,
      interpolation: { prefix: '__', suffix: '__', escapeValue: false },
      resources: { en: { translation: source }, [code]: { translation: data } } });
    assert.equal(i18n.t('act-addBoardMember', { member: 'Aysel', board: 'Sınaq' }), 'Aysel adlı üzvü Sınaq lövhəsinə əlavə etdi');
    assert.equal(i18n.t('act-removeBoardMember', { member: 'Aysel', board: 'Sınaq' }), 'Aysel adlı üzvü Sınaq lövhəsindən çıxardı');
    assert.equal(i18n.t('act-archivedBoard', { board: 'Sınaq' }), 'Sınaq lövhəsi arxivə köçürüldü');
  }
  console.log('Azerbaijani board/assignee terminology, permissions, query literals and runtime interpolation pass');
})().catch(error => { console.error(error); process.exitCode = 1; });
