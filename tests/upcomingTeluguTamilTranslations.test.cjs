'use strict';

// The Upcoming release completes Telugu and Tamil Office/API reports.
// Run: node tests/upcomingTeluguTamilTranslations.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const readLanguage = code => JSON.parse(fs.readFileSync(
  path.join(ROOT, 'imports/i18n/data', `${code}.i18n.json`),
  'utf8',
));
const english = readLanguage('en');
const telugu = readLanguage('te-IN');
const tamil = readLanguage('ta');
const translatedKeys = [
  'officeReportTitle', 'office-report-desc', 'office-logins',
  'office-first-seen', 'office-last-seen', 'office-shared',
  'office-no-results', 'api-report-desc', 'api-calls',
  'api-first-called', 'api-last-called', 'api-no-calls',
];

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('both languages translate every report placeholder', () => {
  for (const language of [telugu, tamil]) {
    for (const key of translatedKeys) {
      assert.notStrictEqual(language[key], english[key], `${key} is still English`);
    }
  }
});

test('each language uses its own script', () => {
  for (const key of translatedKeys) {
    assert.match(telugu[key], /\p{Script=Telugu}/u, `te-IN ${key} lacks Telugu`);
    assert.doesNotMatch(telugu[key], /\p{Script=Tamil}/u, `te-IN ${key} uses Tamil`);
    assert.match(tamil[key], /\p{Script=Tamil}/u, `ta ${key} lacks Tamil`);
    assert.doesNotMatch(tamil[key], /\p{Script=Telugu}/u, `ta ${key} uses Telugu`);
  }
});

test('technical tokens remain recognizable', () => {
  for (const language of [telugu, tamil]) {
    assert.match(language['office-report-desc'], /IPv4/);
    assert.match(language['office-report-desc'], /IPv6/);
    assert.match(language['api-report-desc'], /REST API/);
    assert.match(language['api-no-calls'], /REST API/);
    assert.match(language['api-no-calls'], /WITH_API=true/);
  }
});

test('universal API labels remain unchanged', () => {
  for (const language of [telugu, tamil]) {
    assert.strictEqual(language.apiReportTitle, 'API');
    assert.strictEqual(language['api-endpoint'], 'API');
  }
});

console.log(`\nupcomingTeluguTamilTranslations: ${passed} tests passed`);

// The current Tamil fill list includes pending feature strings. Structural
// completeness does not certify every pre-existing sentence's language.
const { execFileSync } = require('node:child_process');
assert.deepStrictEqual(JSON.parse(execFileSync(process.execPath,
  ['releases/translations/fill-translations.mjs', '--list', 'ta'],
  { cwd: ROOT, encoding: 'utf8' })), {});
assert.strictEqual(tamil['attachment-limit-unit-bytes'], 'பைட்டுகள்');
assert.match(tamil['custom-field-links-hint'], /ஒரே பெயரும் வகையும்/);
assert.match(tamil['custom-field-links-hint'], /ஓர் அட்டையில் மட்டுமே உள்ள புலங்கள் மாற்றப்படாது/);
assert.match(tamil['custom-field-link-send'], /இந்த அட்டையின் மாற்றங்கள் முதன்மை அட்டைக்குச் செல்லும்/);
assert.match(tamil['custom-field-link-receives'], /அந்த அட்டையின் மாற்றங்கள் இந்த அட்டைக்கு வரும்/);
assert.match(tamil['field-link-not-allowed'], /இரண்டு அட்டைகளையும் திருத்த.*அனுமதி/);
assert.match(tamil['custom-field-link-inactive'], /திருத்த முடியாது.*காப்பகத்தில்/);
assert.match(tamil['read-only-field'], /அனைத்து உறுப்பினர்களும்.*நிர்வாகிகள் மட்டுமே மாற்றலாம்/);
assert.match(tamil['notification-delivery-quiet'], /முடியும் வரை காத்திரு/);
assert.match(tamil['webhook-payload-description'], /மேல்நிலையிலிருந்து பெறப்பட்ட அமைப்பை வைத்திருக்கும்/);
assert.match(tamil['stuck-sync-operation-discard-confirm'], /ஏற்கனவே பயன்படுத்திய மாற்றங்கள் இருக்கும்/);
assert.match(tamil['stuck-sync-operation-discard-confirm'], /மீதமுள்ளவை ஒருபோதும் எழுதப்படாது/);
assert.match(tamil['stuck-sync-operation-not-stuck'], /கைவிட முடியாது/);
assert.match(tamil['stuck-sync-operation-replayable'], /தானாக முடியும்.*கைவிடப்படவில்லை/);
assert.match(tamil['interrupted-import-description'], /மூலக் கோப்பு வைத்திருக்கப்படாததால்.*தொடர முடியாது/);
assert.match(tamil['interrupted-import-description'], /பின்னர் சேர்க்கப்பட்டவற்றையும்/);
assert.match(tamil['interrupted-import-keep-confirm'], /எதுவும் அகற்றப்படாது/);
assert.match(tamil['interrupted-import-discard-confirm'], /அனைத்தும் நிரந்தரமாக அகற்றப்படும்/);
assert.match(tamil['interrupted-import-foreign-board'], /உருவாக்கவில்லை.*மாற்றப்படவில்லை/);
for (const key of ['stuck-sync-operation-truncated', 'interrupted-import-truncated']) {
  assert.match(tamil[key], /மிகப் பழைய 50/);
}
for (const format of ['taiga', 'vikunja', 'notion']) {
  assert.match(tamil['import-board-instruction-' + format], /இணைப்புகள் இறக்குமதி செய்யப்படாது/);
}
assert.match(tamil['import-board-instruction-quire'], /கருத்துகளும் இணைப்புகளும் இல்லை/);
assert.match(tamil['import-board-instruction-plane'], /விளக்கங்களும் இணைப்புகளும் இல்லை.*இறக்குமதி செய்யப்படாது/);
for (const format of ['nullboard', 'kanri']) {
  assert.match(tamil['import-board-instruction-' + format], /முதல் பலகை இறக்குமதி/);
}
for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) {
  assert.ok(tamil['import-board-instruction-orgmode'].includes(literal));
}
for (const literal of ['Tasklist', 'Task', 'Description', 'Assign to', 'Start date',
  'Due date', 'Priority', 'Estimated time', 'Tags', 'Status', '--', '##', '>>']) {
  assert.ok(tamil['import-board-instruction-teamwork'].includes(literal));
}
assert.match(tamil['import-board-instruction-businessmap'], /தலைப்பு வரியை ஆங்கிலத்திற்கு மாற்றவும்/);
assert.match(tamil['import-board-instruction-redmine'], /My account-இல் மொழியை English/);
assert.match(tamil['import-many-boards-hint'], /உறுப்பினர் பொருத்தமின்றி/);
assert.match(tamil['import-many-boards-hint'], /மேலே உள்ள புலத்திற்குப் பதிலாக/);
assert.match(tamil['export-all-boards-hint'], /ஒரே பணிப்புத்தகத்தில்.*ஒவ்வொரு பலகைக்கும்/);
assert.match(tamil['r-wrike-workflow-note'], /Completed அல்லது Cancelled.*முடிந்ததாகவும்.*Active அல்லது Deferred.*முடியாததாகவும்/);
for (const literal of ['GET /workflows', 'JSON']) assert.ok(tamil['r-wrike-workflow-note'].includes(literal));
for (const literal of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) {
  assert.ok(tamil['ldap-sync-now-nothing'].includes(literal));
}
assert.ok(tamil['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
assert.ok(tamil['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
assert.match(tamil['login-setting-env-only'], /சேவையகச் சூழல் மட்டுமே.*படிக்க மட்டுமே/);
assert.ok(tamil['trello-export-desc'].includes('Swimlane: …'));
assert.match(tamil['trello-export-desc'], /மீண்டும் நீச்சல்பாதைகளாக மாற்றும்/);
assert.match(tamil['trello-export-warnings'], /அனைத்தையும் ஏற்றுமதி செய்ய முடியவில்லை/);
assert.match(tamil['sandstorm-trello-access-needed'], /இணைய அணுகல் இல்லை.*முதலில்.*அனுமதிக்கவும்/);
assert.match(tamil['sandstorm-trello-access-granted'], /அணுகலாம்/);
assert.notStrictEqual(tamil['sandstorm-trello-access-needed'], tamil['sandstorm-trello-access-granted']);

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  assert.deepStrictEqual(Object.keys(tamil), Object.keys(english));
  for (const key of Object.keys(english)) {
    assert.deepStrictEqual(translationTokens(tamil[key]), translationTokens(english[key]), key);
  }
  const i18n = require('i18next').createInstance();
  await i18n.init({ lng: 'ta', fallbackLng: 'en', initImmediate: false,
    interpolation: { prefix: '__', suffix: '__', escapeValue: false },
    resources: { en: { translation: english }, ta: { translation: tamil } } });
  assert.strictEqual(i18n.t('notification-group-card', { count: 3, card: 'சோதனை' }), 'சோதனை அட்டையில் 3 அறிவிப்புகள்');
  assert.strictEqual(i18n.t('stuck-sync-operation-applied', { applied: 0, total: 2 }), '2 மாற்றங்களில் 0 பயன்படுத்தப்பட்டன');
  assert.strictEqual(i18n.t('interrupted-import-state-failed', { stage: 'createCards', error: 'E_TEST' }),
    'createCards நிலையில் E_TEST பிழையால் தோல்வியடைந்தது');
  console.log('Tamil: full fill inventory, source tokens, selected semantic meanings and runtime interpolation pass');
})().catch(error => { console.error(error); process.exitCode = 1; });

for (const key of ['board-view-cal', 'board-view-calendar-mode', 'board-view-multiboard-cal', 'export-ical-feed', 'calendar']) {
  assert.match(tamil[key], /நாள்காட்டி/);
  assert.doesNotMatch(tamil[key], /நாள்கட்டி/);
}
for (const value of Object.values(tamil)) assert.ok(!value.includes('நாள்கட்டி'));
