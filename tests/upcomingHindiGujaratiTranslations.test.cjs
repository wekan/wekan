'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'imports', 'i18n', 'data');
const read = code => JSON.parse(
  fs.readFileSync(path.join(DATA, code + '.i18n.json'), 'utf8'),
);
const en = read('en');
const hindi = ['hi', 'hi-IN'];
const gujarati = ['gu-IN'];
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

test('all Hindi and Gujarati tags translate every report placeholder', () => {
  for (const code of [...hindi, ...gujarati]) {
    const lang = read(code);
    for (const key of reportKeys) {
      assert.equal(typeof lang[key], 'string', code + ' lacks ' + key);
      assert.notEqual(lang[key], en[key], code + ' leaves ' + key + ' in English');
    }
  }
});

test('each family uses its own Indic script', () => {
  for (const code of hindi) {
    const lang = read(code);
    for (const key of reportKeys) assert.match(lang[key], /[ऀ-ॿ]/, code + ' lacks Devanagari in ' + key);
  }
  for (const code of gujarati) {
    const lang = read(code);
    for (const key of reportKeys) assert.match(lang[key], /[઀-૿]/, code + ' lacks Gujarati in ' + key);
  }
});

test('technical tokens remain recognizable in translated descriptions', () => {
  for (const code of [...hindi, ...gujarati]) {
    const lang = read(code);
    assert.match(lang['office-report-desc'], /IPv4/);
    assert.match(lang['office-report-desc'], /IPv6/);
    assert.match(lang['api-report-desc'], /REST API/);
    assert.match(lang['api-no-calls'], /REST API/);
    assert.match(lang['api-no-calls'], /WITH_API=true/);
  }
});

test('universal API labels remain unchanged', () => {
  for (const code of [...hindi, ...gujarati]) {
    const lang = read(code);
    assert.equal(lang.apiReportTitle, 'API');
    assert.equal(lang['api-endpoint'], 'API');
  }
});

console.log('\nupcomingHindiGujaratiTranslations: ' + passed + ' tests passed');

const { spawnSync } = require('node:child_process');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
for (const code of hindi) {
  const result = spawnSync(process.execPath, [path.join(__dirname, '../releases/translations/fill-translations.mjs'), '--list', code], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {});
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(en));
  for (const key of Object.keys(en)) assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${code}:${key}`);
  assert.match(locale['custom-field-links-hint'], /समान नाम और प्रकार/);
  assert.match(locale['custom-field-links-hint'], /केवल एक कार्ड पर हैं, वे अपरिवर्तित रहते हैं/);
  assert.match(locale['custom-field-link-inactive'], /अब दोनों कार्डों को संपादित नहीं कर सकता.*संग्रहित/);
  assert.match(locale['custom-field-link-both'], /दोनों दिशाओं में.*किसी भी कार्ड/);
  assert.match(locale['custom-field-link-send'], /एक दिशा में.*मुख्य कार्ड/);
  assert.match(locale['field-link-not-allowed'], /दोनों कार्डों को संपादित करने की अनुमति/);
  assert.equal(locale['import-members-mode-me'], 'सभी को मेरे उपयोगकर्ता खाते से बदलें');
  assert.match(locale['import-many-boards-hint'], /सदस्यों का मिलान किए बिना/);
  assert.match(locale['import-many-boards-hint'], /स्वयं एक ही निर्यात है.*वह एक बोर्ड है/);
  assert.match(locale['export-all-boards-hint'], /निर्यात करने की आपको अनुमति.*एक कार्यपुस्तिका.*\.zip/);
  assert.match(locale['webhook-payload-description'], /विरासत में मिली सेटिंग बनाए रखता है/);
  assert.match(locale['notification-delivery-quiet'], /समाप्त होने तक प्रतीक्षा करें/);
  assert.match(locale['r-wrike-workflow-note'], /Completed.*Cancelled.*पूरा.*Active.*Deferred.*अधूरा/);
  for (const literal of ['GET /workflows', 'Active', 'Completed', 'Deferred', 'Cancelled']) assert.ok(locale['r-wrike-workflow-note'].includes(literal));
  assert.ok(locale['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
  assert.match(locale['subtask-mark-done'], /पूरा चिह्नित करें$/);
  assert.match(locale['subtask-mark-not-done'], /अधूरा चिह्नित करें$/);
  assert.equal(locale['notification-delivery-part-list'], 'सूची');
  assert.equal(locale['notification-delivery-part-swimlane'], 'स्विमलेन');
  for (const name of ['taiga', 'vikunja']) assert.match(locale[`import-board-instruction-${name}`], /संलग्नक आयात नहीं होते/);
  assert.match(locale['import-board-instruction-taiga'], /पहले \.json\.gz फ़ाइल को अनज़िप करें/);
  assert.match(locale['import-board-instruction-redmine'], /निर्यात करने से पहले My account में भाषा अंग्रेज़ी/);
  assert.match(locale['import-board-instruction-businessmap'], /Title, Column, Lane, Owner, Deadline/);
  assert.match(locale['import-board-instruction-plane'], /वर्णन या संलग्नक नहीं होते.*आयात नहीं होते/);
  assert.match(locale['import-board-instruction-kanri'], /पहला बोर्ड आयात होता है/);
  assert.match(locale['import-board-instruction-teamwork'], /--, ## या >> एक स्तर अधिक गहराई/);
  for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) assert.ok(locale['import-board-instruction-orgmode'].includes(literal));
  assert.ok(locale['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
  assert.ok(locale['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
  for (const literal of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(locale['ldap-sync-now-nothing'].includes(literal));
  assert.match(locale['login-setting-env-only'], /केवल सर्वर का वातावरण.*केवल पढ़ने के लिए/);
  assert.match(locale['stuck-sync-operation-description'], /पहले से लागू बदलाव बने रहते हैं/);
  assert.match(locale['stuck-sync-operation-description'], /बाकी सहेजे गए बदलाव कभी नहीं लिखे जाते/);
  assert.match(locale['stuck-sync-operation-reason-access-denied'], /पूरी सूची में लिखने का अधिकार नहीं है/);
  for (const key of ['stuck-sync-operation-replayable-now', 'stuck-sync-operation-not-stuck']) assert.match(locale[key], /त्यागा नहीं जा सकता/);
  assert.match(locale['stuck-sync-operation-replayable'], /त्यागा नहीं गया/);
  assert.match(locale['stuck-sync-operation-busy'], /अभी सिंक हो रही है/);
  assert.match(locale['interrupted-import-description'], /आयात जारी नहीं रखा जा सकता.*स्रोत फ़ाइल रखी नहीं जाती/);
  assert.match(locale['interrupted-import-description'], /बाद में जोड़ी गई हर चीज़/);
  assert.match(locale['interrupted-import-keep-confirm'], /कुछ भी नहीं हटेगा/);
  assert.match(locale['interrupted-import-discard-confirm'], /सभी सामग्री स्थायी रूप से हट जाएँगे/);
  assert.match(locale['interrupted-import-foreign-board'], /इस आयात ने नहीं बनाया था.*बदला नहीं गया/);
  assert.match(locale['stuck-sync-operation-truncated'], /सबसे पुरानी 50/);
  assert.match(locale['interrupted-import-truncated'], /सबसे पुराने 50/);
}
console.log('Both full current Hindi catalogs, exact tokens and import/recovery/notification meanings pass');
