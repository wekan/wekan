'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const directory = path.join(__dirname, '../imports/i18n/data');
const read = code => JSON.parse(fs.readFileSync(path.join(directory, `${code}.i18n.json`), 'utf8'));
const english = read('en');
const codes = ["fi", "sv", "de", "de_DE", "de-AT", "de-CH", "fr", "fr-FR", "fr-BE", "fr-CA", "fr-CH", "es", "es-AR", "es-LA", "es-CL", "es_CO", "es-CO", "es-PY", "es-PE", "es-MX", "pt", "pt-PT", "pt_PT", "pt-BR", "it", "nl", "nl-NL", "vl-SS", "ru", "ru-RU", "ru-UA", "ru_RU", "uk", "uk-UA", "pl", "pl-PL", "cs", "cs-CZ", "da", "nb", "et-EE", "hu", "ro", "ro-RO", "el", "el-GR", "tr", "id", "ms", "ms-MY", "vi", "vi-VN", "ja", "ja-JP", "ja-HI", "ko", "ko-KR", "zh-CN", "zh-Hans", "zh", "cmn", "zh_SG", "zh-GB", "zh-TW", "zh-Hant", "zh-HK", "ar", "ar-DZ", "ar-EG", "sk", "bg", "sl", "sl_SI", "hr", "bs", "sr", "mk", "lt", "lv", "be", "ca", "ca_ES", "ca@valencia", "gl", "gl-ES", "eu", "af", "af_ZA", "sq", "eo", "he", "he-IL", "fa", "fa-IR", "hi", "hi-IN", "bn", "ta", "th", "is", "ga", "cy", "cy-GB", "lb", "ka", "hy", "az", "az-AZ", "az-LA", "sw", "tl", "ur", "ne", "kn", "gu-IN", "mr", "ml", "te-IN", "pa", "gd", "mt", "oc", "jv", "ht", "la", "ha", "sn", "yo", "ig", "co", "an", "ast-ES", "kk", "ky", "tg", "mn", "uz", "uz-LA", "uz-UZ", "uz-AR", "ba", "tt", "tk_TM", "ug", "ckb", "ku", "am", "as", "or_IN", "si", "ps", "sd", "km", "km-KH", "km_KH", "my", "fo", "fy", "fy-NL", "fur", "rm", "sc", "scn", "nap", "pap", "so", "mg", "rw", "rn", "ny", "om", "zu", "zu-ZA", "xh", "st", "tn", "nso", "ss", "nd", "ts", "ve", "lg", "wo", "ak", "bm", "ee", "br", "kw", "gv", "csb", "hsb", "szl", "bi", "tpi", "mi", "sm", "to", "haw", "fj", "ve-CC", "wa", "lld", "rup", "yue_CN", "wuu-Hans", "yi", "bua", "cv", "sah", "bho", "mai", "kok", "ary", "ace", "wa-RR", "se", "ve-PP", "bo", "dz", "ti", "ks", "tlh", "vo", "ay", "qu", "gn", "ff", "kl", "nah", "wal", "iu", "zgh", "tig", "chr"];
const keys = ["features-desc", "feature-views-table", "feature-views-table-desc", "feature-views-calendar", "feature-views-calendar-desc", "feature-views-time", "feature-views-time-desc", "feature-views-overview", "feature-views-overview-desc", "feature-views-gantt", "feature-views-gantt-desc", "feature-views-scrum", "feature-views-scrum-desc", "feature-views-flow-charts", "feature-views-flow-charts-desc", "feature-views-map", "feature-views-map-desc", "feature-awaiting-approval", "feature-approval-required", "feature-preview-admins", "feature-pilot-users", "feature-pilot-users-placeholder", "feature-pilot-users-unknown", "feature-saved"];

// This feature group is now translated in every non-English catalog.
// Keep the coverage list aligned when a locale is added.
const catalogCodes = fs.readdirSync(directory)
  .filter(file => file.endsWith('.i18n.json'))
  .map(file => file.replace(/\.i18n\.json$/, ''))
  .filter(code => !/^en(?:[-_]|$)/.test(code));
assert.deepEqual([...codes].sort(), catalogCodes.sort(), 'every non-English locale is covered');

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
assert.match(read('lld')['features-desc'], /dac resta arjigná y i deric ne se muda nia/);
assert.match(read('rup')['features-desc'], /Datili a ljei s-pãstreascu shi drepturili nu s-alãxescu/);
assert.match(read('yue_CN')['features-desc'], /資料會保留，權限唔會改變/);
assert.match(read('wuu-Hans')['features-desc'], /数据保留勒海，权限勿会变/);
assert.match(read('yi')['features-desc'], /דאַטן ווערן געהיט און די דערלויבענישן בײַטן זיך נישט/);
assert.match(read('wuu-Hans')['feature-saved'], /保存/);
assert.equal(read('yue_CN').save, '儲存');
assert.equal(read('wuu-Hans').save, '保存');
for (const key of keys) assert.match(read('yi')[key], /\p{Script=Hebrew}/u, `${key}: Yiddish script`);
assert.match(read('bua')['features-desc'], /үгэгдэлнүүд хадагалагдана, зүбшөөлнүүд хубилхагүй/);
assert.match(read('cv')['features-desc'], /даннӑйӗсем упранса юлать, ирӗксем улшӑнмаҫҫӗ/);
assert.match(read('sah')['features-desc'], /дааннайдара хараллан хаалаллар, көҥүллэр уларыйбаттар/);
for (const code of ['bua', 'cv', 'sah']) {
  for (const key of keys) assert.match(read(code)[key], /\p{Script=Cyrillic}/u, `${code}:${key}: Cyrillic prose`);
}
assert.match(read('bho')['features-desc'], /डेटा सुरक्षित रही आ अनुमति ना बदली/);
assert.match(read('mai')['features-desc'], /डेटा सुरक्षित रहत आ अनुमति नहि बदलत/);
assert.notEqual(read('bho')['feature-saved'], read('mai')['feature-saved']);
for (const code of ['bho', 'mai']) {
  for (const key of keys) assert.match(read(code)[key], /\p{Script=Devanagari}/u, `${code}:${key}: Devanagari prose`);
}
assert.match(read('kok')['features-desc'], /डेटा जतन जाता आनी परवानग्यो बदलनात/);
assert.match(read('ary')['features-desc'], /المعطيات ديالها كتبقى محفوظة والصلاحيات ما كتبدلش/);
for (const key of keys) {
  assert.match(read('kok')[key], /\p{Script=Devanagari}/u, `${key}: Konkani script`);
  assert.match(read('ary')[key], /\p{Script=Arabic}/u, `${key}: Moroccan Arabic script`);
}
assert.match(read('ace')['features-desc'], /Data jih teukeubah, idin hana meuubah/);
assert.match(read('wa-RR')['features-desc'], /Gintitipigan an datos hito ngan diri nagbabag-o an mga pagtugot/);
assert.match(read('se')['features-desc'], /dieđut vurkejuvvojit ja vuoigatvuođat eai rievdda/);
assert.match(read('ve-PP')['features-desc'], /tedod kaičetas da oiktused ei toižetase/);
assert.notEqual(read('se')['feature-saved'], read('ve-PP')['feature-saved']);
assert.match(read('bo')['features-desc'], /གཞི་གྲངས་ཉར་ཚགས་བྱེད་ཅིང་ཆོག་མཆན་ལ་འགྱུར་བ་མི་གཏོང་/);
for (const key of keys) assert.match(read('bo')[key], /\p{Script=Tibetan}/u, `${key}: Tibetan prose`);
assert.match(read('dz')['features-desc'], /གནད་སྡུད་ཚུ་སྲུང་བཞག་ནི་དང་ གནང་བ་ཚུ་མི་འགྱུར/);
for (const key of keys) assert.match(read('dz')[key], /\p{Script=Tibetan}/u, `${key}: Dzongkha script`);
assert.notEqual(read('dz')['feature-saved'], read('bo')['feature-saved']);
assert.match(read('ti')['features-desc'], /ዳታኡ ይዕቀብ፣ ፍቓዳት ድማ ኣይቅየሩን/);
for (const key of keys) assert.match(read('ti')[key], /\p{Script=Ethiopic}/u, `${key}: Tigrinya script`);
assert.notEqual(read('ti')['feature-saved'], read('am')['feature-saved']);
console.log(`Feature visibility translations: ${keys.length} messages in ${codes.length} locales passed`);

// Kashmiri must retain its own grammar, not just Urdu-script English labels.
for (const key of keys) assert.match(read('ks')[key], /\p{Script=Arabic}/u, `ks:${key}: native script`);
assert.match(read('ks')['features-desc'], /محفوظ روزان.*اِجازَتھ چھِ نہٕ بدلان/);
assert.match(read('ks')['feature-approval-required'], /یوت تام منتظم/);
assert.match(read('tlh')['features-desc'], /De'Daj pollu'.*choHbe' chaw'mey/);
assert.match(read('tlh')['feature-approval-required'], /chu'qa'pa' che'wI'/);
assert.doesNotMatch(read('tlh')['feature-views-flow-charts-desc'], /pItlhbe'|quv/);
assert.equal(read('tlh')['feature-views-table'], "wa'chaw HaSta");
assert.equal(read('tlh')['feature-views-calendar'], "'ISjaH HaStamey");

assert.match(read('vo')['features-desc'], /Nüns ona padakipons, e däls no pavotükons/);
assert.match(read('vo')['feature-approval-required'], /jüä guvan aktivükon/);
assert.equal(read('vo')['feature-views-time-desc'], 'Tim e tim lienik.');
assert.equal(read('vo').time, 'Tim');
assert.equal(read('vo').board, 'Tab');
assert.doesNotMatch(read('vo')['feature-views-table-desc'], /Bod|Tempo/);

for (const code of ['ay', 'qu']) {
  for (const key of ['features', 'admin', ...keys]) {
    assert.doesNotMatch(read(code)[key], /Aymar aruna:|Kay willaymi:|\bFeatures?\b|\bAdmin\b/, `${code}:${key}: no English seeds`);
  }
}
assert.match(read('ay')['features-desc'], /imatäskakiwa.*iyawsawinakaxa janiw mayjt'kiti/);
assert.match(read('qu')['features-desc'], /waqaychasqa.*saqisqakunaqa manam tikrakunchu/);
assert.match(read('gn')['features-desc'], /oñeñongatu.*ñemoneĩnguéra noñemoambuéi/);
assert.match(read('ay')['feature-approval-required'], /irpirixa naktayañapkama/);
assert.match(read('qu')['feature-approval-required'], /kamachiq kawsachinankama/);
assert.match(read('gn')['feature-approval-required'], /ñangarekohára omyendy peve/);
assert.equal(read('gn').board, 'Tembiapo renda');
assert.doesNotMatch(read('gn')['feature-views-table-desc'], /Peteĩcha|Tablero/);

assert.match(read('ff')['features-desc'], /ina mooftaa, jamirooje mbaylataake/);
assert.match(read('ff')['feature-approval-required'], /haa jiiloowo hurmina/);
assert.match(read('kl')['features-desc'], /Paasissutissartai toqqortarineqarput, akuersissutillu allanngortinneqanngillat/);
assert.match(read('kl')['feature-approval-required'], /aqutsisumit atuutilersinneqarnissaat tikillugu/);
assert.equal(read('ff')['feature-views-calendar'], 'Jiyte haatumeere');
assert.equal(read('kl')['feature-views-calendar'], 'Ullorsiutitut takussutissat');

assert.match(read('nah')['features-desc'], /Itlamachiliz mopiya, ihuan cahuiliztin amo mopatlah/);
assert.match(read('nah')['feature-approval-required'], /ayamo tlayecani quixotlah/);
assert.match(read('wal')['features-desc'], /erissuwaa naagettees.*maatay laamettenna/);
assert.match(read('wal')['feature-approval-required'], /alaafiyaay dooyana gakkanaw/);
for (const key of ['features', 'admin', ...keys]) {
  assert.doesNotMatch(read('wal')[key], /Wolayttatto:|\bFeatures\b|\bLinked\b/, `wal:${key}: no English seed`);
}

for (const key of keys) assert.match(read('iu')[key], /\p{Script=Canadian_Aboriginal}/u, `iu:${key}: native script`);
assert.match(read('iu')['features-desc'], /ᑐᖅᑯᖅᑕᐅᓯᒪᕗᑦ.*ᐊᓯᔾᔨᖅᑕᐅᙱᓚᑦ/);
assert.match(read('iu')['feature-approval-required'], /ᐊᐅᓚᑦᓯᔨᐅᑉ ᐊᑯᒻᒪᒃᑎᓐᓂᖓᓄᑦ/);

for (const key of keys) {
  assert.match(read('zgh')[key], /\p{Script=Tifinagh}/u, `zgh:${key}: native script`);
  assert.doesNotMatch(read('zgh')[key], /\p{Script=Arabic}/u, `zgh:${key}: no Arabic prose`);
}
assert.match(read('zgh')['features-desc'], /ⵉⵙⴼⴽⴰ ⵏⵏⵙ ⵜⵜⵡⴰⵃⴹⴰⵏ.*ⵜⵓⵔⴰⴳⵉⵏ ⵓⵔ ⴱⴷⴷⵍⵏⵜ/);
assert.match(read('zgh')['feature-approval-required'], /WeKan.*ⴰⵔ ⵜⵏⵜ ⵉⵙⵔⵎⴷ ⵓⵎⵙⵙⵓⴳⵓⵔ/);
assert.match(read('zgh')['feature-views-flow-charts-desc'], /ⴰⴽⵓⴷ ⵙⴳ ⵓⵙⵏⵓⵍⴼⵓ/);

for (const [code, script] of [['tig', 'Ethiopic'], ['chr', 'Cherokee']]) {
  for (const key of keys) {
    assert.match(read(code)[key], new RegExp(`\\p{Script=${script}}`, 'u'), `${code}:${key}: native script`);
    const prose = read(code)[key].replace(/WeKan|Gantt|Scrum|Monte Carlo/g, '');
    assert.doesNotMatch(prose, /[A-Za-z]/, `${code}:${key}: no English prose`);
  }
}
assert.match(read('tig')['features-desc'], /ለሓበሬሀ ልትዐቀብ.*ለፈስሕ ኢልትቀየር/);
assert.match(read('tig')['feature-approval-required'], /WeKan.*ለሓክም እስክ ላነብተን/);
assert.match(read('chr')['features-desc'], /ᎤᎵᏍᎨᏗ ᎦᏟᏌᏅ ᎠᏍᏆᏂᎪᏔᏅᎯ.*ᏗᎵᏍᏓᏁᏗ Ꮭ ᏗᎦᏁᏟᏴᏍᏗ/);
assert.match(read('chr')['feature-approval-required'], /WeKan.*ᏄᎬᏔᏅᎾ.*ᎾᎯᏳᏊ ᎤᎬᏫᏳᏌᏕᎩ/);
assert.match(read('chr')['feature-pilot-users-placeholder'], /«,»/);
