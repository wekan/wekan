'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'imports', 'i18n', 'data');
const read = code => JSON.parse(
  fs.readFileSync(path.join(DATA, code + '.i18n.json'), 'utf8'),
);
const en = read('en');
const hebrew = ['he', 'he-IL'];
const persian = ['fa', 'fa-IR'];
const reportKeys = [
  'officeReportTitle', 'office-report-desc', 'office-logins',
  'office-first-seen', 'office-last-seen', 'office-shared',
  'office-no-results', 'api-report-desc', 'api-calls',
  'api-first-called', 'api-last-called', 'api-no-calls',
];

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('all Hebrew and Persian tags translate every report placeholder', () => {
  for (const code of [...hebrew, ...persian]) {
    const lang = read(code);
    for (const key of reportKeys) {
      assert.equal(typeof lang[key], 'string', code + ' lacks ' + key);
      assert.notEqual(lang[key], en[key], code + ' leaves ' + key + ' in English');
    }
  }
});

test('each family uses its own right-to-left script', () => {
  for (const code of hebrew) {
    const lang = read(code);
    for (const key of reportKeys) assert.match(lang[key], /[֐-׿]/, code + ' lacks Hebrew in ' + key);
  }
  for (const code of persian) {
    const lang = read(code);
    for (const key of reportKeys) assert.match(lang[key], /[؀-ۿ]/, code + ' lacks Persian in ' + key);
  }
});

test('technical tokens remain recognizable in translated descriptions', () => {
  for (const code of [...hebrew, ...persian]) {
    const lang = read(code);
    assert.match(lang['office-report-desc'], /IPv4/);
    assert.match(lang['office-report-desc'], /IPv6/);
    assert.match(lang['api-report-desc'], /REST API/);
    assert.match(lang['api-no-calls'], /REST API/);
    assert.match(lang['api-no-calls'], /WITH_API=true/);
  }
});

test('universal API labels remain unchanged', () => {
  for (const code of [...hebrew, ...persian]) {
    const lang = read(code);
    assert.equal(lang.apiReportTitle, 'API');
    assert.equal(lang['api-endpoint'], 'API');
  }
});

console.log('\nupcomingHebrewPersianTranslations: ' + passed + ' tests passed');

const { spawnSync } = require('node:child_process');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
for (const code of persian) {
  const result = spawnSync(process.execPath, [path.join(__dirname, '../releases/translations/fill-translations.mjs'), '--list', code], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {});
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(en));
  for (const key of Object.keys(en)) assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${code}:${key}`);
  assert.match(locale['custom-field-links-hint'], /نام و نوع یکسان در هر دو کارت/);
  assert.match(locale['custom-field-links-hint'], /فقط در یکی از کارت‌ها.*بدون تغییر/);
  assert.match(locale['custom-field-link-inactive'], /دیگر نمی‌تواند هر دو کارت را ویرایش کند.*بایگانی/);
  assert.match(locale['custom-field-link-both'], /دوطرفه.*هر یک از کارت‌ها/);
  assert.match(locale['custom-field-link-send'], /یک‌طرفه.*کارت اصلی/);
  assert.match(locale['field-link-not-allowed'], /هر دو کارت را ویرایش کنید/);
  assert.equal(locale['import-members-mode-me'], 'همه را با حساب کاربری من جایگزین کن');
  assert.match(locale['import-many-boards-hint'], /بدون نگاشت اعضا/);
  assert.match(locale['import-many-boards-hint'], /خودش یک خروجی واحد است.*یک برد است/);
  assert.match(locale['export-all-boards-hint'], /اجازه دارید.*یک کتاب‌کار.*\.zip/);
  assert.match(locale['webhook-payload-description'], /تنظیم به‌ارث‌رسیده را نگه می‌دارد/);
  assert.match(locale['notification-delivery-quiet'], /تا پایان آن‌ها منتظر بمان/);
  assert.match(locale['r-wrike-workflow-note'], /Completed.*Cancelled تکمیل‌شده.*Active.*Deferred تکمیل‌نشده/);
  for (const literal of ['GET /workflows', 'Active', 'Completed', 'Deferred', 'Cancelled']) assert.ok(locale['r-wrike-workflow-note'].includes(literal));
  assert.ok(locale['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
  assert.match(locale['subtask-mark-done'], /تکمیل‌شده$/);
  assert.match(locale['subtask-mark-not-done'], /تکمیل‌نشده$/);
  assert.equal(locale['notification-delivery-part-list'], 'لیست');
  assert.equal(locale['notification-delivery-part-swimlane'], 'مسیر');
  for (const name of ['taiga', 'vikunja']) assert.match(locale[`import-board-instruction-${name}`], /پیوست‌ها وارد نمی‌شوند/);
  assert.match(locale['import-board-instruction-redmine'], /پیش از خروجی گرفتن.*My account روی انگلیسی/);
  assert.match(locale['import-board-instruction-businessmap'], /Title, Column, Lane, Owner, Deadline/);
  assert.match(locale['import-board-instruction-plane'], /توضیح یا پیوست ندارد.*وارد نمی‌شوند/);
  assert.match(locale['import-board-instruction-kanri'], /اولین برد وارد می‌شود/);
  assert.match(locale['import-board-instruction-teamwork'], /--، ## یا >> یک سطح عمیق‌تر/);
  for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) assert.ok(locale['import-board-instruction-orgmode'].includes(literal));
  assert.ok(locale['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
  assert.ok(locale['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
  for (const literal of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(locale['ldap-sync-now-nothing'].includes(literal));
  assert.match(locale['sync-planning-hint'], /اولین همگام‌سازی هرگز برنامه‌ریزی را حذف نمی‌کند/);
  assert.match(locale['login-setting-env-only'], /فقط از طریق محیط سرور.*فقط‌خواندنی/);
  assert.match(locale['stuck-sync-operation-description'], /تغییرات اعمال‌شده باقی می‌مانند/);
  assert.match(locale['stuck-sync-operation-description'], /بقیه تغییرات ذخیره‌شده هرگز نوشته نمی‌شوند/);
  assert.match(locale['stuck-sync-operation-reason-access-denied'], /کل لیست دسترسی نوشتن ندارد/);
  for (const key of ['stuck-sync-operation-replayable-now', 'stuck-sync-operation-not-stuck']) assert.match(locale[key], /نمی‌توان آن را کنار گذاشت/);
  assert.match(locale['stuck-sync-operation-replayable'], /کنار گذاشته نشد/);
  assert.match(locale['stuck-sync-operation-busy'], /هم‌اکنون در حال همگام‌سازی/);
  assert.match(locale['interrupted-import-description'], /قابل ادامه نیست.*فایل منبع نگه‌داری نمی‌شود/);
  assert.match(locale['interrupted-import-description'], /هر چیزی که پس از آن اضافه شده/);
  assert.match(locale['interrupted-import-keep-confirm'], /هیچ چیزی حذف نمی‌شود/);
  assert.match(locale['interrupted-import-discard-confirm'], /برای همیشه حذف می‌شوند/);
  assert.match(locale['interrupted-import-foreign-board'], /توسط این وارد کردن ساخته نشده.*تغییری نکرد/);
  for (const key of ['interrupted-import-truncated', 'stuck-sync-operation-truncated']) assert.match(locale[key], /۵۰ مورد قدیمی‌تر/);
}
console.log('Both full current Persian catalogs, exact tokens and import/recovery/notification meanings pass');

for (const code of hebrew) {
  const result = spawnSync(process.execPath, [path.join(__dirname, '../releases/translations/fill-translations.mjs'), '--list', code], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {});
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(en));
  for (const key of Object.keys(en)) assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${code}:${key}`);
  assert.match(locale['custom-field-links-hint'], /אותו שם ואותו סוג בשני הכרטיסים/);
  assert.match(locale['custom-field-links-hint'], /רק באחד הכרטיסים נשארים ללא שינוי/);
  assert.match(locale['custom-field-link-inactive'], /כבר אינו יכול לערוך את שני הכרטיסים.*לארכיון/);
  assert.match(locale['custom-field-link-both'], /לשני הכיוונים.*כל אחד מהכרטיסים/);
  assert.match(locale['custom-field-link-send'], /לכיוון אחד.*לכרטיס הראשי/);
  assert.match(locale['field-link-not-allowed'], /רשאים לערוך את שני הכרטיסים/);
  assert.equal(locale['import-members-mode-me'], 'החלפת כולם בחשבון המשתמש שלי');
  assert.match(locale['import-many-boards-hint'], /ללא מיפוי חברים/);
  assert.match(locale['import-many-boards-hint'], /בעצמו ייצוא אחד.*הוא לוח אחד/);
  assert.match(locale['export-all-boards-hint'], /רשאים לייצא.*כחוברת עבודה אחת.*\.zip/);
  assert.match(locale['webhook-payload-description'], /שומרת על ההגדרה שהתקבלה בירושה/);
  assert.match(locale['notification-delivery-quiet'], /להמתין עד לסיומן/);
  assert.match(locale['r-wrike-workflow-note'], /כהושלם.*Completed.*Cancelled.*וכלא הושלם.*Active.*Deferred/);
  for (const literal of ['GET /workflows', 'Active', 'Completed', 'Deferred', 'Cancelled']) assert.ok(locale['r-wrike-workflow-note'].includes(literal));
  assert.ok(locale['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
  assert.match(locale['subtask-mark-done'], /כהושלמה$/);
  assert.match(locale['subtask-mark-not-done'], /כלא הושלמה$/);
  assert.equal(locale['notification-delivery-part-list'], 'רשימה');
  assert.equal(locale['notification-delivery-part-swimlane'], 'מסלול');
  for (const name of ['taiga', 'vikunja']) assert.match(locale[`import-board-instruction-${name}`], /קבצים מצורפים אינם מיובאים/);
  assert.match(locale['import-board-instruction-redmine'], /הגדירו את השפה לאנגלית ב-My account לפני הייצוא/);
  assert.match(locale['import-board-instruction-businessmap'], /Title, Column, Lane, Owner, Deadline/);
  assert.match(locale['import-board-instruction-plane'], /אינו כולל תיאורים או קבצים מצורפים.*אינם מיובאים/);
  assert.match(locale['import-board-instruction-kanri'], /מיובא הלוח הראשון/);
  assert.match(locale['import-board-instruction-teamwork'], /בסימן -, # או >/);
  assert.match(locale['import-board-instruction-teamwork'], /--, ## או >> רמה אחת עמוק יותר/);
  for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) assert.ok(locale['import-board-instruction-orgmode'].includes(literal));
  assert.ok(locale['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
  assert.ok(locale['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
  for (const literal of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(locale['ldap-sync-now-nothing'].includes(literal));
  assert.match(locale['sync-planning-hint'], /סנכרון ראשון לעולם אינו מסיר תכנון/);
  assert.match(locale['stuck-sync-operation-description'], /שינויים שכבר הוחלו נשמרים/);
  assert.match(locale['stuck-sync-operation-description'], /יתר השינויים השמורים לעולם לא נכתבים/);
  assert.match(locale['stuck-sync-operation-reason-access-denied'], /אין הרשאת כתיבה לכל הרשימה/);
  for (const key of ['stuck-sync-operation-replayable-now', 'stuck-sync-operation-not-stuck']) assert.match(locale[key], /אי אפשר להשליך אותה/);
  assert.match(locale['stuck-sync-operation-replayable'], /היא לא הושלכה/);
  assert.match(locale['stuck-sync-operation-busy'], /מסתנכרנת כעת/);
  assert.match(locale['interrupted-import-description'], /אי אפשר להמשיך ייבוא.*קובץ המקור אינו נשמר/);
  assert.match(locale['interrupted-import-description'], /כולל כל מה שנוסף אליו מאז/);
  assert.match(locale['interrupted-import-keep-confirm'], /דבר לא מוסר/);
  assert.match(locale['interrupted-import-discard-confirm'], /יוסרו לצמיתות/);
  assert.match(locale['interrupted-import-foreign-board'], /לא נוצר על ידי הייבוא הזה.*לא שונה/);
  assert.match(locale['stuck-sync-operation-truncated'], /50 הפעולות הישנות ביותר/);
  assert.match(locale['interrupted-import-truncated'], /50 הייבואים הישנים ביותר/);
}
console.log('Both full current Hebrew catalogs, exact tokens and import/recovery/notification meanings pass');
