'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const directory = path.join(__dirname, '../imports/i18n/data');
const read = code => JSON.parse(fs.readFileSync(path.join(directory, `${code}.i18n.json`), 'utf8'));
const english = read('en');
const codes = ["fi", "sv", "de", "de_DE", "de-AT", "de-CH", "fr", "fr-FR", "fr-BE", "fr-CA", "fr-CH", "es", "es-AR", "es-LA", "es-CL", "es_CO", "es-CO", "es-PY", "es-PE", "es-MX", "pt", "pt-PT", "pt_PT", "pt-BR", "it", "nl", "nl-NL", "vl-SS", "ru", "ru-RU", "ru-UA", "ru_RU", "uk", "uk-UA", "pl", "pl-PL", "cs", "cs-CZ", "da", "nb", "et-EE", "hu", "ro", "ro-RO", "el", "el-GR", "tr", "id", "ms", "ms-MY", "vi", "vi-VN", "ja", "ja-JP", "ja-HI", "ko", "ko-KR", "zh-CN", "zh-Hans", "zh", "cmn", "zh_SG", "zh-GB", "zh-TW", "zh-Hant", "zh-HK", "ar", "ar-DZ", "ar-EG", "sk", "bg", "sl", "sl_SI", "hr", "bs", "sr", "mk", "lt", "lv", "be", "ca", "ca_ES", "ca@valencia", "gl", "gl-ES", "eu", "af", "af_ZA", "sq", "eo", "he", "he-IL", "fa", "fa-IR", "hi", "hi-IN", "bn", "ta", "th", "is", "ga", "cy", "cy-GB", "lb", "ka", "hy", "az", "az-AZ", "az-LA", "sw", "tl", "ur", "ne", "kn", "gu-IN", "mr", "ml", "te-IN", "pa", "gd", "mt", "oc", "jv", "ht", "la", "ha", "sn", "yo", "ig", "co", "an", "ast-ES", "kk", "ky", "tg", "mn", "uz", "uz-LA", "uz-UZ", "uz-AR", "ba", "tt", "tk_TM", "ug", "ckb", "ku", "am", "as", "or_IN", "si", "ps", "sd", "km", "km-KH", "km_KH", "my", "fo", "fy", "fy-NL", "fur", "rm", "sc", "scn", "nap", "pap", "so", "mg", "rw", "rn", "ny", "om", "zu", "zu-ZA", "xh", "st", "tn", "nso", "ss", "nd", "ts", "ve", "lg", "wo", "ak", "bm", "ee", "br", "kw", "gv", "csb", "hsb", "szl", "bi", "tpi", "mi", "sm", "to", "haw", "fj", "ve-CC", "wa"];
const keys = ["features-desc", "feature-views-table", "feature-views-table-desc", "feature-views-calendar", "feature-views-calendar-desc", "feature-views-time", "feature-views-time-desc", "feature-views-overview", "feature-views-overview-desc", "feature-views-gantt", "feature-views-gantt-desc", "feature-views-scrum", "feature-views-scrum-desc", "feature-views-flow-charts", "feature-views-flow-charts-desc", "feature-views-map", "feature-views-map-desc", "feature-awaiting-approval", "feature-approval-required", "feature-preview-admins", "feature-pilot-users", "feature-pilot-users-placeholder", "feature-pilot-users-unknown", "feature-saved"];

for (const code of codes) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(english), `${code}: source order`);
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${code}:${key}: nonempty`);
    assert.notEqual(locale[key], english[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['features-desc'], /WeKan/, `${code}: installation scope`);
  assert.match(locale['feature-approval-required'], /WeKan/, `${code}: future update policy`);
  assert.notEqual(locale['feature-preview-admins'], locale['feature-pilot-users'], `${code}: distinct audiences`);
  assert.notEqual(locale['feature-saved'], locale['feature-pilot-users-unknown'], `${code}: unknown-user feedback`);
  assert.notEqual(locale['feature-views-table'], locale['feature-views-map'], `${code}: distinct views`);
}
// Visibility is not deletion or a permission grant. Preserve the explicit
// assurances, and distinguish future-update approval from current visibility.
assert.match(read('fi')['features-desc'], /tiedot säilyvät.*käyttöoikeudet.*muutu/);
assert.match(read('sv')['features-desc'], /data behålls.*inga behörigheter ändras/);
assert.match(read('de')['features-desc'], /Daten bleiben erhalten.*Berechtigungen.*nicht/);
assert.match(read('fr')['features-desc'], /données sont conservées.*aucune permission/);
assert.match(read('es')['features-desc'], /datos se conservan.*no cambia ningún permiso/);
assert.match(read('ja')['features-desc'], /データは保持.*権限は変更されません/);
assert.match(read('zh-CN')['features-desc'], /数据会保留.*权限不会更改/);
assert.match(read('fi')['feature-approval-required'], /päivitysten.*kunnes ylläpitäjä/);
assert.match(read('de')['feature-approval-required'], /Updates.*bis ein Administrator/);
assert.match(read('pt-PT')['feature-pilot-users'], /Utilizadores/);
assert.match(read('pt-BR')['feature-pilot-users'], /Usuários/);
assert.match(read('zh-TW')['feature-pilot-users'], /使用者/);
assert.match(read('zh-CN')['feature-pilot-users'], /用户/);
for (const [code, script] of [
  ['ka', /\p{Script=Georgian}/u], ['hy', /\p{Script=Armenian}/u],
  ['ur', /\p{Script=Arabic}/u], ['ne', /\p{Script=Devanagari}/u],
  ['kn', /\p{Script=Kannada}/u],
  ['gu-IN', /\p{Script=Gujarati}/u], ['mr', /\p{Script=Devanagari}/u],
  ['ml', /\p{Script=Malayalam}/u], ['te-IN', /\p{Script=Telugu}/u],
  ['pa', /\p{Script=Gurmukhi}/u],
  ['kk', /\p{Script=Cyrillic}/u], ['ky', /\p{Script=Cyrillic}/u],
  ['tg', /\p{Script=Cyrillic}/u], ['mn', /\p{Script=Cyrillic}/u],
  ['uz-AR', /\p{Script=Arabic}/u],
  ['ba', /\p{Script=Cyrillic}/u], ['tt', /\p{Script=Cyrillic}/u],
  ['ug', /\p{Script=Arabic}/u], ['ckb', /\p{Script=Arabic}/u],
  ['am', /\p{Script=Ethiopic}/u], ['as', /\p{Script=Bengali}/u],
  ['or_IN', /\p{Script=Oriya}/u], ['si', /\p{Script=Sinhala}/u],
  ['ps', /\p{Script=Arabic}/u], ['sd', /\p{Script=Arabic}/u],
  ['km', /\p{Script=Khmer}/u], ['km-KH', /\p{Script=Khmer}/u],
  ['km_KH', /\p{Script=Khmer}/u], ['my', /\p{Script=Myanmar}/u],
]) {
  for (const key of keys) assert.match(read(code)[key], script, `${code}:${key}: native script`);
}
assert.match(read('sw')['features-desc'], /Data yake huhifadhiwa na ruhusa hazibadiliki/);
assert.match(read('tl')['features-desc'], /Pinananatili ang datos.*hindi nagbabago ang mga pahintulot/);
assert.match(read('az')['features-desc'], /məlumatları saxlanılır və icazələr dəyişmir/);
assert.match(read('gd')['features-desc'], /dàta aige a chumail agus chan atharraich ceadan/);
assert.match(read('mt')['features-desc'], /dejta tagħha tinżamm u l-permessi ma jinbidlux/);
assert.match(read('oc')['features-desc'], /donadas son conservadas e las autorizacions càmbian pas/);
assert.equal(read('la').features, 'Facultates');
for (const key of keys) assert.doesNotMatch(read('la')[key], /Latine:/, `${key}: no language-prefix filler`);
assert.match(read('ha')['features-desc'], /adana bayanansa.*izini ba ya canzawa/);
assert.match(read('sn')['features-desc'], /data racho rinochengetwa uye mvumo hadzichinji/i);
assert.match(read('ig')['features-desc'], /echekwa data ya, ikike anaghịkwa agbanwe/);
assert.match(read('yo')['features-desc'], /pa dátà rẹ̀ mọ́.*ìyọ̀ǹda kò sì yí padà/);
assert.match(read('mn')['features-desc'], /Өгөгдөл нь хадгалагдаж, хандалтын эрх өөрчлөгдөхгүй/);
assert.doesNotMatch(read('mn')['features-desc'], /данные|разрешения|сохраняются/i);
assert.match(read('uz')['features-desc'], /maʼlumotlari saqlanadi va ruxsatlar oʻzgarmaydi/);
assert.notEqual(read('uz-AR')['feature-saved'], read('uz')['feature-saved']);
assert.match(read('ba')['features-desc'], /мәғлүмәттәре һаҡлана, рөхсәттәр үҙгәрмәй/);
assert.match(read('tt')['features-desc'], /мәгълүматлары саклана, рөхсәтләр үзгәрми/);
assert.notEqual(read('ba')['feature-saved'], read('tt')['feature-saved']);
assert.match(read('tk_TM')['features-desc'], /maglumatlary saklanýar we rugsatlar üýtgemeýär/);
assert.match(read('ku')['features-desc'], /Daneyên wê tên parastin û destûr nayên guhertin/);
assert.notEqual(read('ckb')['feature-saved'], read('ku')['feature-saved']);
assert.match(read('am')['features-desc'], /ውሂቡ ይጠበቃል፣ ፈቃዶችም አይቀየሩም/);
assert.match(read('as')['features-desc'], /তথ্য সংৰক্ষিত থাকে আৰু অনুমতি সলনি নহয়/);
assert.match(read('si')['features-desc'], /දත්ත සුරැකෙන අතර අවසර වෙනස් නොවේ/);
assert.notEqual(read('ps')['feature-saved'], read('sd')['feature-saved']);
assert.match(read('km')['features-desc'], /ទិន្នន័យរបស់វាត្រូវបានរក្សាទុក ហើយសិទ្ធិមិនផ្លាស់ប្តូរទេ/);
assert.match(read('my')['features-desc'], /ဒေတာကို ထိန်းသိမ်းထားပြီး ခွင့်ပြုချက်များ မပြောင်းလဲပါ/);
assert.match(read('fo')['features-desc'], /Dáturnar verða varðveittar, og loyvi broytast ikki/);
assert.match(read('fy')['features-desc'], /gegevens bliuwe bewarre en tastimmingen feroarje net/);
assert.match(read('fur')['features-desc'], /dâts a vegnin conservâts e i permès no cambiin/);
assert.match(read('rm')['features-desc'], /datas vegnan mantegnidas e las permissiuns na sa midan betg/);
assert.match(read('sc')['features-desc'], /datos suos si cunservant e sos permissos no càmbiant/);
assert.match(read('scn')['features-desc'], /dati si sarvanu e li pirmissi nun càmbianu/);
assert.match(read('nap')['features-desc'], /date suje se conservano e 'e permisse nun cagnano/);
assert.match(read('pap')['features-desc'], /datonan ta keda wardá i e pèrmitnan no ta kambia/);
assert.match(read('mg')['features-desc'], /Voatahiry ny angonany ary tsy miova ny fahazoan-dalana/);
assert.match(read('so')['features-desc'], /Xogteeda waa la hayaa, oggolaanshuhuna isma beddelo/);
assert.match(read('ny')['features-desc'], /Deta yake imasungidwa ndipo zilolezo sizisintha/);
assert.match(read('om')['features-desc'], /Daataan isaa ni kuufama, hayyamni immoo hin jijjiiramu/);
assert.equal(read('rw')['feature-saved'], 'Byabitswe.');
assert.equal(read('rn')['feature-saved'], 'Vyabitswe.');
assert.notEqual(read('rw')['feature-views-flow-charts'], read('rn')['feature-views-flow-charts']);
assert.match(read('zu')['features-desc'], /Idatha yaso iyagcinwa futhi izimvume azishintshi/);
assert.match(read('xh')['features-desc'], /Idatha yalo iyagcinwa kwaye iimvume azitshintshi/);
assert.notEqual(read('zu')['feature-views-table'], read('xh')['feature-views-table']);
assert.match(read('st')['features-desc'], /di a bolokwa mme ditumello ha di fetohe/);
assert.match(read('tn')['features-desc'], /e a bolokwa mme ditetla ga di fetoge/);
assert.match(read('nso')['features-desc'], /e a bolokwa gomme ditumelelo ga di fetoge/);
assert.equal(read('tn').features, 'Dikarolo');
for (const key of keys) assert.doesNotMatch(read('tn')[key], /^Tshedimosetso:/, `${key}: no language-prefix filler`);
assert.equal(new Set(['st', 'tn', 'nso'].map(code => read(code)['feature-views-table'])).size, 3);
assert.match(read('ss')['features-desc'], /Idatha yaso iyagcinwa futsi timvumo atigucuki/);
assert.match(read('nd')['features-desc'], /Idatha yaso iyagcinwa njalo imvumo ayiguquki/);
assert.notEqual(read('ss')['feature-views-map'], read('nd')['feature-views-map']);
assert.match(read('ts')['features-desc'], /Data ya xona ya hlayisiwa naswona mpfumelelo a wu cinci/);
assert.match(read('ve')['features-desc'], /Data yatsho i a vhulungwa nahone thendelo a dzi shanduki/);
assert.equal(read('ts').features, 'Swihlawulekisi');
for (const key of keys) assert.doesNotMatch(read('ts')[key], /^Hi Xitsonga:/, `${key}: no language-prefix filler`);
assert.match(read('lg')['features-desc'], /Ebikwata ku kyo biterekebwa era olukusa terukyuka/);
assert.match(read('wo')['features-desc'], /rootaanam dañuy des ci denc bi te ndigal yi duñu soppeeku/);
assert.equal(read('lg').features, 'Ebikozesebwa');
for (const key of keys) assert.doesNotMatch(read('lg')[key], /mu Luganda/, `${key}: no language-suffix filler`);
assert.match(read('ak')['features-desc'], /Wɔkora ne data so, na tumi a wɔde ama no nsesa/);
assert.match(read('bm')['features-desc'], /kunnafoniw bɛ mara, yamaruyaw tɛ yɛlɛma/);
assert.match(read('ee')['features-desc'], /nyatakakawo ɖo eye mɔɖeɖewo metrɔna o/);
assert.match(read('br')['features-desc'], /Miret e vez e roadennoù ha ne cheñch ket an aotreoù/);
assert.match(read('kw')['features-desc'], /dhata yw gwithys ha ny janj an kumyasow/);
assert.match(read('gv')['features-desc'], /data freilt as cha nel ny kiadyn caghlaa/);
assert.match(read('csb')['features-desc'], /pòdôwczi òstôwają zachòwóné, a ùprawnienia sã nie zmieniôją/);
assert.match(read('hsb')['features-desc'], /daty so wobchowaja a prawa so njeměnja/);
assert.match(read('szl')['features-desc'], /dane sōm zachowane, a uprawniynia sie niy zmiyniajōm/);
assert.equal(read('hsb').features, 'Funkcije');
assert.match(read('bi')['features-desc'], /Data blong hem i stap yet, mo ol raet blong yusum sistem oli no jenis/);
assert.match(read('tpi')['features-desc'], /Data bilong en i stap yet, na ol tok orait i no senis/);
for (const code of ['bi', 'tpi']) {
  assert.doesNotMatch(read(code).features, /Features|Toksave:|Tok blong sistem:/);
}
assert.notEqual(read('bi')['feature-views-table-desc'], read('tpi')['feature-views-table-desc']);
assert.match(read('mi')['features-desc'], /Ka puritia ōna raraunga, ā, kāore ngā whakaaetanga e panoni/);
assert.match(read('sm')['features-desc'], /E teu pea ona faamatalaga ma e lē suia faatagaga/);
assert.match(read('to')['features-desc'], /kei tauhi hono fakamatala pea 'oku 'ikai liliu 'a e ngaahi ngofua/);
assert.doesNotMatch(read('to').features, /Faka-Tonga:|Features/);
assert.match(read('haw')['features-desc'], /Mālama ʻia kona ʻikepili, a ʻaʻole hoʻololi ʻia nā ʻae/);
assert.match(read('fj')['features-desc'], /maroroi tiko na kena itukutuku, ka sega ni veisau na veivakadonui/);
assert.equal(read('haw').features, 'Nā hana');
assert.match(read('ve-CC')['features-desc'], /dati i vien tegnudi e i permessi no i canbia/);
assert.match(read('wa')['features-desc'], /dnêyes sont wårdêyes et les droets ni candjèt nén/);
console.log(`Feature visibility translations: ${keys.length} messages in ${codes.length} locales passed`);
