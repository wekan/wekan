'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const en = read('en');
const keys = [
  "auto-archive-days",
  "auto-archive-off",
  "auto-archive-hint",
  "filter-recency-any",
  "filter-recency-day",
  "filter-recency-week",
  "filter-recency-month",
  "filter-recency-older",
  "filter-movement-range",
  "filter-date-range-field",
  "filter-date-range-from",
  "filter-date-range-to",
  "filter-date-range-missing",
  "filter-date-range-list-entry",
  "filter-date-range-invalid",
  "filter-due-any",
  "filter-due-previous-week",
  "filter-due-next-month",
  "filter-column-age",
  "filter-column-age-disabled",
  "filter-column-age-days",
  "filter-column-age-hint",
  "advanced-filter-card-dates-hint"
];
for (const code of ['tk_TM', 'tt', 'so', 'ku', 'ckb', 'pap', 'tpi', 'bi', 'yi', 'mi', 'sm', 'haw', 'zu', 'zu-ZA', 'xh', 'ny', 'st', 'tn', 'rw', 'rn', 'or_IN', 'bho', 'mai', 'kok', 'ary', 'nso', 'nd', 'ss', 'ts', 'om', 'fj', 'to', 'hsb', 'szl', 'se', 'wa', 'wa-RR', 'wuu-Hans', 'rup']) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(en), `${code}: source key order`);
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${code}:${key}: nonempty`);
    assert.notEqual(locale[key], en[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${code}:${key}: exact placeholders`);
    assert.deepEqual(locale[key].match(/\d+/g), en[key].match(/\d+/g), `${code}:${key}: numeric bounds`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', "@endAt >= '2026-01-01'", '@endAt = none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `${code}: literal query syntax ${token}`);
  }
  assert.notEqual(locale['filter-date-range-from'], locale['filter-date-range-to'], `${code}: distinct range endpoints`);
  assert.notEqual(locale['filter-recency-month'], locale['filter-recency-older'], `${code}: within versus older than 30 days`);
  assert.notEqual(locale['filter-due-previous-week'], locale['filter-due-next-month'], `${code}: distinct due periods`);
}
assert.match(read('tk_TM')['auto-archive-hint'], /hiç wagt arhiwlenmeýär/);
assert.match(read('tt')['auto-archive-hint'], /беркайчан да архивка күчерелми/);
assert.match(read('so')['auto-archive-hint'], /waligood lama kaydiyo/);
assert.match(read('tk_TM')['filter-column-age-hint'], /täzeden başlatmaýar/);
assert.match(read('tt')['filter-column-age-hint'], /яңадан башламый/);
assert.match(read('so')['filter-column-age-hint'], /dib uma bilowdo/);
assert.match(read('ku')['auto-archive-hint'], /tu carî nayên arşîvkirin/);
assert.match(read('ckb')['auto-archive-hint'], /هەرگیز ناگوازرێنەوە/);
assert.match(read('ku')['filter-column-age-hint'], /ji nû ve nade destpêkirin/);
assert.match(read('ckb')['filter-column-age-hint'], /لە نوێوە دەست پێ ناکات/);
assert.match(read('pap')['auto-archive-hint'], /nunka ta wordu archivá/);
assert.match(read('tpi')['auto-archive-hint'], /no save putim ol templet long stua/);
assert.match(read('pap')['filter-column-age-hint'], /no ta kuminsá su tempu den e lista di nobo/);
assert.match(read('tpi')['filter-column-age-hint'], /no kirapim gen taim/);
assert.match(read('bi')['auto-archive-hint'], /ol templet oli neva go long stoa/);
assert.match(read('yi')['auto-archive-hint'], /קיינמאָל נישט אַרכיווירט/);
assert.match(read('bi')['filter-column-age-hint'], /no statem bakegen/);
assert.match(read('yi')['filter-column-age-hint'], /הייבט נישט אָן/);
assert.match(read('mi')['auto-archive-hint'], /kāore rawa ngā tātauira e purangatia/);
assert.match(read('sm')['auto-archive-hint'], /e lē teuina lava mamanu/);
assert.match(read('mi')['filter-column-age-hint'], /Kāore te whakatika kāri e tīmata anō/);
assert.match(read('sm')['filter-column-age-hint'], /e lē toe amata ai/);
assert.match(read('haw')['auto-archive-hint'], /ʻaʻole loa e waiho ʻia nā anakuhi/);
assert.match(read('haw')['filter-column-age-hint'], /ʻAʻole ka hoʻoponopono ʻana/);
for (const code of ['zu', 'zu-ZA']) {
  assert.match(read(code)['auto-archive-hint'], /izifanekiso azifakwa neze/);
  assert.match(read(code)['filter-column-age-hint'], /akuqali kabusha isikhathi/);
}
assert.match(read('xh')['auto-archive-hint'], /azifakwa kwindawo yogcino nanini na/);
assert.match(read('ny')['auto-archive-hint'], /sasungidwa konse/);
assert.match(read('xh')['filter-column-age-hint'], /akuliqalisi ngokutsha/);
assert.match(read('ny')['filter-column-age-hint'], /sikuyambiritsanso/);
assert.match(read('st')['auto-archive-hint'], /ha di iswe polokelong le ka mohla/);
assert.match(read('tn')['auto-archive-hint'], /ga di isiwe kwa polokelong le ka motlha/);
assert.match(read('st')['filter-column-age-hint'], /ha ho qale nako ya yona lenaneng botjha/);
assert.match(read('tn')['filter-column-age-hint'], /ga go simolole nako ya yone mo lenaaneng sesha/);
assert.match(read('rw')['auto-archive-hint'], /ntizigera zishyirwa mu bubiko/);
assert.match(read('rn')['auto-archive-hint'], /ntizigera zishirwa mu bubiko/);
assert.match(read('rw')['filter-column-age-hint'], /ntibituma.*gitangira bundi bushya/);
assert.match(read('rn')['filter-column-age-hint'], /ntibituma.*gitangura bushasha/);
assert.match(read('or_IN')['auto-archive-hint'], /କେବେ ମଧ୍ୟ ଅଭିଲେଖାଗାରରେ ରଖାଯାଏ ନାହିଁ/);
assert.match(read('or_IN')['filter-column-age-hint'], /ପୁଣି ଆରମ୍ଭ ହୁଏ ନାହିଁ/);
assert.match(read('bho')['auto-archive-hint'], /कबो संग्रह में ना राखल जाला/);
assert.match(read('mai')['auto-archive-hint'], /कहियो संग्रह मे नहि राखल जाइत अछि/);
assert.match(read('bho')['filter-column-age-hint'], /फेर से शुरू ना होला/);
assert.match(read('mai')['filter-column-age-hint'], /फेर सँ आरम्भ नहि होइत अछि/);
assert.match(read('kok')['auto-archive-hint'], /सांचे केन्नाच संग्रहांत दवरिनात/);
assert.match(read('kok')['filter-column-age-hint'], /परतून सुरू जायना/);
assert.match(read('ary')['auto-archive-hint'], /القوالب ما كيتداروش فالأرشيف نهائيا/);
assert.match(read('ary')['filter-column-age-hint'], /ما كيعاودش يبدا حساب المدة/);
assert.match(read('nso')['auto-archive-hint'], /ga di išwe polokelong le ka mohla/);
assert.match(read('nso')['filter-column-age-hint'], /ga go thome nako ya yona lelokelelong leswa/);
assert.match(read('nd')['auto-archive-hint'], /kawayiswa esiphaleni loba nini/);
assert.match(read('ss')['auto-archive-hint'], /awayiswa esigcinweni nanini/);
assert.match(read('nd')['filter-column-age-hint'], /akuqalisi kutsha/);
assert.match(read('ss')['filter-column-age-hint'], /akucali kabusha/);
assert.match(read('ts')['auto-archive-hint'], /a ti yisiwi eka vuhlayiselo nikatsongo/);
assert.match(read('ts')['filter-column-age-hint'], /a swi sunguli nkarhi wa rona/);
assert.match(read('om')['auto-archive-hint'], /matumaa gara kuusaatti hin galan/);
assert.match(read('om')['filter-column-age-hint'], /irra deebi'ee hin jalqabsiisu/);
assert.match(read('fj')['auto-archive-hint'], /sega ni maroroi vakadua na ivakarau vakarautaki/);
assert.match(read('fj')['filter-column-age-hint'], /sega ni tekivuna tale/);
assert.match(read('to')['auto-archive-hint'], /ʻikai ʻaupito hiki ʻa e ngaahi sīpinga/);
assert.match(read('to')['filter-column-age-hint'], /ʻikai toe kamata ʻa e taimi/);
assert.match(read('hsb')['auto-archive-hint'], /předłohi so ženje njearchiwuja/);
assert.match(read('hsb')['filter-column-age-hint'], /znowa njezapočina/);
assert.match(read('szl')['auto-archive-hint'], /szablōny nigdy niy sōm archiwizowane/);
assert.match(read('szl')['filter-column-age-hint'], /niy zaczynŏ ôd nowa/);
assert.match(read('se')['auto-archive-hint'], /mállet eai goassege sirddu vuorkái/);
assert.match(read('se')['filter-column-age-hint'], /ii álggat.*ođđasit/);
assert.match(read('wa')['auto-archive-hint'], /modeles ni sont måy metous el årtchive/);
assert.match(read('wa')['filter-column-age-hint'], /ni rcmince nén/);
assert.match(read('wa-RR')['auto-archive-hint'], /mga padron diri gud iginbabalhin/);
assert.match(read('wa-RR')['filter-column-age-hint'], /diri nagpapabalik ha tinikangan/);
assert.match(read('wuu-Hans')['auto-archive-hint'], /模板绝勿会移到存档里/);
assert.match(read('wuu-Hans')['filter-column-age-hint'], /勿会重新算/);
assert.match(read('rup')['auto-archive-hint'], /modelili nu s-mutã vãrnãoarã/);
assert.match(read('rup')['filter-column-age-hint'], /nu ahurheashti di nou/);
console.log('Archiving and date filters: 23 messages in 39 locales passed');
