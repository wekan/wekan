// Latin Uzbek checks current features as well as the earlier catalog.
// The other locales retain their earlier gate until newer strings are filled.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const languages = ['ast-ES', 'cy', 'cy-GB', 'uz-AR', 'uz-LA', 'uz-UZ', 'uz'];
const locales = {};
for (const language of languages) {
  const result = spawnSync(process.execPath, [fillScript, ...(['uz', 'uz-UZ', 'uz-LA'].includes(language) ? [] : ['--completed-catalog']), '--list', language], {
    cwd: root, encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '{}\n');
  locales[language] = JSON.parse(fs.readFileSync(
    path.join(root, `imports/i18n/data/${language}.i18n.json`), 'utf8',
  ));
}
assert.equal(locales['ast-ES']['select-none'], 'Nun seleicionar nengún');
for (const language of ['cy', 'cy-GB']) {
  assert.equal(locales[language]['select-none'], 'Dewis dim');
}
for (const language of ['uz-AR', 'uz-LA', 'uz-UZ', 'uz']) {
  assert.equal(locales[language]['select-none'], 'Hech birini tanlamaslik');
}
for (const locale of Object.values(locales)) {
  assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
  assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);
}

assert.equal(locales['uz-AR']['twoFactorCode-cancel'], 'بیکار قیلیش');
assert.notEqual(locales['uz-AR']['twoFactorCode-cancel'], 'بیکر قیلیش');
assert.notEqual(locales['uz-AR']['twoFactorCode-cancel'], 'Bekor qilish');

const sourceLocale = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json')));
for (const code of ['uz','uz-LA','uz-UZ']) {
 const d = JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${code}.i18n.json`)));
 assert.match(d['cards-loading-description'], /avtomatik.*o‘lcham chegarasi.*jonli hisob/);
 assert.match(d['cards-loading-description'], /Kichik taxtalarda.*barcha kartalar/);
 assert.match(d['cards-loading-description'], /Hech narsani sozlash shart emas/);
 assert.deepStrictEqual(d['cards-loading-description'].match(/CARDS_LOADING(?:_LAZY_THRESHOLD)?/g), sourceLocale['cards-loading-description'].match(/CARDS_LOADING(?:_LAZY_THRESHOLD)?/g));
 assert.match(d['cards-loading-description'], /CARDS_LOADING \(all\/lazy\/auto\)/);
 assert.doesNotMatch(d['cards-loading-description'] + d['cards-loading-lazy-note'], /Yalqov/);
 assert.match(d['cards-loading-lazy-note'], /WIP.*Kalendar\/Jadval\/Gantt.*faqat hozirgacha.*qayta yuklang/);
}
for (const code of ['uz-LA','uz-UZ']) {
 for (const [key,value] of Object.entries(locales[code]))
  assert.doesNotMatch(value, /kengash|taxtai|taxtasingiz/i, `${code}:${key}`);
 assert.strictEqual(locales[code].linkCardToNewBoard, 'Ushbu kartadan taxta yaratish');
 assert.match(locales[code]['roadmap-empty-no-custom-fields'], /"Version".*"Release"/);
}
console.log('Latin Uzbek regional board forms and automatic card-loading guidance verified');

// These distinctions must survive translation: permissions and data-loss
// warnings must not reverse, and external formats keep their literal markers.
for (const code of ['uz', 'uz-UZ', 'uz-LA']) {
  const data = locales[code];
  for (const key of ['assignee', 'cardAssigneePopup-title', 'cardAssigneesPopup-title']) assert.equal(data[key], 'Tayinlangan shaxs');
  assert.equal(data.assignees, 'Tayinlangan shaxslar');
  assert.match(data['r-w-assignee-added'], /Tayinlangan shaxs qoʻshildi/);
  assert.match(data['r-w-assignee-removed'], /Tayinlangan shaxs olib tashlandi/);
  for (const value of Object.values(data)) assert.doesNotMatch(value, /tayinlovchi/i);
  for (const [key, operator] of [['globalSearch-instructions-operator-user', '__operator_user__'], ['globalSearch-instructions-operator-assignee', '__operator_assignee__']]) {
    assert.ok(data[key].includes(`\`${operator}:<username>\``));
    assert.ok(data[key].includes('*<username>*'));
    assert.ok(data[key].includes('*tayinlangan shaxs*'));
  }
  assert.match(data['toggle-assignees'], /1 dan 9 gacha tayinlangan shaxslarni/);
  assert.match(data['time-adjustment-note'], /jami qiymatni tahrirlagan shaxs boʻyicha guruhlangan/);
  assert.match(data['time-adjustment-note'], /alohida ish seanslari emas/);
  assert.match(data['time-adjustment-note'], /Manfiy qiymatlar tuzatishlardir/);
  assert.match(data['time-adjustment-note'], /Avval qayd etilmagan vaqtni biror shaxsga bogʻlab boʻlmaydi/);
  assert.match(data['custom-field-link-sends'], /Bu kartadagi.*oʻsha kartaga/);
  assert.match(data['custom-field-link-receives'], /Oʻsha kartadagi.*bu kartaga/);
  assert.match(data['field-link-not-allowed'], /Ikkala kartani ham tahrirlash huquqingiz/);
  assert.match(data['custom-field-link-inactive'], /endi ikkala kartani ham tahrirlay olmaydi.*arxivlangan/);
  assert.match(data['read-only-field'], /barcha aʼzolar koʻradi, faqat taxta maʼmurlari oʻzgartiradi/);
  assert.match(data['webhook-payload-description'], /meros olingan sozlamani saqlaydi/);
  assert.match(data['notification-delivery-quiet'], /tugashini kutish/);
  assert.match(data['stuck-sync-operation-discard-confirm'], /oʻzgarishlar saqlanadi; qolganlari hech qachon yozilmaydi/);
  assert.match(data['stuck-sync-operation-not-stuck'], /bekor qilib boʻlmaydi/);
  assert.match(data['stuck-sync-operation-replayable'], /oʻzi tugaydi.*bekor qilinmadi/);
  assert.match(data['interrupted-import-description'], /Manba fayli saqlanmagani uchun importni davom ettirib boʻlmaydi/);
  assert.match(data['interrupted-import-description'], /keyinchalik qoʻshilgan narsalarni ham/);
  assert.match(data['interrupted-import-keep-confirm'], /Hech narsa olib tashlanmaydi/);
  assert.match(data['interrupted-import-discard-confirm'], /hamma narsa butunlay oʻchiriladi/);
  assert.match(data['interrupted-import-foreign-board'], /yaratmagan.*tegilmagan/);
  assert.match(data['scrum-import-into-board-hint'], /takroran yaratilmaydi/);
  assert.match(data['scrum-import-into-board-hint'], /mos kelmagan kartalar.*oʻzgartirilmaydi/);
  assert.match(data['scrum-import-card-on-another-board'], /boshqa taxtaga tegishli va oʻzgartirilmagan/);
  assert.match(data['scrum-import-sprint-finished'], /tugagan sprintga koʻchirilmadi/);
  assert.match(data['sync-planning-hint'], /birinchi sinxronlash esa hech qachon rejalashtirishni olib tashlamaydi/);
  assert.match(data['sync-planning-hint'], /Mahalliy rejalashtirish oʻzgarishi.*oʻzgarguncha saqlanadi/);
  assert.match(data['scrum-history-checkpoint-hint'], /faqat keyinchalik ularni boshqa hech kim oʻzgartirmagan boʻlsa/);
  assert.match(data['scrum-history-checkpoint-hint'], /hech qaysi yozuvni oʻzgartirmaydi/);
  assert.match(data['scrum-history-checkpoint-discard-confirm'], /allaqachon yozgan oʻzgarishlar bilan birga/);
  assert.match(data['scrum-history-checkpoint-ask-admin'], /Taxta maʼmuri/);
  for (const key of ['stuck-sync-operation-truncated', 'interrupted-import-truncated']) assert.match(data[key], /eng eski 50/);
  for (const format of ['taiga', 'vikunja']) assert.match(data['import-board-instruction-' + format], /Qoʻshimchalar import qilinmaydi/);
  assert.match(data['import-board-instruction-notion'], /Aloqalar, rasmlar va qoʻshimchalar import qilinmaydi/);
  assert.match(data['import-board-instruction-quire'], /izohlar va qoʻshimchalar yoʻq/);
  assert.match(data['import-board-instruction-plane'], /tavsiflar va qoʻshimchalar yoʻq.*import qilinmaydi/);
  for (const format of ['nullboard', 'kanri']) assert.match(data['import-board-instruction-' + format], /birinchi taxta.*import qilinadi/);
  for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) assert.ok(data['import-board-instruction-orgmode'].includes(literal));
  for (const literal of ['Tasklist', 'Task', 'Description', 'Assign to', 'Start date', 'Due date', 'Priority', 'Estimated time', 'Tags', 'Status', '--', '##', '>>']) assert.ok(data['import-board-instruction-teamwork'].includes(literal));
  assert.match(data['import-board-instruction-businessmap'], /sarlavha satrini inglizchaga oʻzgartiring/);
  assert.match(data['import-board-instruction-redmine'], /My account boʻlimida tilni English/);
  assert.match(data['import-many-boards-hint'], /aʼzolarni moslamasdan/);
  assert.match(data['import-many-boards-hint'], /yuqoridagi maydon oʻrniga/);
  assert.match(data['r-wrike-workflow-note'], /Completed yoki Cancelled.*bajarilgan, Active yoki Deferred.*bajarilmagan/);
  for (const literal of ['GET /workflows', 'JSON']) assert.ok(data['r-wrike-workflow-note'].includes(literal));
  for (const literal of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(data['ldap-sync-now-nothing'].includes(literal));
  assert.ok(data['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
  assert.ok(data['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
  assert.match(data['login-setting-env-only'], /faqat server muhitidan.*faqat oʻqish/);
  assert.ok(data['trello-export-desc'].includes('Swimlane: …'));
  assert.match(data['trello-export-desc'], /yana suzish chiziqlariga/);
  assert.match(data['trello-export-warnings'], /eksport qilib boʻlmadi/);
  assert.match(data['sandstorm-trello-access-needed'], /Internet ulanishiga ega emas.*Avval.*ruxsat bering/);
  assert.match(data['sandstorm-trello-access-granted'], /ulanishi mumkin/);
  for (const literal of ['Ctrl', 'Cmd']) assert.ok(data['scrum-releases-select-help'].includes(literal));
  assert.equal(data['attachment-limit-unit-bytes'], 'Bayt');
  for (const key of ['BACKSPACE_KEY', 'CAPS_LOCK_KEY', 'COMMAND_KEY', 'CONTROL_KEY', 'ENTER_KEY', 'ESCAPE', 'INSERT_KEY', 'OPTION_KEY', 'PAGE_DOWN_KEY', 'PAGE_UP_KEY', 'PAUSE_KEY', 'SHIFT_KEY', 'SPACE_KEY', 'TAB_KEY']) {
    const k = `blockly-${key}`;
    assert.notEqual(data[k], sourceLocale[k]);
    assert.ok(data[k].endsWith(`(${sourceLocale[k]})`), `${code}:${k} physical key legend`);
  }
  assert.match(data['blockly-PAGE_UP_KEY'], /yuqoriga/);
  assert.match(data['blockly-PAGE_DOWN_KEY'], /pastga/);
  assert.match(data['blockly-BACKSPACE_KEY'], /Oldingi belgini oʻchirish/);
}
(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  for (const code of ['uz', 'uz-UZ', 'uz-LA']) {
    const data = locales[code];
    assert.deepEqual(Object.keys(data), Object.keys(sourceLocale));
    for (const key of Object.keys(sourceLocale)) assert.deepEqual(translationTokens(data[key]), translationTokens(sourceLocale[key]), `${code}:${key}`);
    const i18n = require('i18next').createInstance();
    await i18n.init({ lng: code, fallbackLng: 'en', initImmediate: false,
      interpolation: { prefix: '__', suffix: '__', escapeValue: false },
      resources: { en: { translation: sourceLocale }, [code]: { translation: data } } });
    assert.equal(i18n.t('notification-group-card', { count: 3, card: 'Sinov' }), 'Sinov kartasida 3 ta bildirishnoma');
    assert.equal(i18n.t('stuck-sync-operation-applied', { applied: 0, total: 2 }), '2 ta oʻzgarishdan 0 tasi qoʻllangan');
    assert.equal(i18n.t('interrupted-import-state-failed', { stage: 'createCards', error: 'E_TEST' }), 'createCards bosqichida E_TEST xatosi bilan amalga oshmagan');
    assert.equal(i18n.t('scrum-history-checkpoint-counts', { applied: 1, total: 3, pending: 0, conflicted: 2 }), '3 ta oʻzgarishdan 1 tasi yozilgan, 0 tasi yozilmagan va 2 tasi keyinchalik boshqa kishi tomonidan oʻzgartirilgan.');
  }
  console.log('Latin Uzbek full fill lists, recovery meanings, keyboard labels, tokens and runtime interpolation pass');
})().catch(error => { console.error(error); process.exitCode = 1; });
