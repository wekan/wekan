// Azerbaijani checks the full current fill list; the other languages retain
// their earlier catalog gate until their newer feature strings are filled.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const languages = ['az-AZ', 'az-LA', 'az', 'hr', 'pl-PL', 'pl', 'sk'];
const locales = {};
for (const language of languages) {
  const result = spawnSync(process.execPath, [fillScript, ...(language.startsWith('az') ? [] : ['--completed-catalog']), '--list', language], {
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
  // Preserve distinctions that affect permissions, data loss and link direction.
  assert.match(data['custom-field-link-sends'], /Bu kartdakı.*həmin karta/);
  assert.match(data['custom-field-link-receives'], /Həmin kartdakı.*bu karta/);
  assert.match(data['field-link-not-allowed'], /Hər iki kartı redaktə/);
  assert.match(data['custom-field-link-inactive'], /artıq hər iki kartı redaktə edə bilmir.*arxivləşdirilib/);
  assert.match(data['read-only-field'], /bütün üzvlər görür, yalnız lövhə inzibatçıları dəyişir/);
  assert.match(data['webhook-payload-description'], /miras alınmış parametri saxlayır/);
  assert.match(data['notification-delivery-quiet'], /bitənədək gözləyin/);
  assert.match(data['stuck-sync-operation-discard-confirm'], /dəyişikliklər saxlanır; qalanları heç vaxt yazılmır/);
  assert.match(data['stuck-sync-operation-not-stuck'], /ləğv edilə bilməz/);
  assert.match(data['stuck-sync-operation-replayable'], /özü tamamlanacaq.*ləğv edilmədi/);
  assert.match(data['interrupted-import-description'], /faylı saxlanmadığı üçün idxalı davam etdirmək mümkün deyil/);
  assert.match(data['interrupted-import-description'], /sonradan əlavə edilənlər də daxil olmaqla/);
  assert.match(data['interrupted-import-keep-confirm'], /Heç nə silinmir/);
  assert.match(data['interrupted-import-discard-confirm'], /hər şey birdəfəlik silinir/);
  assert.match(data['interrupted-import-foreign-board'], /yaradılmayıb.*toxunulmayıb/);
  assert.match(data['scrum-import-into-board-hint'], /təkrar yaradılmır/);
  assert.match(data['scrum-import-into-board-hint'], /uyğun gəlməyən kartlar.*dəyişməz qalır/);
  assert.match(data['scrum-import-card-on-another-board'], /başqa lövhəyə aiddir və dəyişməz saxlanılıb/);
  assert.match(data['scrum-import-sprint-finished'], /bitmiş sprintə köçürülmədi/);
  assert.match(data['sync-planning-hint'], /ilk sinxronlaşdırma heç vaxt planlaşdırmanı silmir/);
  assert.match(data['sync-planning-hint'], /dəyişikliyi mənbədə.*dəyişənədək saxlanır/);
  assert.match(data['scrum-history-checkpoint-hint'], /yalnız həmin qeydləri sonradan başqa heç kim dəyişməyibsə/);
  assert.match(data['scrum-history-checkpoint-hint'], /heç bir qeydi dəyişmir/);
  assert.match(data['scrum-history-checkpoint-discard-confirm'], /artıq yazdığı dəyişikliklər də daxil olmaqla/);
  assert.match(data['scrum-history-checkpoint-ask-admin'], /Lövhə inzibatçısı/);
  for (const key of ['stuck-sync-operation-truncated', 'interrupted-import-truncated']) assert.match(data[key], /ən köhnə 50/);
  for (const format of ['taiga', 'vikunja']) assert.match(data['import-board-instruction-' + format], /Qoşmalar idxal edilmir/);
  assert.match(data['import-board-instruction-notion'], /Əlaqələr, şəkillər və qoşmalar idxal edilmir/);
  assert.match(data['import-board-instruction-quire'], /şərhlər və qoşmalar yoxdur/);
  assert.match(data['import-board-instruction-plane'], /təsvirlər və qoşmalar yoxdur.*idxal edilmir/);
  for (const format of ['nullboard', 'kanri']) assert.match(data['import-board-instruction-' + format], /ilk lövhə.*idxal edilir/);
  for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) assert.ok(data['import-board-instruction-orgmode'].includes(literal));
  for (const literal of ['Tasklist', 'Task', 'Description', 'Assign to', 'Start date', 'Due date', 'Priority', 'Estimated time', 'Tags', 'Status', '--', '##', '>>']) assert.ok(data['import-board-instruction-teamwork'].includes(literal));
  assert.match(data['import-board-instruction-businessmap'], /başlıq sətrini ingiliscəyə dəyişin/);
  assert.match(data['import-board-instruction-redmine'], /My account bölməsində dili English/);
  assert.match(data['import-many-boards-hint'], /üzvlər uyğunlaşdırılmadan/);
  assert.match(data['import-many-boards-hint'], /yuxarıdakı sahə əvəzinə/);
  assert.match(data['r-wrike-workflow-note'], /Completed və ya Cancelled.*tamamlanmış, Active və ya Deferred.*tamamlanmamış/);
  for (const literal of ['GET /workflows', 'JSON']) assert.ok(data['r-wrike-workflow-note'].includes(literal));
  for (const literal of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(data['ldap-sync-now-nothing'].includes(literal));
  assert.ok(data['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
  assert.ok(data['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
  assert.match(data['login-setting-env-only'], /yalnız serverin mühit.*yalnız oxumaq/);
  assert.ok(data['trello-export-desc'].includes('Swimlane: …'));
  assert.match(data['trello-export-desc'], /yenidən üzgüçülük zolaqlarına/);
  assert.match(data['trello-export-warnings'], /mümkün olmadı/);
  assert.match(data['sandstorm-trello-access-needed'], /İnternet bağlantısı yoxdur.*Əvvəlcə.*icazə verin/);
  assert.match(data['sandstorm-trello-access-granted'], /qoşula bilər/);
  for (const literal of ['Ctrl', 'Cmd']) assert.ok(data['scrum-releases-select-help'].includes(literal));
  assert.equal(data['attachment-limit-unit-bytes'], 'Bayt');
  assert.equal(data['s3-bucket'], 'S3 yaddaş konteyneri');
  assert.equal(data['s3-port'], 'S3 portu');
  for (const key of ['r-of', 'of']) assert.equal(`1 ${data[key]} 3`, '1 / 3');
  assert.equal(data['blockly-ANNOUNCE_MOVE_OF'].replace('%1', 'giriş').replace('%2', 'blok'), 'blok daxilində giriş');
  assert.equal(data['blockly-FIELD_BITMAP_PIXEL_ON'], 'yandırılıb');
  assert.equal(data['blockly-FIELD_BITMAP_PIXEL_OFF'], 'söndürülüb');
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
    assert.equal(i18n.t('notification-group-card', { count: 3, card: 'Sınaq' }), 'Sınaq kartında 3 bildiriş');
    assert.equal(i18n.t('stuck-sync-operation-applied', { applied: 0, total: 2 }), '2 dəyişiklikdən 0 tətbiq edilib');
    assert.equal(i18n.t('interrupted-import-state-failed', { stage: 'createCards', error: 'E_TEST' }), 'createCards mərhələsində E_TEST xətası ilə uğursuz olub');
    assert.equal(i18n.t('scrum-history-checkpoint-counts', { applied: 1, total: 3, pending: 0, conflicted: 2 }), '3 dəyişiklikdən 1 yazılıb, 0 yazılmayıb, 2 isə sonradan başqa şəxs tərəfindən dəyişdirilib.');

  }
  console.log('Azerbaijani full fill list, terminology, permissions, recovery meanings, literals and runtime interpolation pass');
})().catch(error => { console.error(error); process.exitCode = 1; });
