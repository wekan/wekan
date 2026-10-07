'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const en = read('en');
const keys = Object.keys(en).filter(key => key.startsWith('due-reminder-'));
assert.equal(keys.length, 6);
for (const code of ['tk_TM', 'tt', 'so', 'ku', 'ckb', 'pap', 'tpi', 'bi', 'mi', 'sm', 'haw', 'zu', 'zu-ZA', 'xh', 'st', 'tn', 'rw', 'rn', 'ny', 'bho', 'mai', 'or_IN', 'kok']) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(en), `${code}: source key order`);
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${code}:${key}: nonempty`);
    assert.notEqual(locale[key], en[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${code}:${key}: exact source tokens`);
  }
  assert.match(locale['due-reminder-days-label'], /0/, `${code}: due-day zero`);
  assert.deepEqual(locale['due-reminder-invalid'].match(/-?\d+/g), ['-14', '14'], `${code}: signed range retained`);
  assert.match(locale['due-reminder-webhook'], /webhook/, `${code}: webhook terminology`);
  assert.notEqual(locale['due-reminder-invalid'], locale['due-reminder-saved'], `${code}: success differs from error`);
}
assert.match(read('tk_TM')['due-reminder-days-label'], /otur.*položitel.*öňki.*otrisatel.*soňky.*boş/);
assert.match(read('tt')['due-reminder-days-label'], /өтер.*уңай.*кадәрге.*тискәре.*соңгы.*буш/);
assert.match(read('so')['due-reminder-days-label'], /hakadyo.*togan.*horreeya.*taban.*dambeeya.*bannaan/);
assert.match(read('tk_TM')['due-reminder-invalid'], /iň köp on.*bitin/);
assert.match(read('tt')['due-reminder-invalid'], /иң күбе ун бөтен/);
assert.match(read('so')['due-reminder-invalid'], /ugu badnaan toban.*tiro dhan/);
assert.match(read('ku')['due-reminder-days-label'], /virgulê.*erênî.*berî.*neyînî.*piştî.*vala/);
assert.match(read('ckb')['due-reminder-days-label'], /کۆما.*ئەرێنی.*پێش.*نەرێنی.*دوای.*بەتاڵی/);
assert.match(read('pap')['due-reminder-days-label'], /koma.*positivo.*promé.*negativo.*despues.*bashí/);
assert.match(read('ku')['due-reminder-invalid'], /Herî zêde deh rojên tam/);
assert.match(read('ckb')['due-reminder-invalid'], /زۆرترین دە ڕۆژی تەواو/);
assert.match(read('pap')['due-reminder-invalid'], /máksimo dies dia henter/);
assert.match(read('tpi')['due-reminder-days-label'], /koma.*winim 0.*paslain.*aninit long 0.*bihain.*stap nating/);
assert.match(read('bi')['due-reminder-days-label'], /koma.*moa long 0.*bifo.*daon long 0.*afta.*emti/);
assert.match(read('tpi')['due-reminder-invalid'], /tenpela de tasol.*namba olgeta/);
assert.match(read('bi')['due-reminder-invalid'], /ten dei nomo.*mak antap.*ful namba/);
assert.match(read('mi')['due-reminder-days-label'], /piko.*tōrunga.*mua.*tōraro.*muri.*pātea/);
assert.match(read('sm')['due-reminder-days-label'], /koma.*sili i le 0.*lumanaʻi.*itiiti i le 0.*mavae.*avanoa/);
assert.match(read('haw')['due-reminder-days-label'], /koma.*ʻoi aku i ka 0.*mua.*emi iho i ka 0.*hope.*hakahaka/);
assert.match(read('mi')['due-reminder-invalid'], /kaua e neke atu.*tekau.*tauoti/);
assert.match(read('sm')['due-reminder-invalid'], /lē sili atu.*sefulu.*numera atoa/);
assert.match(read('haw')['due-reminder-invalid'], /helu piha.*ʻumi a emi mai/);
for (const code of ['zu', 'zu-ZA']) {
  assert.match(read(code)['due-reminder-days-label'], /ngokhefana.*ezingaphezu.*ezingaphambi.*ezingaphansi.*ezingemva.*kungenalutho/);
  assert.match(read(code)['due-reminder-invalid'], /ezingadluli kweziyishumi.*eziphelele/);
}
assert.match(read('xh')['due-reminder-days-label'], /ngeekoma.*angaphezu.*ezingaphambi.*angaphantsi.*ezingemva.*kungenanto/);
assert.match(read('st')['due-reminder-days-label'], /diphegelwana.*kahodimo.*pele.*ka tlase.*kamora.*ho se na letho/);
assert.match(read('tn')['due-reminder-days-label'], /diphegelwana.*fetang.*pele.*kwa tlase.*morago.*go se na sepe/);
assert.match(read('xh')['due-reminder-invalid'], /ezingadlulanga kwishumi.*apheleleyo/);
assert.match(read('st')['due-reminder-invalid'], /sa feteng leshome.*felletseng/);
assert.match(read('tn')['due-reminder-invalid'], /sa feteng lesome.*feletseng/);
assert.match(read('rw')['due-reminder-days-label'], /udukitso.*iruta 0.*ibanziriza.*munsi ya 0.*iwukurikira.*ubusa/);
assert.match(read('rn')['due-reminder-days-label'], /udukitso.*biruta 0.*ibanziriza.*munsi ya 0.*iwukurikira.*ubusa/);
assert.match(read('ny')['due-reminder-days-label'], /makoma.*oposa 0.*asanafike.*ochepera 0.*pambuyo.*popanda kanthu/);
assert.match(read('rw')['due-reminder-invalid'], /itarenze icumi.*yuzuye/);
assert.match(read('rn')['due-reminder-invalid'], /itarenga cumi.*vyuzuye/);
assert.match(read('ny')['due-reminder-invalid'], /osapitirira khumi.*athunthu/);
assert.match(read('bho')['due-reminder-days-label'], /कॉमा.*धनात्मक.*पहिले.*ऋणात्मक.*बाद.*खाली/);
assert.match(read('mai')['due-reminder-days-label'], /कॉमा.*धनात्मक.*पहिनेक.*ऋणात्मक.*बादक.*खाली/);
assert.match(read('or_IN')['due-reminder-days-label'], /କମା.*ଧନାତ୍ମକ.*ପୂର୍ବର.*ଋଣାତ୍ମକ.*ପରର.*ଖାଲି/);
assert.match(read('kok')['due-reminder-days-label'], /कॉमान.*धन संख्या.*आदले.*ऋण संख्या.*उपरांतचे.*रिकामें/);
assert.match(read('bho')['due-reminder-invalid'], /पूरा संख्या.*जादे से जादे दस/);
assert.match(read('mai')['due-reminder-invalid'], /पूर्ण संख्या.*बेसीसँ बेसी दस/);
assert.match(read('or_IN')['due-reminder-invalid'], /ପୂର୍ଣ୍ଣ ସଂଖ୍ୟା.*ସର୍ବାଧିକ ଦଶଟି/);
assert.match(read('kok')['due-reminder-invalid'], /पूर्ण संख्यांनी चडांत चड धा/);
for (const code of ['bho', 'mai', 'kok']) {
  for (const key of keys) assert.match(read(code)[key], /[\u0900-\u097F]/u, `${code}:${key}: Devanagari`);
}
for (const key of keys) assert.match(read('or_IN')[key], /[\u0B00-\u0B7F]/u, `${key}: Odia script`);
console.log('Due reminder translations: 6 messages in 23 locales passed');
