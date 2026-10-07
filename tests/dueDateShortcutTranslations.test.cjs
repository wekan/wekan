 'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const tags=["de", "fr", "es", "it", "pt", "pt-BR", "nl", "sv", "da", "nb", "fi", "pl", "cs", "sk", "uk", "ru", "el", "tr", "ja", "ko", "zh-CN", "zh-TW", "ar", "he", "id", "vi", "hu", "ro", "bg", "hr"];
test('due-date shortcut translations exist in the restored locale key order',()=>{
 for(const tag of tags){
  const data=require('../imports/i18n/data/'+tag+'.i18n.json');
  assert.deepEqual(Object.keys(data),Object.keys(english),tag);
  const value=data['shortcut-edit-due-date'];
  assert.ok(value.trim(),tag);
  assert.notEqual(value,english['shortcut-edit-due-date'],tag);
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
