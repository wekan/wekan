 'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const tags=["de", "fr", "es", "it", "pt", "pt-BR", "nl", "sv", "da", "nb", "fi", "pl", "cs", "sk", "uk", "ru", "el", "tr", "ja", "ko", "zh-CN", "zh-TW", "ar", "he", "id", "vi", "hu", "ro", "bg", "hr", "ca", "eu", "gl", "af", "sq", "be", "bs", "sr", "sl", "mk", "lt", "lv", "is", "ms", "tl", "sw", "hi", "bn", "ta", "ml", "mr", "pa", "ur", "fa", "th", "km", "az", "uz", "kk", "mn", "hy", "ka", "ne", "eo", "cy", "ga", "et-EE", "te-IN", "gu-IN", "en-GB", "ar-DZ", "ar-EG", "az-AZ", "az-LA", "cs-CZ", "cy-GB", "de-AT", "de-CH", "el-GR", "en-BR", "en-DE", "en-IT", "en-MY", "en-YS", "es-AR", "es-CL", "es-CO", "es-LA", "es-MX", "es-PE", "es-PY", "fa-IR", "fr-BE", "fr-CA", "fr-CH", "fr-FR", "he-IL", "hi-IN", "ja-HI", "ja-JP", "km-KH", "ko-KR", "ms-MY", "nl-NL", "pl-PL", "pt-PT", "ro-RO", "ru-RU", "ru-UA", "uk-UA", "uz-LA", "uz-UZ", "vi-VN", "zh-GB", "zh-HK", "zh-Hans", "zh-Hant"];
test('due-date shortcut translations exist in the restored locale key order',()=>{
 for(const tag of tags){
  const data=require('../imports/i18n/data/'+tag+'.i18n.json');
  assert.deepEqual(Object.keys(data),Object.keys(english),tag);
  const value=data['shortcut-edit-due-date'];
  assert.ok(value.trim(),tag);
  if(!tag.startsWith('en-')) assert.notEqual(value,english['shortcut-edit-due-date'],tag);
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
