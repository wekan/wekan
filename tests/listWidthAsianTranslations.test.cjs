'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const key = 'list-width-error-message';
const read = code => JSON.parse(fs.readFileSync(path.join(root,
  'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const ledger = JSON.parse(fs.readFileSync(path.join(root,
  'releases/translations/audited-corrections.json'), 'utf8'));
const cases = [
  ['am', /ቢያንስ 200 ፒክስል.*ሙሉ ቁጥር/u],
  ['as', /অন্ততঃ 200 পিক্সেলৰ পূৰ্ণসংখ্যা/u],
  ['bho', /कम से कम 200 पिक्सेल.*पूर्णांक/u],
  ['bn', /অন্তত 200 পিক্সেলের পূর্ণসংখ্যা/u],
  ['bo', /ཉུང་མཐར་ 200 pixels.*ཧྲིལ་གྲངས/u],
  ['dz', /ཉུང་མཐར་ 200 པིག་སེལ.*ཧྲིལ་གྲངས/u],
  ['gu-IN', /ઓછામાં ઓછા 200 પિક્સેલ્સનો પૂર્ણાંક/u],
  ['kn', /ಕನಿಷ್ಠ 200 ಪಿಕ್ಸೆಲ್‌ಗಳ ಪೂರ್ಣಾಂಕ/u],
  ['ks', /کم از کم 200 پکسل.*صحیح عدد/u],
  ['ml', /കുറഞ്ഞത് 200 പിക്സൽ.*പൂർണ്ണസംഖ്യ/u],
  ['mr', /किमान 200 पिक्सेलची पूर्णांक संख्या/u],
  ['my', /အနည်းဆုံး 200 ပစ်ဇယ်.*ကိန်းပြည့်/u],
  ['ne', /कम्तीमा 200 पिक्सेलको पूर्णाङ्क/u],
  ['or_IN', /ଅତିକମରେ 200 ପିକ୍ସେଲ୍‌ର ପୂର୍ଣ୍ଣ ସଂଖ୍ୟା/u],
  ['pa', /ਘੱਟੋ-ਘੱਟ 200 ਪਿਕਸਲ.*ਪੂਰਨ ਅੰਕ/u],
  ['si', /අවම වශයෙන් පික්සල් 200ක පූර්ණ සංඛ්‍යාව/u],
  ['ta', /குறைந்தது 200 பிக்சல்கள்.*முழு எண்/u],
  ['te-IN', /కనీసం 200 పిక్సెల్‌ల పూర్ణాంకం/u],
  ['th', /จำนวนเต็มอย่างน้อย 200 พิกเซล/u],
  ['ti', /እንተወሓደ 200 ፒክሰል.*ምሉእ ቁጽሪ/u],
  ['ug', /كەم دېگەندە 200 پىكسېل.*پۈتۈن سان/u],
  ['jv', /wilangan wutuh paling ora 200 piksel/u],
  ['sd', /گهٽ ۾ گهٽ 200 پڪسل.*صحيح عدد/u],
  ['ps', /لږ تر لږه 200 پکسل.*بشپړ شمېر/u],
];
assert.equal(read('en')[key],
  'List width must be a whole number of at least 200 pixels');
for (const [code, terms] of cases) {
  const value = read(code)[key];
  assert.match(value, terms, code);
  assert.doesNotMatch(value, /270|۲۷۰/u, code);
  const rows = ledger.filter(row => row.locale === code && row.key === key);
  assert.equal(rows.length, 1, `${code}: one correction record`);
  assert.match(rows[0].before, /270/u, code);
  assert.equal(rows[0].after, value, code);
}
for (const code of ['bho', 'bo', 'dz', 'ks', 'or_IN', 'si', 'ti', 'ps']) {
  assert.match(ledger.find(row => row.locale === code && row.key === key).reason,
    /low-confidence pending native grammar review/u, code);
}
assert.equal(cases.length, 24);
(async () => {
  const i18n = require('i18next').createInstance();
  await i18n.init({ lng: 'th', fallbackLng: false,
    resources: { th: { translation: read('th') } } });
  assert.equal(i18n.t(key), read('th')[key]);
  console.log(`${cases.length} Asian list-width rules and Thai runtime pass.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
