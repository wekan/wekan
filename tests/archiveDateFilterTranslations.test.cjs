'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const en = read('en');
// Native decimal digits express the same bounds; query literals remain exact.
const digits = value => value.replace(/[۰-۹०-९০-৯]/g, digit => {
  const point = digit.codePointAt(0);
  const zero = [0x06f0, 0x0966, 0x09e6].find(start => point >= start && point <= start + 9);
  return String(point - zero);
}).match(/\d+/g);

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
const locales = fs.readdirSync(path.join(__dirname, '../imports/i18n/data')).filter(file => file.endsWith('.i18n.json') && !/^en(?:[-_]|\.)/.test(file)).map(file => file.replace('.i18n.json', ''));
const pending = JSON.parse(fs.readFileSync(path.join(__dirname, '../releases/translations/pending-transifex.json'), 'utf8')).keys.map(entry => entry.key);
for (const key of keys.slice(0, 3)) assert.ok(!pending.includes(key), `${key}: completed key leaves pending queue`);
for (const code of locales) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(en), `${code}: source key order`);
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${code}:${key}: nonempty`);
    assert.notEqual(locale[key], en[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${code}:${key}: exact placeholders`);
    assert.deepEqual(digits(locale[key]), digits(en[key]), `${code}:${key}: numeric bounds`);
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
for (const [code, script] of [['bo', /\p{Script=Tibetan}/u], ['ks', /\p{Script=Arabic}/u], ['ti', /\p{Script=Ethiopic}/u]]) {
  for (const key of keys) assert.match(read(code)[key], script, `${code}:${key}: native script`);
}
assert.match(read('bo')['auto-archive-hint'], /ནམ་ཡང.*མི་སྤོ/);
assert.match(read('bo')['filter-recency-day'], /འདས་པའི/);
assert.match(read('bo')['filter-column-age-hint'], /བསྐྱར་དུ་མི་འགོ་ཚུགས/);
assert.match(read('bua')['auto-archive-hint'], /хэзээдэшье архивта зөөгдэхэгүй/);
assert.match(read('bua')['filter-column-age-hint'], /дахин эхилхэгүй/);
assert.match(read('cv')['auto-archive-hint'], /нихӑҫан та архива куҫармаҫҫӗ/);
assert.match(read('cv')['filter-column-age-hint'], /ҫӗнӗрен пуҫлатмасть/);
assert.match(read('ks')['auto-archive-hint'], /نہٕ زانہہ/);
assert.match(read('ks')['filter-column-age-hint'], /چھِ نہٕ/);
assert.match(read('ti')['auto-archive-hint'], /ፈጺሞም.*ኣይግዕዙን/);
assert.match(read('ti')['filter-column-age-hint'], /ኣይጅምሮን/);
assert.match(read('gv')['auto-archive-hint'], /cha bee sampleyryn.*dy bragh/);
assert.match(read('gv')['filter-column-age-hint'], /Cha vel reaghey kaart cur toshiaght noa/);
assert.match(read('ve-CC')['auto-archive-hint'], /no i vien mai archiviài/);
assert.match(read('ve-CC')['filter-column-age-hint'], /no fa ripartir/);
assert.match(read('ve-PP')['auto-archive-hint'], /ei nikonz sirdeta/);
assert.match(read('ve-PP')['filter-column-age-hint'], /ei algata uzin/);
assert.match(read('ve')['auto-archive-hint'], /a dzi iswi.*na luthihi/);
assert.match(read('ve')['filter-column-age-hint'], /a zwi thomi hafhu/);
assert.match(read('ve')['filter-recency-day'], /awara/);
assert.doesNotMatch(read('ve')['filter-due-next-month'], /Inyanga|ngenyanga/);
assert.match(read('gn')['auto-archive-hint'], /araka'eve ndojeguerahái/);
assert.match(read('gn')['filter-column-age-hint'], /nomoñepyrũjeýi/);
assert.match(read('ee')['auto-archive-hint'], /womeʋua.*gbeɖe o/);
assert.match(read('ee')['filter-column-age-hint'], /mewɔa.*egɔme o/);
assert.match(read('wo')['auto-archive-hint'], /duñu yóbbu.*mukk/);
assert.match(read('wo')['filter-column-age-hint'], /du tàmbaliwaat/);
assert.match(read('ff')['auto-archive-hint'], /mbaɗaaka.*hay sahaa/);
assert.match(read('ff')['filter-column-age-hint'], /fuɗɗintaako/);
assert.match(read('tlh')['auto-archive-hint'], /not chenmoHmeH ghantoHmey/);
assert.match(read('tlh')['filter-column-age-hint'], /taghqa'moHbe'lu'/);
assert.match(read('tlh')['filter-due-previous-week'], /Hogh rInpu'bogh/);
assert.match(read('tlh')['filter-due-next-month'], /jar veb/);
assert.match(read('ay')['auto-archive-hint'], /janipuniw imañaru apatakiti/);
assert.match(read('ay')['filter-column-age-hint'], /janiw.*mayamp qalltaykiti/);
assert.match(read('qu')['auto-archive-hint'], /manam hayk'aqpas waqaychanaman apakunchu/);
assert.match(read('qu')['filter-column-age-hint'], /manam.*musuqmanta qallarichinchu/);
assert.equal(read('ay').week, 'Simana');
assert.equal(read('ay').month, 'Phaxsi');
assert.equal(read('qu').days, "P'unchawkuna");
assert.equal(read('qu').month, 'Killa');
assert.match(read('ak')['auto-archive-hint'], /wɔmfa nhwɛsoɔ nkɔ adekorabea da/);
assert.match(read('ak')['filter-column-age-hint'], /mma.*mfi ase bio/);
assert.match(read('lg')['auto-archive-hint'], /tebitwalibwa mu tterekero n’akatono/);
assert.match(read('lg')['filter-column-age-hint'], /tekutandika bupya/);
assert.equal(read('ak').days, 'Nna');
assert.equal(read('ak').list, 'Din a wɔahyehyɛ');
assert.notEqual(read('ak').list, read('ak').template);
assert.match(read('ace')['auto-archive-hint'], /klise hana tom dipeusimpan/);
assert.match(read('ace')['filter-column-age-hint'], /hana diitông phon lom/);
assert.match(read('bm')['auto-archive-hint'], /misaliw tɛ bila marayɔrɔ la abada/);
assert.match(read('bm')['filter-column-age-hint'], /tɛ.*daminɛ kokura/);
assert.equal(read('ace').days, 'uroe');
assert.match(read('sah')['auto-archive-hint'], /халыыптар хаһан да архыыпка көһөрүллүбэттэр/);
assert.match(read('sah')['filter-column-age-hint'], /саҥаттан саҕалаабат/);
assert.match(read('sah')['filter-due-previous-week'], /Ааспыт нэдиэлэҕэ/);
assert.match(read('sah')['filter-due-next-month'], /Кэлэр ыйга/);
assert.match(read('vo')['auto-archive-hint'], /rots neai paragivons/);
assert.match(read('vo')['filter-column-age-hint'], /no primükon denu/);
assert.equal(read('vo').date, 'Dät');
assert.equal(read('vo').week, 'Vig');
assert.equal(read('vo').month, 'Mul');
assert.match(read('nah')['auto-archive-hint'], /neixcuitiltin ayic mohuicah pixcalco/);
assert.match(read('nah')['filter-column-age-hint'], /amo occeppa quipehualtia/);
assert.match(read('nah')['filter-due-previous-week'], /chicomeilhuitl tlen opanoc/);
assert.match(read('nah')['filter-due-next-month'], /metztli tlen huallauh/);
assert.match(read('kl')['auto-archive-hint'], /qaquguluunniit toqqorsivimmut nuunneqanngillat/);
assert.match(read('kl')['filter-column-age-hint'], /nutaamik aallartitsinngilaq/);
assert.match(read('kl')['filter-due-previous-week'], /Sapaatip akunnerani kingullermi/);
assert.match(read('kl')['filter-due-next-month'], /Qaammatip tulliani/);
assert.match(read('dz')['auto-archive-hint'], /ནམ་ཡང་ཡིག་མཛོད་ནང་མི་སྤོ/);
assert.match(read('dz')['filter-column-age-hint'], /ལོག་འགོ་མི་བཙུགས/);
assert.match(read('dz')['filter-due-previous-week'], /ཧེ་མའི་བདུན་ཕྲག/);
assert.match(read('dz')['filter-due-next-month'], /ཤུལ་མའི་ཟླཝ/);
assert.notEqual(read('dz')['auto-archive-hint'], read('bo')['auto-archive-hint']);
assert.match(read('tig')['auto-archive-hint'], /አበደን ኢትትሐዝ/);
assert.match(read('tig')['filter-column-age-hint'], /ምን ሐዲስ ኢለብድእ/);
assert.match(read('tig')['filter-due-previous-week'], /ለሐልፈ እስቡዕ/);
assert.match(read('tig')['filter-due-next-month'], /ለመጽእ ወርሕ/);
assert.notEqual(read('tig')['auto-archive-hint'], read('ti')['auto-archive-hint']);
assert.match(read('zgh')['auto-archive-hint'], /ⵓⵔ ⵜⵜⵡⴰⵙⵎⵓⵜⵜⵉⵏ.*ⴰⴱⴰⴷⴰⵏ/);
assert.match(read('zgh')['filter-column-age-hint'], /ⵓⵔ ⵉⵙⵙⵏⵜⴰⵢ ⴷⴰⵖ/);
for (const key of keys) {
  const prose = read('zgh')[key].replace(/@endAt >= '2026-01-01'|@endAt = none|@[A-Za-z]+/g, '');
  assert.match(prose, /[\u2D30-\u2D7F]/, `zgh:${key}: Tifinagh prose`);
  assert.doesNotMatch(prose, /[A-Za-z]/, `zgh:${key}: no Latin fallback`);
}
assert.match(read('wal')['auto-archive-hint'], /leemisuwatu mulekka.*efettokkona/);
assert.match(read('wal')['filter-column-age-hint'], /naa’anta doommissenna/);
assert.match(read('wal')['filter-due-previous-week'], /Aadhdhida saaminttan/);
assert.match(read('wal')['filter-due-next-month'], /Kaalliya aginan/);
assert.equal(read('wal').days, 'Gallassata');
assert.equal(read('wal').week, 'Saaminttaa');
assert.equal(read('wal').month, 'Aginaa');
assert.match(read('iu')['auto-archive-hint'], /ᖃᖓᒃᑯᑐᐃᓐᓇᖅ ᑐᖅᑯᕐᕕᒻᒧᑦ ᓅᑕᐅᙱᓚᑦ/);
assert.match(read('iu')['filter-column-age-hint'], /ᐱᒋᐊᖅᑎᑦᑎᒃᑲᓐᓂᙱᓚᖅ/);
assert.match(read('iu')['filter-due-previous-week'], /ᐊᓂᒍᖅᑐᒥ/);
assert.match(read('iu')['filter-due-next-month'], /ᐊᒡᒋᖅᑐᒥ/);
for (const key of keys) {
  const prose = read('iu')[key].replace(/@endAt >= '2026-01-01'|@endAt = none|@[A-Za-z]+/g, '');
  assert.match(prose, /[\u1400-\u167F]/, `iu:${key}: syllabic prose`);
  assert.doesNotMatch(prose, /[A-Za-z]/, `iu:${key}: no Latin fallback`);
}
assert.match(read('chr')['auto-archive-hint'], /ᎥᏝ ᎢᏳᏍᏗ.*ᏱᎨᎦᏅᎦ/);
assert.match(read('chr')['filter-column-age-hint'], /ᎥᏝ ᏔᎵᏁ ᏯᎴᏂᏍᎪ/);
assert.match(read('chr')['filter-due-previous-week'], /ᎠᎵᏱᎵᏒ/);
assert.match(read('chr')['filter-due-next-month'], /ᎠᏓᎾᏅ/);
for (const key of keys) {
  const prose = read('chr')[key].replace(/@endAt >= '2026-01-01'|@endAt = none|@[A-Za-z]+/g, '');
  assert.match(prose, /[\u13A0-\u13FF]/, `chr:${key}: Cherokee prose`);
  assert.doesNotMatch(prose, /[A-Za-z]/, `chr:${key}: no English fallback`);
}
console.log(`Archiving and date filters: 23 messages in ${locales.length} locales passed`);
