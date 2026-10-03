'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const en = read('en');
const keys = ['import-board-instruction-taskwarrior', 'import-board-instruction-focalboard', 'drag-to-reorder'];
const groups = [
  ['pl pl-PL', 'nie są importowane', 'w górę', 'w dół'],
  ['cs cs-CZ', 'neimportují', 'nahoru', 'dolů'],
  ['sk', 'neimportujú', 'nahor', 'nadol'],
  ['sl sl_SI', 'se ne uvozijo', 'gor', 'dol'],
  ['hr', 'ne uvoze se', 'gore', 'dolje'],
  ['ro ro-RO', 'nu sunt importate', 'în sus', 'în jos'],
  ['hu', 'nem kerülnek importálásra', 'fel', 'le'],
  ['bg', 'не се импортират', 'нагоре', 'надолу'],
  ['uk uk-UA', 'не імпортуються', 'вгору', 'вниз'],
  ['ru ru-RU ru_RU ru-UA', 'не импортируются', 'вверх', 'вниз'],
  ['et-EE', 'ei impordita', 'Üles-', 'allanoole'],
  ['lv', 'netiek importēti', 'Augšupvērstās', 'lejupvērstās'],
  ['lt', 'neimportuojami', 'aukštyn', 'žemyn'],
  ['el el-GR', 'δεν εισάγονται', 'πάνω', 'κάτω'],
  ['tr', 'içe aktarılmaz', 'Yukarı', 'aşağı'],
  ['id', 'tidak diimpor', 'atas', 'bawah'],
  ['ms ms-MY', 'tidak diimport', 'atas', 'bawah'],
  ['vi vi-VN', 'không được nhập', 'lên', 'xuống'],
  ['ja ja-JP', 'インポートされません', '上矢印', '下矢印'],
  ['ko ko-KR', '가져오지 않습니다', '위쪽', '아래쪽'],
  ['cmn zh zh-CN zh-GB zh-Hans zh_SG', '不会导入', '向上', '向下'],
  ['zh-Hant zh-TW zh-HK', '不會匯入', '向上', '向下'],
  ['ar ar-DZ ar-EG', 'لا يتم استيراد', 'لأعلى', 'لأسفل'],
  ['he he-IL', 'אינם מיובאים', 'למעלה', 'למטה'],
  ['fa fa-IR', 'وارد نمی‌شوند', 'بالا', 'پایین'],
  ['ur', 'درآمد نہیں کی جاتیں', 'اوپر', 'نیچے'],
  ['hi hi-IN', 'आयात नहीं किए जाते', 'ऊपर', 'नीचे'],
  ['bn', 'আমদানি করা হয় না', 'ওপর', 'নিচের'],
  ['ca ca_ES ca@valencia', 'no s’importen', 'amunt', 'avall'],
  ['gl gl-ES', 'non se importan', 'arriba', 'abaixo'],
  ['eu', 'ez dira inportatzen', 'Gora', 'behera'],
  ['af af_ZA', 'nie ingevoer nie', 'op-', 'afpyltjies'],
  ['sw', 'haviingizwi', 'juu', 'chini'],
  ['bs', 'se ne uvoze', 'gore', 'dolje'],
  ['sr', 'се не увозе', 'нагоре', 'надоле'],
  ['mk', 'не се увезуваат', 'нагоре', 'надолу'],
  ['is', 'ekki flutt inn', 'upp', 'niður'],
  ['eo', 'ne estas importataj', 'supren', 'malsupren'],
  ['sq', 'nuk importohen', 'lart', 'poshtë'],
  ['tl', 'Hindi ini-import', 'pataas', 'pababang'],
  ['be', 'не імпартуюцца', 'ўверх', 'ўніз'],
  ['az az-AZ az-LA', 'idxal edilmir', 'Yuxarı', 'aşağı'],
  ['ka', 'იმპორტი არ ხდება', 'ზემოთ', 'ქვემოთ'],
  ['hy', 'չեն ներմուծվում', 'Վերև', 'ներքև'],
  ['kk', 'импортталмайды', 'Жоғары', 'төмен'],
  ['mn', 'импортлохгүй', 'Дээш', 'доош'],
  ['uz uz-UZ uz-LA', 'import qilinmaydi', 'Yuqoriga', 'pastga'],
  ['th', 'ไม่ถูกนำเข้า', 'ขึ้น', 'ลง'],
  ['ne', 'आयात गरिँदैनन्', 'माथि', 'तल'],
  ['mr', 'आयात केले जात नाहीत', 'वर', 'खाली'],
  ['ta', 'இறக்குமதி செய்யப்படாது', 'மேல்', 'கீழ்'],
  ['te-IN', 'దిగుమతి చేయబడవు', 'పైకి', 'కిందికి'],
  ['gu-IN', 'આયાત કરવામાં આવતાં નથી', 'ઉપર', 'નીચેના'],
  ['kn', 'ಆಮದು ಮಾಡಲಾಗುವುದಿಲ್ಲ', 'ಮೇಲಿನ', 'ಕೆಳಗಿನ'],
  ['ml', 'ഇറക്കുമതി ചെയ്യില്ല', 'മുകളിലേക്കും', 'താഴേക്കുമുള്ള'],
  ['pa', 'ਆਯਾਤ ਨਹੀਂ ਕੀਤੀਆਂ ਜਾਂਦੀਆਂ', 'ਉੱਪਰ', 'ਹੇਠਾਂ'],
  ['si', 'ආයාත නොකෙරේ', 'ඉහළ', 'පහළ'],
  ['as', 'আমদানি কৰা নহয়', 'ওপৰ', 'তলৰ'],
  ['or_IN', 'ଆମଦାନୀ କରାଯାଏ ନାହିଁ', 'ଉପର', 'ତଳ'],
  ['sd', 'درآمد نه ٿيون ڪيون وڃن', 'مٿي', 'هيٺ'],
  ['ga', 'Ní iompórtáiltear', 'suas', 'síos'],
  ['cy cy-GB', 'Ni fewnforir', 'i fyny', 'i lawr'],
  ['lb', 'net importéiert', 'uewen', 'ënne'],
  ['mt', 'ma jiġux importati', '’il fuq', '’l isfel'],
  ['fy fy-NL', 'net ymportearre', 'omheech', 'omleech'],
  ['la', 'non importantur', 'sursum', 'deorsum'],
  ['ht', 'pa enpòte', 'monte', 'desann'],
  ['jv', 'ora diimpor', 'munggah', 'mudhun'],
  ['oc', 'son pas importats', 'amont', 'aval'],
  ['ast-ES', 'nun s’importen', 'arriba', 'abaxo'],
  ['an', 'no s’importan', 'enta alto', 'enta baixo'],
  ['co', 'ùn sò micca impurtati', 'in sù', 'in ghjò'],
  ['ky', 'импорттолбойт', 'Өйдө', 'ылдый'],
  ['tg', 'ворид намешаванд', 'боло', 'поён'],
  ['tk_TM', 'import edilmeýär', 'Ýokary', 'aşak'],
  ['tt', 'импортланмый', 'Өскә', 'аска'],
  ['ba', 'импортланмай', 'Өҫкә', 'аҫҡа'],
  ['yi', 'נישט אימפּאָרטירט', 'אַרויף', 'אַראָפּ'],
  ['my', 'မတင်သွင်းပါ', 'အပေါ်', 'အောက်'],
  ['km km-KH km_KH', 'មិនត្រូវបាននាំចូលទេ', 'ឡើងលើ', 'ចុះក្រោម'],
  ['ku', 'nayên têxistin', 'ber bi jor', 'ber bi jêr'],
  ['ckb', 'هاوردە ناکرێن', 'سەرەوە', 'خوارەوە'],
  ['ps', 'نه واردېږي', 'پورته', 'ښکته'],
  ['so', 'lama soo dejiyo', 'kor', 'hoos'],
  ['ha', 'Ba a shigo da', 'sama', 'ƙasa'],
  ['yo', 'A kò kó', 'sókè', 'sísàlẹ̀'],
  ['ig', 'A naghị ebubata', 'elu', 'ala'],
  ['mg', 'Tsy ampidirina', 'miakatra', 'midina'],
  ['am', 'አይመጡም', 'ወደ ላይ', 'ወደ ታች'],
  ['zu zu-ZA', 'azingeniswa', 'yaphezulu', 'naphansi'],
  ['xh', 'azingeniswa', 'phezulu', 'nasezantsi'],
  ['sn', 'hazvipinzwi', 'yokumusoro', 'neyokuzasi'],
  ['ny', 'sizilowetsedwa', 'yokwera', 'yotsika'],
  ['st', 'ha di kenngwe', 'hodimo', 'tlase'],
  ['tn', 'ga di tsenngwe', 'godimo', 'tlase'],
  ['ja-HI', 'インポートされません', 'うえやじるし', 'したやじるし'],
  ['yue_CN', '唔會匯入', '向上', '向下'],
  ['wuu-Hans', '勿会导入', '向上', '向下'],
  ['ary', 'ما كيتستوردوش', 'للفوق', 'للتحت'],
  ['bho', 'आयात ना होखेली', 'ऊपर', 'नीचे'],
  ['mai', 'आयात नहि होइत अछि', 'ऊपर', 'नीचाँ'],
  ['sc', 'non sunt importados', 'in susu', 'in giosso'],
  ['scn', 'nun sunnu mpurtati', '’n susu', '’n giusu'],
  ['nap', 'nun so’ mpurtate', '’ncoppa', 'abbascio'],
  ['ve-CC', 'no i vien importai', 'in su', 'in zo'],
  ['fur', 'no vegnin importâts', 'in sù', 'in jù'],
  ['rm', 'na vegnan betg importads', 'ensi', 'engiu'],
  ['pap', 'no ta wordu importá', 'ariba', 'abou'],
  ['tpi', 'i no kam insait', 'antap', 'daun'],
  ['bi', 'oli no kam insaed', 'antap', 'daon'],
  ['mi', 'Kāore', 'whakarunga', 'whakararo'],
  ['sm', 'lē faaulufaleina', 'i luga', 'lalo'],
  ['haw', 'ʻAʻole hoʻokomo ʻia', 'i luna', 'i lalo'],
  ['fo', 'verða ikki innflutt', 'upp', 'niður'],
  ['gd', 'Cha tèid', 'suas', 'sìos'],
  ['br', 'Ne vez ket enporzhiet', 'd’an nec’h', 'd’an traoñ'],
  ['szl', 'niy sōm importowane', 'do gōry', 'na dōł'],
  ['csb', 'nie są impòrtowóné', 'w górã', 'w dół'],
  ['hsb', 'njeimportuja', 'horje', 'dele'],
  ['rw', 'ntibyinjizwa', 'hejuru', 'hasi'],
  ['rn', 'ntivyinjizwa', 'hejuru', 'hasi'],
  ['nso', 'ga di tsenywe', 'godimo', 'fase'],
  ['ts', 'a swi nghenisiwi', 'le henhla', 'le hansi'],
  ['ss', 'atingeniswa', 'yetulu', 'naphansi'],
  ['nd', 'akungeniswa', 'yaphezulu', 'laphansi'],
  ['ug', 'ئىمپورت قىلىنمايدۇ', 'يۇقىرى', 'تۆۋەن'],
  ['uz-AR', 'ایمپارت قیلینمیدی', 'یوقاریگه', 'پستگه'],
  ['kok', 'आयात करिनात', 'वयर', 'सकयल'],
  ['om', 'hin galfaman', 'olii', 'gadii'],
  ['fj', 'sega ni vakacurumi', 'cake', 'ra'],
  ['to', 'ʻikai fakahū mai', 'ʻolunga', 'lalo'],
  ['wa', 'n’ sont nén abagués', 'pa dzeu', 'pa dzo'],
  ['wa-RR', 'Diri gin-iimport', 'tipaigbaw', 'tipaubos'],
  ['ak', 'Wɔmfa', 'soro', 'fam'],
  ['lg', 'tebiyingizibwa', 'waggulu', 'wansi'],
  ['wo', 'duñu leen dugal', 'ci kaw', 'ci suuf'],
  ['bm', 'tɛ ladon', 'Sanfɛ', 'duguma'],
  ['ace', 'hana geupeutamong', 'u ateueh', 'u miyup'],
  ['lld', 'ne vën nia importés', 'in su', 'in ju'],
  ['rup', 'nu s-importã', 'n-sus', 'n-gios'],
  ['gv', 'Cha nel', 'seose', 'sheese'],
  ['kw', 'nyns yw ynperthys', 'war-vann', 'war-woles'],
  ['se', 'eai sisafievrriduvvo', 'Bajás-', 'vulos'],
  ['bua', 'оруулагдахагүй', 'Дээшээ', 'доошоо'],
  ['cv', 'импортланмаҫҫӗ', 'Ҫӳлелле', 'аялалла'],
  ['sah', 'киллэриллибэттэр', 'Үөһэ', 'аллара'],
  ['ay', 'janiwa apanitäkiti', 'Alayaru', 'aynacharu'],
  ['qu', 'manam apamusqachu kanku', 'Hananman', 'urayman'],
  ['gn', 'ndojeguerúi', 'Yvate', 'yvýgotyo'],
  ['bo', 'ནང་འདྲེན་མི་བྱེད', 'ཡར', 'མར'],
  ['dz', 'ནང་འདྲེན་མི་འབད', 'ཡར', 'མར'],
  ['ve', 'a zwi dzheniswi', 'nṱha', 'fhasi'],
  ['ve-PP', 'ei toda', 'Ülähäks', 'alahaks'],
  ['ks', 'نہٕ درآمد گژھان', 'ہؠور', 'بۄن'],
  ['ee', 'Wometsɔa', 'Dzi', 'te'],
  ['ff', 'naatnetaake', 'dow', 'les'],
  ['ti', 'ኣይኣትዉን', 'ንላዕሊ', 'ንታሕት'],
  ['vo', 'no panüpladons', 'sui', 'donio'],
  ['tlh', "luqembe'lu'", 'Dung', 'bIng'],
  ['nah', 'amo calaqui', 'huehcapa', 'tlani'],
  ['kl', 'eqqunneqassanngillat', 'qummut', 'ammullu'],
  ['zgh', 'ⵓⵔ ⵜⵜⵡⴰⵙⴽⵛⴰⵎⵏ', 'ⵓⴼⵍⵍⴰ', 'ⵡⴰⴷⴷⴰ'],
  ['iu', 'ᐃᓯᖅᑎᑕᐅᙱᑦᑐᑦ', 'ᖁᒻᒧᑦ', 'ᐊᑖᓄᑦ'],
  ['tig', 'ኢልትአምጸእኒ', 'ላዕል', 'ታሐት'],
  ['wal', 'gelikkona', 'Pude', 'duge'],
  ['chr', 'Ꮭ ᏱᏓᏓᏴᏍᎦ', 'ᎦᎸᎳᏗ', 'ᎡᎳᏗ'],
  ['fi', 'ei tuoda', 'Ylä-', 'alanuoli'],
  ['sv', 'importeras inte', 'Uppåt-', 'nedåtpilarna'],
  ['da', 'importeres ikke', 'Pil op', 'pil ned'],
  ['nb', 'importeres ikke', 'Pil opp', 'pil ned'],
  ['de de-AT de-CH de_DE', 'nicht importiert', 'oben', 'unten'],
  ['fr fr-BE fr-CA fr-CH fr-FR', 'ne sont pas importées', 'Haut', 'Bas'],
  ['es es-AR es-CL es-CO es-LA es-MX es-PE es-PY es_CO', 'no se importan', 'arriba', 'abajo'],
  ['pt pt-PT pt_PT pt-BR', 'não são importados', 'cima', 'baixo'],
  ['it', 'non vengono importati', 'su', 'giù'],
  ['nl nl-NL vl-SS', 'niet geïmporteerd', 'omhoog', 'omlaag'],
];
// New catalogs must join the semantic checks, not silently escape this family.
const coveredLocales = groups.flatMap(([group]) => group.split(' '));
const catalogLocales = fs.readdirSync(path.join(__dirname, '../imports/i18n/data'))
  .filter(file => file.endsWith('.i18n.json'))
  .map(file => file.replace(/\.i18n\.json$/, ''))
  .filter(code => !/^en([_-].*)?$/.test(code));
assert.equal(new Set(coveredLocales).size, coveredLocales.length, 'no duplicate locale coverage');
assert.deepEqual([...coveredLocales].sort(), catalogLocales.sort(), 'every non-English catalog has import/reordering coverage');
let count = 0;
for (const [group, exclusion, up, down] of groups) {
  for (const code of group.split(' ')) {
    const locale = read(code);
    assert.deepEqual(Object.keys(locale), Object.keys(en), `${code}: source key order`);
    for (const key of keys) {
      assert.ok(locale[key]?.trim(), `${code}:${key}: missing text`);
      assert.notEqual(locale[key], en[key], `${code}:${key}: English placeholder`);
      assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${code}:${key}: exact tokens`);
    }
    for (const token of ['task export', 'JSON', 'Done', 'project', 'priority', 'annotations', 'depends']) {
      assert.ok(locale[keys[0]].includes(token), `${code}: Taskwarrior command, fields and destination must stay recognizable: ${token}`);
    }
    for (const token of ['.boardarchive', 'board.jsonl', exclusion]) {
      assert.ok(locale[keys[1]].includes(token), `${code}: Focalboard file format and import limitation: ${token}`);
    }
    for (const direction of [up, down]) {
      assert.ok(locale[keys[2]].includes(direction), `${code}: both keyboard directions must be explained`);
    }
    count++;
  }
}
console.log(`Import and reordering: ${keys.length} messages in ${count} locale variants passed`);

for (const code of ['ro', 'ro-RO']) {
  assert.equal(read(code).labels, 'Etichete', `${code}: Romanian labels, not Italian`);
  assert.equal(read(code).description, 'Descriere', `${code}: Romanian description, not Italian`);
}
assert.equal(read('hr').description, 'Opis', 'Croatian description uses Croatian Latin spelling');

assert.equal(read('lv').checklist, 'Kontrolsaraksts', 'Latvian checklist, not Lithuanian');

for (const key of keys) assert.doesNotMatch(read('ja-HI')[key], /\p{Script=Han}/u, `ja-HI:${key}: no kanji`);

assert.equal(read('ve-CC').checklist, 'Lista de controło', 'Venetian checklist, not Zulu');

assert.ok(read('mi')[keys[0]].includes('mahere huānga JSON'), 'Māori array term');
assert.ok(read('haw')[keys[2]].startsWith('E alakō'), 'Hawaiian computer drag term');

assert.equal(read('uz-AR').labels, 'یارلیقلر', 'Arabic-script Uzbek labels');
for (const code of ['ug', 'uz-AR']) {
  for (const key of keys) {
    const prose = read(code)[key].replace(/task export|JSON|Done|project|priority|annotations|depends|\.boardarchive|board\.jsonl/g, '');
    assert.match(prose, /\p{Script=Arabic}/u, `${code}:${key}: Arabic script`);
    assert.doesNotMatch(prose, /[A-Za-z]|\p{Script=Cyrillic}/u, `${code}:${key}: prose in declared script`);
  }
}

for (const key of keys) assert.doesNotMatch(read('lld')[key], /\p{Script=Cyrillic}/u, `lld:${key}: no Cyrillic lookalikes`);

// Venda must not inherit the Zulu labels from its original seed.
assert.equal(read('ve')["labels"], "Dziḽeibuḽu");
assert.equal(read('ve')["checklist"], "Mutevhe wa u ṱola");
assert.equal(read('ve')["comments"], "Mahumbulwa");
assert.equal(read('ve')["lists"], "Mitevhe");
assert.equal(read('ve')["import-board"], "U dzhenisa bodo");

// Veps import and subtask labels must not retain Zulu or Venda seed text.
assert.equal(read('ve-PP')["import-board-source"], "To laud (Trello, Jira, WeKan-fail, CSV, Excel, …)");
assert.equal(read('ve-PP')["checklistItem-linked-subtask"], "Sidotud alatego");

// The Volapük comments label must not retain Esperanto seed text.
assert.equal(read('vo').comments, 'Küpets');

// Wolaytta direction controls must not retain English after a language prefix.
assert.equal(read('wal')["move-card-up"], "Kaardiya pude qaassa");
assert.equal(read('wal')["move-card-down"], "Kaardiya duge qaassa");
