'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const en = read('en');
const keys = Object.keys(en).filter(key => key.startsWith('notification-activity-'));
assert.equal(keys.length, 13);
const pendingKeys = JSON.parse(fs.readFileSync(path.join(__dirname, '../releases/translations/pending-transifex.json'), 'utf8')).keys.map(entry => entry.key);
for (const key of keys) assert.ok(!pendingKeys.includes(key), `${key}: filled group leaves pending queue`);
for (const code of ['tk_TM', 'tt', 'so', 'ku', 'ckb', 'pap', 'tpi', 'bi', 'mi', 'sm', 'haw', 'zu', 'zu-ZA', 'xh', 'st', 'tn', 'rw', 'rn', 'ny', 'bho', 'mai', 'or_IN', 'kok', 'ary', 'yi', 'nd', 'ss', 'nso', 'ts', 'om', 'fj', 'to', 'gv', 'wa', 'wa-RR', 'ak', 'lg', 'bm', 'wo', 'ee', 'rup', 'bua', 'sah', 'cv', 've', 've-CC', 'se', 'ace', 'bo', 'dz', 'ti', 'ks', 'qu', 'ay', 'gn', 'ff', 'vo', 'tlh', 'kl', 'nah', 've-PP', 'zgh', 'iu', 'wal', 'tig', 'chr']) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(en), `${code}: key order`);
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${code}:${key}: nonempty`);
    assert.notEqual(locale[key], en[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${code}:${key}: exact tokens`);
  }
  assert.equal((locale['notification-activity-description'].match(/@/g) || []).length, 1, `${code}: mention marker retained`);
  assert.notEqual(locale['notification-activity-members'], locale['notification-activity-assignees'], `${code}: members and assignees distinct`);
}
// Muting ordinary activity does not mute reminders or direct mentions.
assert.match(read('tk_TM')['notification-activity-description'], /Möhlet ýatlatmalary we @ arkaly agzalmalar hemişe gelýär/);
assert.match(read('tt')['notification-activity-description'], /Үтәү вакыты турында искәртмәләр һәм @ аша искә алулар һәрвакыт килә/);
assert.match(read('so')['notification-activity-description'], /Xusuusinnada.*@ mar walba way imanayaan/);
assert.match(read('tk_TM')['notification-activity-description'], /belligini aýryň/);
assert.match(read('tt')['notification-activity-description'], /билгесен алыгыз/);
assert.match(read('so')['notification-activity-description'], /Ka saar calaamadda/);
assert.match(read('ku')['notification-activity-description'], /Bîranînên dema dawî û behskirinên bi @ her dem tên/);
assert.match(read('ckb')['notification-activity-description'], /بیرخستنەوەکانی کاتی تەواوبوون و ئاماژەکان بە @ هەمیشە دەگەن/);
assert.match(read('ku')['notification-activity-description'], /nîşana wê rake/);
assert.match(read('ckb')['notification-activity-description'], /نیشانەی.*لاببە/);
assert.match(read('pap')['notification-activity-description'], /Rekordatorionan.*@ semper ta yega/);
assert.match(read('tpi')['notification-activity-description'], /tingim de bilong pinis.*@ bai kam yet olgeta taim/);
assert.match(read('bi')['notification-activity-description'], /tingbaot dedlaen.*@ oli kam oltaem/);
assert.match(read('pap')['notification-activity-description'], /Kita e marka/);
assert.match(read('tpi')['notification-activity-description'], /Rausim mak/);
assert.match(read('bi')['notification-activity-description'], /Tekemaot mak/);
assert.match(read('mi')['notification-activity-description'], /Ka tae tonu mai ngā whakamaharatanga rā kati.*@/);
assert.match(read('sm')['notification-activity-description'], /E oo mai pea faamanatu.*@/);
assert.match(read('haw')['notification-activity-description'], /E hiki mau mai nā hoʻomanaʻo.*@/);
assert.match(read('mi')['notification-activity-description'], /Tangohia te tohu/);
assert.match(read('sm')['notification-activity-description'], /Aveese le faailoga/);
assert.match(read('haw')['notification-activity-description'], /Wehe i ka māka/);
for (const code of ['zu', 'zu-ZA']) {
  assert.match(read(code)['notification-activity-description'], /Izikhumbuzi.*@ kuhlala kufika/);
  assert.match(read(code)['notification-activity-description'], /Susa uphawu/);
}
assert.match(read('xh')['notification-activity-description'], /Izikhumbuzo.*@ zisoloko zifika/);
assert.match(read('st')['notification-activity-description'], /Dikgopotso.*@ di fihla kamehla/);
assert.match(read('tn')['notification-activity-description'], /Dikgopotso.*@ di goroga ka metlha/);
assert.match(read('xh')['notification-activity-description'], /Susa uphawu/);
assert.match(read('st')['notification-activity-description'], /Tlosa letshwao/);
assert.match(read('tn')['notification-activity-description'], /Tlosa letshwao/);
assert.match(read('rw')['notification-activity-description'], /Ibyibutsa igihe ntarengwa.*@ bihora bigera/);
assert.match(read('rn')['notification-activity-description'], /Ivyibutsa igihe ntarengwa.*@ vyama bigushikira/);
assert.match(read('ny')['notification-activity-description'], /Zokumbutsa tsiku lomaliza.*@ zimafikabe nthawi zonse/);
for (const code of ['rw', 'rn']) assert.match(read(code)['notification-activity-description'], /Kuraho akamenyetso/);
assert.match(read('ny')['notification-activity-description'], /Chotsani chizindikiro/);
assert.match(read('bho')['notification-activity-description'], /आखिरी तारीख.*@.*हमेशा आई/);
assert.match(read('mai')['notification-activity-description'], /अंतिम तिथिक स्मरण.*@.*सदिखन अबैत रहत/);
assert.match(read('or_IN')['notification-activity-description'], /ଶେଷ ତାରିଖର ସ୍ମାରକ.*@.*ସବୁବେଳେ ଆସିବ/);
assert.match(read('bho')['notification-activity-description'], /निशान हटा दीं/);
assert.match(read('mai')['notification-activity-description'], /चिन्ह हटा दिअ/);
assert.match(read('or_IN')['notification-activity-description'], /ଚିହ୍ନ ହଟାନ୍ତୁ/);
assert.match(read('kok')['notification-activity-description'], /निमाण्या तारखेची याद.*@.*सदांच येतात/);
assert.match(read('ary')['notification-activity-description'], /التذكيرات بآخر أجل.*@ كيوصلو ديما/);
assert.match(read('kok')['notification-activity-description'], /खूण काडात/);
assert.match(read('ary')['notification-activity-description'], /حيّد العلامة/);
assert.match(read('yi')['notification-activity-description'], /דערמאָנונגען וועגן דעם לעצטן טערמין.*@ קומען שטענדיק אָן/);
assert.match(read('nd')['notification-activity-description'], /Izikhumbuzo zosuku lokucina.*@ kuhlala kufika/);
assert.match(read('ss')['notification-activity-description'], /Tikhumbuto telusuku lwekugcina.*@ kuhlala kufika/);
assert.match(read('yi')['notification-activity-description'], /נעמט אַראָפּ דעם צייכן/);
assert.match(read('nd')['notification-activity-description'], /Susa uphawu/);
assert.match(read('ss')['notification-activity-description'], /Susa luphawu/);
assert.match(read('nso')['notification-activity-description'], /Dikgopotšo tša letšatši la mafelelo.*@ di fihla ka mehla/);
assert.match(read('ts')['notification-activity-description'], /Switsundzuxo swa siku ro hetelela.*@ swi fika nkarhi hinkwawo/);
assert.match(read('nso')['notification-activity-description'], /Tloša leswao/);
assert.match(read('ts')['notification-activity-description'], /Susa mfungho/);
assert.match(read('om')['notification-activity-description'], /Yaadachiisni guyyaa xumuraa.*@.*yeroo hunda ni dhufu/);
assert.match(read('fj')['notification-activity-description'], /ivakananumi ni siga me oti kina.*@ ena yaco tiko ga/);
assert.match(read('to')['notification-activity-description'], /kei aʻu maʻu pē.*fakamanatu.*@/);
assert.match(read('om')['notification-activity-description'], /mallattoo isaa haqi/);
assert.match(read('fj')['notification-activity-description'], /Kauta laivi na ivakatakilakila/);
assert.match(read('to')['notification-activity-description'], /Toʻo ʻa e fakaʻilonga/);
assert.match(read('gv')['notification-activity-description'], /Gow y cowrey ersooyl/);
assert.match(read('gv')['notification-activity-description'], /Hig cooinaghtanyn.*@ dy kinjagh/);
assert.match(read('wa')['notification-activity-description'], /Discochîz/);
assert.match(read('wa')['notification-activity-description'], /Les rapels di date limite.*@ arivèt todi/);
assert.match(read('wa-RR')['notification-activity-description'], /Kuhaa an marka/);
assert.match(read('wa-RR')['notification-activity-description'], /pahinumdom.*@ naabot pirme/);
assert.notEqual(read('wa')['notification-activity-description'], read('wa-RR')['notification-activity-description'], 'Walloon and Waray-Waray are separate languages');
assert.match(read('ak')['notification-activity-description'], /Yi ahyɛnsode/);
assert.match(read('ak')['notification-activity-description'], /Da a wɔde wie adwuma.*@.*bɛba bere nyinaa/);
assert.match(read('lg')['notification-activity-description'], /Ggyako akabonero/);
assert.match(read('lg')['notification-activity-description'], /Obujjukiza.*@ bijja bulijjo/);
assert.match(read('bm')['notification-activity-description'], /Taamasiyɛn bɔ/);
assert.match(read('bm')['notification-activity-description'], /Baara laban don hakilijiginniw.*@.*tuma bɛɛ/);
assert.match(read('wo')['notification-activity-description'], /Dindil màndarga/);
assert.match(read('wo')['notification-activity-description'], /Fàttali.*@ dinañu ñëw saa su nekk/);
assert.match(read('ee')['notification-activity-description'], /Ɖe dzesia ɖa/);
assert.match(read('ee')['notification-activity-description'], /ɖoa ŋku dɔwuɣi dzi.*@ ava ɣe sia ɣi/);
assert.match(read('rup')['notification-activity-description'], /Scoati semnul/);
assert.match(read('rup')['notification-activity-description'], /Amintirli ti dzua di bitisiri.*@ yin totãna/);
assert.match(read('bua')['notification-activity-description'], /тэмдэгые абажа/);
assert.match(read('bua')['notification-activity-description'], /болзор тухай һануулганууд.*@.*хододоо ерэхэ/);
assert.match(read('sah')['notification-activity-description'], /бэлиэни ылан/);
assert.match(read('sah')['notification-activity-description'], /күн туһунан санатыылар.*@.*куруук кэлэллэр/);
assert.match(read('cv')['notification-activity-description'], /паллӑне илсе пӑрахӑр/);
assert.match(read('cv')['notification-activity-description'], /аса илтерӳсем.*@.*яланах килеҫҫӗ/);
for (const code of ['bua', 'sah', 'cv']) {
  for (const key of keys) assert.match(read(code)[key], /[А-Яа-яӐӑӖӗӲӳҪҫҺһҤҥӨөҮү]/, `${code}:${key}: Cyrillic prose`);
}
assert.match(read('ve')['notification-activity-description'], /Bvisani luswayo/);
assert.match(read('ve')['notification-activity-description'], /Khumbudzo.*@ zwi dzula zwi tshi swika/);
assert.match(read('ve-CC')['notification-activity-description'], /Cava el segno/);
assert.match(read('ve-CC')['notification-activity-description'], /promemoria.*@ riva senpre/);
const venda = read('ve');
for (const [key, wrong] of Object.entries({list: 'Uhlu', swimlane: 'Swembaan', members: 'Amalungu', assignees: 'Ababelwe', attachments: 'Okunamathiselwe', checklists: 'Izinhla zokuhlola'})) {
  assert.notEqual(venda[key], wrong, `ve:${key}: remove wrong-language seed`);
}
assert.match(venda.members, /Miraḓo/);
assert.match(venda.assignees, /avhelwaho mushumo/);
assert.match(venda.swimlane, /Nḓila ya mushumo/);
assert.match(read('se')['notification-activity-description'], /Váldde mearkka eret/);
assert.match(read('se')['notification-activity-description'], /Áigemeari muittuhusat ja @-namahusat bohtet álo/);
assert.match(read('ace')['notification-activity-description'], /Bôh tanda/);
assert.match(read('ace')['notification-activity-description'], /Haba peuingat keu uroe akhé.*@ sabe teuka/);
assert.match(read('bo')['notification-activity-description'], /འདེམས་རྟགས་བསུབས་ན/);
assert.match(read('bo')['notification-activity-description'], /དྲན་སྐུལ.*@.*རྟག་ཏུ་འབྱོར་ཡོང/);
for (const key of keys) assert.match(read('bo')[key], /[\u0F00-\u0FFF]/, `bo:${key}: Tibetan script`);
assert.match(read('dz')['notification-activity-description'], /རྟགས་བསལ་ཏེ/);
assert.match(read('dz')['notification-activity-description'], /དྲན་སྐུལ.*@.*ཨ་རྟག་ར་འོངམ་ཨིན/);
for (const key of keys) assert.match(read('dz')[key], /[\u0F00-\u0FFF]/, `dz:${key}: expected script`);
assert.notEqual(read('dz')['notification-activity-description'], read('bo')['notification-activity-description'], 'Dzongkha and Tibetan are distinct languages');
assert.match(read('ti')['notification-activity-description'], /ምልክት ኣልዕል/);
assert.match(read('ti')['notification-activity-description'], /መዘኻኸሪታትን.*@.*ኩሉ ግዜ ይበጽሑ/);
for (const key of keys) assert.match(read('ti')[key], /[\u1200-\u137F]/, `ti:${key}: Ethiopic script`);
assert.match(read('ks')['notification-activity-description'], /ہٹٲیو نِشان/);
assert.match(read('ks')['notification-activity-description'], /یاددہٲنی.*@.*ہَمیشَہ واتان/);
for (const key of keys) assert.match(read('ks')[key], /[\u0600-\u06FF]/, `ks:${key}: Arabic script`);
assert.match(read('qu')['notification-activity-description'], /unanchata hurquy/);
assert.match(read('qu')['notification-activity-description'], /yuyachiykuna.*@.*sapa kuti chayamun/);
assert.match(read('ay')['notification-activity-description'], /ajlliñ apsuñamawa/);
assert.match(read('ay')['notification-activity-description'], /amtayañanaka.*@.*taqi kuti purinipxi/);
assert.match(read('gn')['notification-activity-description'], /Eipe'a techaukaha/);
assert.match(read('gn')['notification-activity-description'], /momandu'aha.*@.*og̃uahẽ tapiaite/);
assert.match(read('ff')['notification-activity-description'], /Ittu maande/);
assert.match(read('ff')['notification-activity-description'], /Siftinooje ñalngu timmugol.*@ ngara sahaa kala/);
assert.match(read('vo')['notification-activity-description'], /Sämarkolöd/);
assert.match(read('vo')['notification-activity-description'], /Memükams tefü dät finik.*@ ai rivons/);
assert.equal(read('vo').members, 'Limans', 'Volapük member label must not use Esperanto Membroj');
assert.match(read('tlh')['notification-activity-description'], /yIwIvHa'/);
assert.match(read('tlh')['notification-activity-description'], /reH paw.*jaj luqawmoHbogh QInmey.*@/);
assert.equal(read('tlh').assignees, "Qu' HevwI'pu'", 'Klingon assignees must not retain French Intervenants');
assert.match(read('kl')['notification-activity-description'], /nalunaaqutaa peeruk/);
assert.match(read('kl')['notification-activity-description'], /Piffissaliussaq pillugu eqqaasitsissutit.*@.*tamatigut takkuttarput/);
assert.match(read('nah')['notification-activity-description'], /Xicquixti in machiotl/);
assert.match(read('nah')['notification-activity-description'], /mitzilnamiquiltia in tonalli tlamiliztli.*@ nochipa ahci/);
assert.match(read('ve-PP')['notification-activity-description'], /Heitä znam/);
assert.match(read('ve-PP')['notification-activity-description'], /päiväs muštatabai tedotuzed.*@.*kaiken tuloba/);
assert.match(read('zgh')['notification-activity-description'], /ⴽⴽⵙ ⴰⵔⵛⵓⵎ/);
assert.match(read('zgh')['notification-activity-description'], /ⵉⵙⵎⴽⵜⴰⵢⵏ.*ⵜⴳⴳⴰⵔⴰ.*@.*ⴰⴱⴷⴰ/);
for (const key of keys) {
  assert.match(read('zgh')[key], /[\u2D30-\u2D7F]/u, `zgh:${key}: Tifinagh text`);
  assert.doesNotMatch(read('zgh')[key], /[A-Za-z]/, `zgh:${key}: no English seed text`);
}
assert.match(read('iu')['notification-activity-description'], /ᓇᓗᓇᐃᒃᑯᑕᖓ ᐲᕐᓗᒍ/);
assert.match(read('iu')['notification-activity-description'], /ᐃᓱᓕᕝᕕᒃᓴᒧᑦ ᐃᖅᑲᐃᑎᑦᑎᔾᔪᑏᑦ.*@.*ᑕᒪᑎᒍᑦ ᑎᑭᑉᐸᒃᑐᑦ/);
for (const key of keys) {
  assert.match(read('iu')[key], /[\u1400-\u167F]/u, `iu:${key}: syllabic text`);
  assert.doesNotMatch(read('iu')[key], /[A-Za-z]/, `iu:${key}: no English seed text`);
}
assert.match(read('wal')['notification-activity-description'], /malaataa digga/);
assert.match(read('wal')['notification-activity-description'], /gallassaa hassayissiya.*@.*ubba wode yaana/);
assert.match(read('tig')['notification-activity-description'], /እሻረት ምሳሕ/);
assert.match(read('tig')['notification-activity-description'], /ተዝኪር.*@.*ዲማ ልመጽእ/);
for (const key of keys) {
  assert.match(read('tig')[key], /[\u1200-\u137F]/u, `tig:${key}: Ethiopic text`);
  assert.doesNotMatch(read('tig')[key], /[A-Za-z]/, `tig:${key}: no English seed text`);
}
assert.match(read('chr')['notification-activity-description'], /ᎪᏪᎳᏅᎯ ᎯᏲᏍᏓ/);
assert.match(read('chr')['notification-activity-description'], /ᎠᏓᏅᏓᏗᏍᏙᏗ.*@.*ᏂᎪᎯᎸ/);
for (const key of keys) {
  assert.match(read('chr')[key], /[\u13A0-\u13FF]/u, `chr:${key}: Cherokee syllabics`);
  assert.doesNotMatch(read('chr')[key], /[A-Za-z]/, `chr:${key}: no English seed text`);
}
const localeFiles = fs.readdirSync(path.join(__dirname, '../imports/i18n/data'))
  .filter(file => file.endsWith('.i18n.json') && !/^en(?:[-_.])/.test(file));
assert.equal(localeFiles.length, 234, 'all non-English locale paths are covered');
for (const file of localeFiles) {
  const code = file.replace('.i18n.json', '');
  const locale = read(code);
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${code}:${key}: nonempty`);
    assert.notEqual(locale[key], en[key], `${code}:${key}: no English placeholder`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${code}:${key}: exact tokens`);
  }
}
console.log('Notification activity translations: 13 messages in all 234 non-English locales; detailed checks in 66 locales passed');
