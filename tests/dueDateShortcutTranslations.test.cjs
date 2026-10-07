 'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const tags=["de", "fr", "es", "it", "pt", "pt-BR", "nl", "sv", "da", "nb", "fi", "pl", "cs", "sk", "uk", "ru", "el", "tr", "ja", "ko", "zh-CN", "zh-TW", "ar", "he", "id", "vi", "hu", "ro", "bg", "hr", "ca", "eu", "gl", "af", "sq", "be", "bs", "sr", "sl", "mk", "lt", "lv", "is", "ms", "tl", "sw", "hi", "bn", "ta", "ml", "mr", "pa", "ur", "fa", "th", "km", "az", "uz", "kk", "mn", "hy", "ka", "ne", "eo", "cy", "ga", "et-EE", "te-IN", "gu-IN", "en-GB", "ar-DZ", "ar-EG", "az-AZ", "az-LA", "cs-CZ", "cy-GB", "de-AT", "de-CH", "el-GR", "en-BR", "en-DE", "en-IT", "en-MY", "en-YS", "es-AR", "es-CL", "es-CO", "es-LA", "es-MX", "es-PE", "es-PY", "fa-IR", "fr-BE", "fr-CA", "fr-CH", "fr-FR", "he-IL", "hi-IN", "ja-HI", "ja-JP", "km-KH", "ko-KR", "ms-MY", "nl-NL", "pl-PL", "pt-PT", "ro-RO", "ru-RU", "ru-UA", "uk-UA", "uz-LA", "uz-UZ", "vi-VN", "zh-GB", "zh-HK", "zh-Hans", "zh-Hant", "af_ZA", "ca@valencia", "ca_ES", "de_DE", "en_AU", "en_ID", "en_SG", "en_TR", "en_ZA", "es_CO", "pt_PT", "sl_SI", "cmn", "zh", "zh_SG", "gl-ES", "kn", "si", "my", "ky", "tg", "ps", "sd", "am", "ckb", "ku", "ha", "yo", "ht", "mg", "lb", "fy", "fy-NL", "mt", "oc", "la", "ary", "as", "or_IN", "bho", "mai", "yue_CN", "an", "ast-ES", "br", "co", "fo", "fur", "gd", "gv", "jv", "rm", "sc", "scn", "tk_TM", "tt", "yi", "zu", "xh", "so", "ig", "sn", "ba", "bua", "bi", "fj", "haw", "kok", "kw", "lg", "mi", "nd", "nso", "ny", "om", "pap", "rn", "rw", "sm", "ss", "st", "tn", "ti", "ug", "zu-ZA", "ak", "bm", "cv", "ee", "gn", "sah", "se", "szl", "ts", "ve", "wo", "csb", "wa", "bo", "dz", "ks", "qu", "to", "hsb", "ve-CC", "ve-PP", "vl-SS", "wa-RR", "wuu-Hans", "ace", "ay", "ff", "kl", "nah", "nap", "vo", "tlh", "chr", "iu", "lld", "rup", "tig", "uz-AR", "wal", "zgh"];
test('due-date shortcut translations exist in the restored locale key order',()=>{
 for(const tag of tags){
  const data=require('../imports/i18n/data/'+tag+'.i18n.json');
  assert.deepEqual(Object.keys(data),Object.keys(english),tag);
  const value=data['shortcut-edit-due-date'];
  assert.ok(value.trim(),tag);
  if(!/^en[-_]/.test(tag)) assert.notEqual(value,english['shortcut-edit-due-date'],tag);
  else assert.equal(value,english['shortcut-edit-due-date'],tag);
  assert.deepEqual(translationTokens(value),translationTokens(english['shortcut-edit-due-date']),tag);
 }
});
test('due-date shortcut labels retain the opened-card scope in representative scripts',()=>{
 const read=tag=>require('../imports/i18n/data/'+tag+'.i18n.json')['shortcut-edit-due-date'];
 assert.match(read('de'),/geöffneten Karte/);
 assert.match(read('fr'),/carte ouverte/);
 assert.match(read('fi'),/avoimen kortin/);
 assert.match(read('ru'),/открытой карточки/);
 assert.match(read('ja'),/開いているカード/);
 assert.match(read('zh-CN'),/已打开卡片/);
 assert.match(read('ar'),/البطاقة المفتوحة/);
 assert.match(read('he'),/הכרטיס הפתוח/);
});

test('additional due-date shortcuts retain opened-card wording across scripts',()=>{
 const read=tag=>require('../imports/i18n/data/'+tag+'.i18n.json')['shortcut-edit-due-date'];
 assert.match(read('ca'),/fitxa oberta/);
 assert.match(read('eu'),/irekitako txartelaren/);
 assert.match(read('be'),/адкрытай карткі/);
 assert.match(read('hi'),/खुले कार्ड/);
 assert.match(read('bn'),/খোলা কার্ডের/);
 assert.match(read('fa'),/کارت بازشده/);
 assert.match(read('th'),/การ์ดที่เปิดอยู่/);
});

test('additional shortcut labels retain open-card scope and the English variant',()=>{
 const read=tag=>require('../imports/i18n/data/'+tag+'.i18n.json')['shortcut-edit-due-date'];
 assert.match(read('eo'),/malfermita karto/);
 assert.match(read('et-EE'),/avatud kaardi/);
 assert.match(read('mn'),/Нээлттэй картын/);
 assert.match(read('cy'),/cerdyn agored/);
 assert.match(read('ga'),/chárta oscailte/);
 assert.equal(read('en-GB'),english['shortcut-edit-due-date']);
});

test('regional shortcut variants match the corresponding language and script',()=>{
 const mapping={"ar-DZ": "ar", "ar-EG": "ar", "az-AZ": "az", "az-LA": "az", "cs-CZ": "cs", "cy-GB": "cy", "de-AT": "de", "de-CH": "de", "el-GR": "el", "en-BR": "en", "en-DE": "en", "en-IT": "en", "en-MY": "en", "en-YS": "en", "es-AR": "es", "es-CL": "es", "es-CO": "es", "es-LA": "es", "es-MX": "es", "es-PE": "es", "es-PY": "es", "fa-IR": "fa", "fr-BE": "fr", "fr-CA": "fr", "fr-CH": "fr", "fr-FR": "fr", "he-IL": "he", "hi-IN": "hi", "ja-HI": "ja", "ja-JP": "ja", "km-KH": "km", "ko-KR": "ko", "ms-MY": "ms", "nl-NL": "nl", "pl-PL": "pl", "pt-PT": "pt", "ro-RO": "ro", "ru-RU": "ru", "ru-UA": "ru", "uk-UA": "uk", "uz-LA": "uz", "uz-UZ": "uz", "vi-VN": "vi", "zh-GB": "zh-CN", "zh-HK": "zh-TW", "zh-Hans": "zh-CN", "zh-Hant": "zh-TW"};
 for(const [tag,source] of Object.entries(mapping)){
  const read=name=>require('../imports/i18n/data/'+name+'.i18n.json')['shortcut-edit-due-date'];
  assert.equal(read(tag),read(source),tag);
 }
});

test('legacy locale identifiers retain the corresponding due-date wording',()=>{
 const mapping={"af_ZA": "af", "ca@valencia": "ca", "ca_ES": "ca", "de_DE": "de", "en_AU": "en", "en_ID": "en", "en_SG": "en", "en_TR": "en", "en_ZA": "en", "es_CO": "es", "pt_PT": "pt", "sl_SI": "sl", "cmn": "zh-CN", "zh": "zh-CN", "zh_SG": "zh-CN", "gl-ES": "gl"};
 for(const [tag,source] of Object.entries(mapping)){
  const read=name=>require('../imports/i18n/data/'+name+'.i18n.json')['shortcut-edit-due-date'];
  assert.equal(read(tag),read(source),tag);
 }
});

test('additional due-date labels retain open-card scope across language families',()=>{
 const read=tag=>require('../imports/i18n/data/'+tag+'.i18n.json')['shortcut-edit-due-date'];
 assert.match(read('ky'),/Ачык карточканын/);
 assert.match(read('ku'),/karta vekirî/);
 assert.match(read('ha'),/katin da aka buɗe/);
 assert.match(read('ht'),/kat ki louvri a/);
 assert.match(read('mg'),/karatra misokatra/);
 assert.match(read('my'),/ဖွင့်ထားသောကတ်/);
});

test('further shortcut translations retain opened-card vocabulary',()=>{
 const read=tag=>require('../imports/i18n/data/'+tag+'.i18n.json')['shortcut-edit-due-date'];
 assert.match(read('lb'),/oppener Kaart/);
 assert.match(read('fy'),/iepen kaart/);
 assert.equal(read('fy'),read('fy-NL'));
 assert.match(read('mt'),/karta miftuħa/);
 assert.match(read('oc'),/carta dobèrta/);
 assert.match(read('la'),/chartae apertae/);
 assert.match(read('ary'),/البطاقة المحلولة/);
});
test('Indic and Cantonese shortcut labels identify the opened card',()=>{
 const read=tag=>require('../imports/i18n/data/'+tag+'.i18n.json')['shortcut-edit-due-date'];
 assert.match(read('as'),/খোলা কাৰ্ডৰ/);
 assert.match(read('or_IN'),/ଖୋଲା କାର୍ଡର/);
 assert.match(read('bho'),/खुलल कार्ड/);
 assert.match(read('mai'),/खुलल कार्डक/);
 assert.match(read('yue_CN'),/開緊嘅卡片/);
});
test('further language shortcuts retain the opened-card scope',()=>{
 const read=tag=>require('../imports/i18n/data/'+tag+'.i18n.json')['shortcut-edit-due-date'];
 assert.match(read('br'),/gartenn digor/);
 assert.match(read('fur'),/cjarte vierte/);
 assert.match(read('rm'),/carta averta/);
 assert.match(read('jv'),/kertu sing dibukak/);
 assert.match(read('tk_TM'),/Açyk kartyň/);
 assert.match(read('zu'),/ikhadi elivuliwe|yekhadi elivuliwe/);
 assert.match(read('so'),/kaarka furan/);
});
test('additional shortcut translations preserve opened-card scope and Zulu variant',()=>{
 const read=tag=>require('../imports/i18n/data/'+tag+'.i18n.json')['shortcut-edit-due-date'];
 assert.match(read('ba'),/Асыҡ карточканың/);
 assert.match(read('bi'),/kad we i open/);
 assert.match(read('mi'),/kāri kua tuwhera/);
 assert.match(read('ny'),/khadi lotseguka/);
 assert.match(read('rw'),/ikarita ifunguye/);
 assert.match(read('ug'),/ئېچىلغان كارتىنىڭ/);
 assert.equal(read('zu-ZA'),read('zu'));
});
test('remaining shortcut translations retain opened-card wording',()=>{
 const read=tag=>require('../imports/i18n/data/'+tag+'.i18n.json')['shortcut-edit-due-date'];
 assert.match(read('bm'),/Karti dayɛlɛlen/);
 assert.match(read('cv'),/Уҫӑ карточкӑн/);
 assert.match(read('se'),/rabas goartta/);
 assert.match(read('ts'),/khadi leri pfuriweke/);
 assert.match(read('wo'),/karta bi ubbeeku/);
});
test('shortcut translations follow the declared language of legacy tags',()=>{
 const read=tag=>require('../imports/i18n/data/'+tag+'.i18n.json')['shortcut-edit-due-date'];
 assert.match(read('ve-CC'),/scheda verta/);
 assert.match(read('ve-PP'),/avaidud kartan/);
 assert.match(read('wa-RR'),/abrido nga kard/);
 assert.match(read('vl-SS'),/geopende kaart/);
 assert.match(read('hsb'),/wočinjeneje kartki/);
 assert.match(read('qu'),/Kichasqa kartap/);
 assert.doesNotMatch(read('hsb'),/WeKan:|Otevřený/);
 assert.doesNotMatch(read('to'),/Faka-Tonga:|due/);
});
test('small-language shortcuts retain opened-card scope',()=>{
 const read=tag=>require('../imports/i18n/data/'+tag+'.i18n.json')['shortcut-edit-due-date'];
 assert.match(read('ace'),/kad nyang ka teupeuhah/);
 assert.match(read('ay'),/Jistʼarat kartan/);
 assert.match(read('kl'),/Kortip ammasup/);
 assert.match(read('nah'),/amatlapalli tlapohtoc/);
 assert.match(read('vo'),/kada maifik/);
 assert.match(read('tlh'),/'echletHom poS/);
});
test('last missing shortcut entries use their declared scripts and opened-card scope',()=>{
 const read=tag=>require('../imports/i18n/data/'+tag+'.i18n.json')['shortcut-edit-due-date'];
 assert.match(read('chr'),/ᎤᏍᏚᎢᏍᏔᏅ ᎪᏪᎵ/);
 assert.match(read('iu'),/ᒪᑐᐃᖓᔫᑉ/);
 assert.match(read('lld'),/ciarta davierta/);
 assert.match(read('wal'),/Dooyettida kaardiya/);
 assert.match(read('zgh'),/ⵜⴽⴰⵔⴹⴰ ⵉⵔⵥⵎⵏ/);
 assert.match(read('uz-AR'),/آچیق کارت/);
 assert.doesNotMatch(read('uz-AR'),/[A-Za-z]/);
 assert.doesNotMatch(read('wal'),/Wolayttatto:|Open/);
});
