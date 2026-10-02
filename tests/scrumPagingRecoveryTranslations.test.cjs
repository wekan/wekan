// Paging and import recovery are distinct actions; do not lose the count token.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const codes = ["ace", "af", "af_ZA", "ak", "am", "an", "ar", "ar-DZ", "ar-EG", "ary", "as", "ast-ES", "ay", "az", "az-AZ", "az-LA", "ba", "be", "bg", "bho", "bi", "bm", "bn", "bo", "br", "bs", "bua", "ca", "ca@valencia", "ca_ES", "ckb", "cmn", "co", "cs", "cs-CZ", "csb", "cv", "cy", "cy-GB", "da", "de", "de-AT", "de-CH", "de_DE", "dz", "ee", "el", "el-GR", "eo", "es", "es-AR", "es-CL", "es-CO", "es-LA", "es-MX", "es-PE", "es-PY", "es_CO", "et-EE", "eu", "fa", "fa-IR", "ff", "fi", "fj", "fo", "fr", "fr-BE", "fr-CA", "fr-CH", "fr-FR", "fur", "fy", "fy-NL", "ga", "gd", "gl", "gl-ES", "gn", "gu-IN", "gv", "ha", "haw", "he", "he-IL", "hi", "hi-IN", "hr", "hsb", "ht", "hu", "hy", "id", "ig", "is", "it", "ja", "ja-HI", "ja-JP", "jv", "ka", "kk", "km", "km-KH", "km_KH", "kn", "ko", "ko-KR", "kok", "ks", "ku", "kw", "ky", "la", "lb", "lg", "lld", "lt", "lv", "mai", "mg", "mi", "mk", "ml", "mn", "mr", "ms", "ms-MY", "mt", "my", "nap", "nb", "nd", "ne", "nl", "nl-NL", "nso", "ny", "oc", "om", "or_IN", "pa", "pap", "pl", "pl-PL", "ps", "pt", "pt-BR", "pt-PT", "pt_PT", "qu", "rm", "rn", "ro", "ro-RO", "ru", "ru-RU", "ru-UA", "ru_RU", "rup", "rw", "sah", "sc", "scn", "sd", "se", "si", "sk", "sl", "sl_SI", "sm", "sn", "so", "sq", "sr", "ss", "st", "sv", "sw", "szl", "ta", "te-IN", "tg", "th", "ti", "tk_TM", "tl", "tlh", "tn", "to", "tpi", "tr", "ts", "tt", "ug", "uk", "uk-UA", "ur", "uz", "uz-AR", "uz-LA", "uz-UZ", "ve", "ve-CC", "ve-PP", "vi", "vi-VN", "vl-SS", "vo", "wa", "wa-RR", "wo", "wuu-Hans", "xh", "yi", "yo", "yue_CN", "zh", "zh-CN", "zh-GB", "zh-HK", "zh-Hans", "zh-Hant", "zh-TW", "zh_SG", "zu", "zu-ZA", "kl", "nah", "tig", "wal", "zgh", "iu", "chr"];
const keys = ["scrum-show-more", "scrum-import-resume", "scrum-import-discard", "scrum-import-recovery-hint"];
for (const code of codes) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(english), `${code}: source order`);
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${code}:${key}: nonempty`);
    assert.notEqual(locale[key], english[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.notEqual(locale[keys[1]], locale[keys[2]], `${code}: finish and discard are distinct actions`);
}
assert.match(read('kl')[keys[3]], /naammassineqarsinnaavoq.*taamaallaat igineqarsinnaavoq.*allanngortitsinngilaq/);
const scripts = {
  chr: 'Cherokee',
  iu: 'Canadian_Aboriginal',
  zgh: 'Tifinagh',
  ks: 'Arabic', bo: 'Tibetan', dz: 'Tibetan', ti: 'Ethiopic', tig: 'Ethiopic',
  'uz-AR': 'Arabic',
  ba: 'Cyrillic', bua: 'Cyrillic', cv: 'Cyrillic', sah: 'Cyrillic',
  ary: 'Arabic', 'wuu-Hans': 'Han', yue_CN: 'Han', bho: 'Devanagari', mai: 'Devanagari', kok: 'Devanagari',
  hy: 'Armenian', ka: 'Georgian', am: 'Ethiopic', ml: 'Malayalam', mr: 'Devanagari', pa: 'Gurmukhi', 'te-IN': 'Telugu', or_IN: 'Oriya', si: 'Sinhala', my: 'Myanmar', km: 'Khmer', 'km-KH': 'Khmer', km_KH: 'Khmer', mn: 'Cyrillic',
  kk: 'Cyrillic', ky: 'Cyrillic', tg: 'Cyrillic', tt: 'Cyrillic', ps: 'Arabic', sd: 'Arabic', ug: 'Arabic', ckb: 'Arabic', yi: 'Hebrew', as: 'Bengali',
  fa: 'Arabic', 'fa-IR': 'Arabic', ur: 'Arabic', ar: 'Arabic', 'ar-DZ': 'Arabic', 'ar-EG': 'Arabic',
  he: 'Hebrew', 'he-IL': 'Hebrew',
  sr: 'Cyrillic', mk: 'Cyrillic', be: 'Cyrillic', ru: 'Cyrillic', 'ru-RU': 'Cyrillic', 'ru-UA': 'Cyrillic', ru_RU: 'Cyrillic', uk: 'Cyrillic', 'uk-UA': 'Cyrillic', bg: 'Cyrillic',
  hi: 'Devanagari', 'hi-IN': 'Devanagari', ne: 'Devanagari', bn: 'Bengali', ta: 'Tamil', 'gu-IN': 'Gujarati', kn: 'Kannada', th: 'Thai',
  ko: 'Hangul', 'ko-KR': 'Hangul', zh: 'Han', 'zh-CN': 'Han', 'zh-TW': 'Han', 'zh-HK': 'Han', 'zh-Hans': 'Han', 'zh-Hant': 'Han', 'zh-GB': 'Han', zh_SG: 'Han', cmn: 'Han',
};
for (const [code, script] of Object.entries(scripts)) {
  for (const key of keys) {
    const prose = read(code)[key].replace('__count__', '');
    assert.match(prose, new RegExp(`\\p{Script=${script}}`, 'u'), `${code}:${key}: native script`);
    assert.doesNotMatch(prose, /[A-Za-z]/, `${code}:${key}: unexpected Latin text`);
  }
}
assert.match(read('se')[keys[3]], /dušše bálkestit.*ii rievdat maidege/);
assert.match(read('bm')[keys[3]], /dabila dɔrɔn.*tɛ foyi yɛlɛma/);
assert.match(read('wo')[keys[3]], /neenal rekk.*soppiwul dara/);
assert.match(read('uz-AR')[keys[3]], /فقط بېکار قیلیش.*هېچ نرسه/);
assert.match(read('tlh')[keys[1]], /yIrInmoH/);
assert.match(read('tlh')[keys[2]], /yIqIl/);
assert.match(read('tlh')[keys[3]], /DaqIllaH neH.*pagh choHmoHlu'/);
assert.match(read('ee')[keys[1]], /Wu.*nu/);
assert.match(read('ee')[keys[3]], /agbe.*ko.*metrɔ naneke/);
assert.match(read('ff')[keys[1]], /Timmin/);
assert.match(read('ff')[keys[3]], /firteede tan.*waylataa hay huunde/);
assert.match(read('ve')[keys[3]], /u dzhenisa.*fhedzi.*a zwi shanduli tshithu/i);
assert.doesNotMatch(read('ve')[keys[3]], /ukungenisa|akushintshi/);
assert.match(read('ss')[keys[3]], /kungakhanselwa kuphela.*akuguculi lutfo/);
assert.match(read('om')[keys[3]], /haqamuu qofa.*homaa hin jijjiiru/);
assert.match(read('sah')[keys[3]], /хараллыбатах.*тугу да уларытпат/);
assert.doesNotMatch(read('sah')[keys[3]], /бигэргэтиллибэтэх/);
assert.match(read('bua')[keys[3]], /гансал болюулжа.*юушье хубилгадаггүй/);
assert.match(read('cv')[keys[3]], /пӑрахӑҫлама ҫеҫ.*нимӗн те улӑштармасть/);
assert.match(read('gv')[keys[3]], /aahoshiaghey.*cha nod oo agh cur ass.*cha vel shen caghlaa/);
assert.match(read('kw')[keys[1]], /Gorfenna/);
assert.match(read('kw')[keys[2]], /Hedhi/);
assert.match(read('vo')[keys[1]], /Fimekön/);
assert.match(read('vo')[keys[2]], /Nosükön/);
assert.match(read('haw')[keys[1]], /Hoʻopau/);
assert.match(read('haw')[keys[2]], /Hoʻōki/);
assert.match(read('zu')[keys[3]], /uhlelo lokungenisa.*kuphela.*akushintshi lutho/);
assert.match(read('ary')[keys[3]], /غير نلغيوه.*ما كيبدّل والو/);
assert.match(read('wuu-Hans')[keys[3]], /呒没.*只好放弃.*勿会改动/);
assert.match(read('rm')[keys[3]], /avià danovamain.*mo vegnir rebuttà.*na mida nagut/);
assert.doesNotMatch(read('rm')[keys[3]], /reaviada/);
assert.match(read('fo')[keys[3]], /byrjaði av nýggjum.*bara til at sleppa.*broytir einki/);
assert.doesNotMatch(read('fo')[keys[3]], /endurræsing/);
assert.match(read('mn')[keys[3]], /зөвхөн цуцлах.*юу ч өөрчлөхгүй/);
assert.match(read('uz')[keys[3]], /faqat bekor.*hech narsani o‘zgartirmaydi/);
assert.match(read('sw')[keys[3]], /tu kughairiwa.*halibadilishi chochote/);
assert.match(read('de')[keys[3]], /nur verworfen.*ändert sich nichts/);
assert.match(read('fr')[keys[3]], /uniquement être abandonnée.*ne modifie rien/);
assert.match(read('ja')[keys[3]], /破棄のみ可能.*変わりません/);
assert.match(read('fa')[keys[3]], /فقط.*لغو.*چیزی.*تغییر نمی‌دهد/);
assert.match(read('ms')[keys[3]], /hanya boleh dibatalkan.*tidak mengubah/);
assert.match(read('hr')[keys[3]], /samo odbaciti.*ništa ne mijenja/);
assert.match(read('hi')[keys[3]], /केवल रद्द.*कुछ नहीं बदलता/);
assert.match(read('eu')[keys[3]], /baztertu besterik.*ez du ezer aldatzen/);
assert.match(read('oc')[keys[3]], /reaviada/);
assert.doesNotMatch(read('oc')[keys[3]], /redémarrage/);
assert.match(read('bo')[keys[3]], /འདོར་བ་ཁོ་ན.*ཅི་ཡང་མི་བསྒྱུར/);
assert.match(read('dz')[keys[3]], /བཀོ་བཞག་རྐྱངམ་ཅིག.*ག་ནི་ཡང་མི་སོར/);
assert.match(read('ti')[keys[3]], /ክውገድ ጥራይ.*ዋላ ሓንቲ ኣይቅይርን/);
assert.notEqual(read('bo')[keys[3]], read('dz')[keys[3]], 'Dzongkha is not a Tibetan copy');
assert.match(read('ks')[keys[3]], /صرف منسوخ.*گَژھِ نہٕ.*کانٛہہ تبدیلی/);
assert.doesNotMatch(read('ks')[keys[3]], /ہو سکتا ہے|نہیں ہوگا/, 'Kashmiri must not be Urdu prose');
assert.match(read('gn')[keys[3]], /ojeheja añónte.*nomoambuéi mba'eve/);
assert.match(read('qu')[keys[3]], /saqiyllatam.*manam.*imatapas tikranchu/);
assert.match(read('ace')[keys[3]], /teubôih mantöng.*hana geugantoe sapeue/);
assert.match(read('ay')[keys[3]], /tukuyasiñjamawa/);
assert.doesNotMatch(read('ay')[keys[3]], /tukuyasiñapawa/, 'Recovery is available, not mandatory');
assert.match(read('ay')[keys[3]], /jaytañakiw.*janiw.*kuns mayjt'aykiti/);
assert.match(read('lld')[keys[3]], /pó gní finida.*ma poscibl.*ne müda nia/);
assert.match(read('rup')[keys[3]], /pãstrat ntregh.*mash.*arucatã.*nu-alãxeashti tsiva/);
assert.doesNotMatch(read('rup')[keys[3]], /aspun/, 'Saved plan must not mean a spoken plan');
assert.match(read('ve-PP')[keys[1]], /^Lopi/);
assert.match(read('ve-PP')[keys[2]], /Heitä lopmatoi/);
assert.match(read('ve-PP')[keys[3]], /vaiše heitta.*ei vajehta midägi/);
console.log(`Scrum paging and import recovery: ${keys.length} messages in ${codes.length} locales passed`);

assert.match(read("nah")[keys[3]], /amo nochi omopix.*zan huel tictlamotlaz.*amo itla quipatla/);

assert.match(read("tig")[keys[3]], /ኢተዐቀበ.*ሌጣ ትቀድር.*ሓቴ ኢለቀይር/);

// Tigre and Tigrinya share a script; retain Tigre grammar and action vocabulary.
assert.match(read("tig")[keys[1]], /አትምም/);
assert.match(read("tig")[keys[3]], /እንዜ እግል.*ሌጣ/);
for (const key of keys) {
  assert.doesNotMatch(read("tig")[key], /ብዳግም|ክትውድኦ|ጥራይ|ኣይቕይርን/, `${key}: avoid Tigrinya recovery phrasing`);
}

assert.match(read("wal")[keys[3]], /naagettibeenna.*xaissana xalaala.*aybbaakka laammenna/);

assert.match(read("zgh")[keys[3]], /ⴰⵙⴽⴽⵙ ⴽⴰⵏ.*ⵓⵔ ⵉⵙⵏⴼⴰⵍ ⵡⴰⵍⵓ/);
assert.match(read("zgh").discard, /\p{Script=Tifinagh}/u);
assert.doesNotMatch(read("zgh").discard, /\p{Script=Arabic}/u);

assert.match(read("iu")[keys[3]], /ᑐᖅᑯᖅᑕᐅᓯᒪᙱᑉᐸᑦ.*ᐃᒋᑕᐅᔪᓐᓇᖅᑐᖅ ᑭᓯᐊᓂ.*ᐊᓯᔾᔩᙱᑦᑐᖅ/);

assert.match(read("chr")[keys[3]], /ᎠᏲᎯᏍᏗ ᎤᏩᏒ.*Ꮭ ᎪᎱᏍᏗ ᎦᏁᏟᏴᏍᎦ/);
