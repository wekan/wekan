 'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const tags=["de", "fr", "es", "it", "pt", "pt-BR", "nl", "sv", "da", "nb", "fi", "pl", "cs", "sk", "uk", "ru", "el", "tr", "ja", "ko", "zh-CN", "zh-TW", "ar", "he", "id", "vi", "hu", "ro", "bg", "hr", "ca", "eu", "gl", "af", "sq", "be", "bs", "sr", "sl", "mk", "lt", "lv", "is", "ms", "tl", "sw", "hi", "bn", "ta", "ml", "mr", "pa", "ur", "fa", "th", "km"];
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
