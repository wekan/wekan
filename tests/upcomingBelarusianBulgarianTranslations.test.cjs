'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'imports', 'i18n', 'data');
const read = code => JSON.parse(
  fs.readFileSync(path.join(DATA, code + '.i18n.json'), 'utf8'),
);
const en = read('en');
const languages = ['be', 'bg'];
const reportKeys = [
  'officeReportTitle', 'office-report-desc', 'office-logins',
  'office-first-seen', 'office-last-seen', 'office-shared',
  'office-no-results', 'api-report-desc', 'api-calls',
  'api-first-called', 'api-last-called', 'api-no-calls',
];

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('Belarusian and Bulgarian translate every report placeholder', () => {
  for (const code of languages) {
    const lang = read(code);
    for (const key of reportKeys) {
      assert.equal(typeof lang[key], 'string', code + ' lacks ' + key);
      assert.notEqual(lang[key], en[key], code + ' leaves ' + key + ' in English');
    }
  }
});

test('both translations use Cyrillic with distinct established vocabulary', () => {
  assert.equal(read('be').officeReportTitle, 'Месцы ўваходу');
  assert.equal(read('bg').officeReportTitle, 'Места за вход');
  for (const code of languages) {
    const lang = read(code);
    for (const key of reportKeys) assert.match(lang[key], /[Ѐ-ӿ]/, code + ' lacks Cyrillic in ' + key);
  }
});

test('technical tokens remain recognizable in translated descriptions', () => {
  for (const code of languages) {
    const lang = read(code);
    assert.match(lang['office-report-desc'], /IPv4/);
    assert.match(lang['office-report-desc'], /IPv6/);
    assert.match(lang['api-report-desc'], /REST API/);
    assert.match(lang['api-no-calls'], /REST API/);
    assert.match(lang['api-no-calls'], /WITH_API=true/);
  }
});

test('universal API labels remain unchanged', () => {
  for (const code of languages) {
    const lang = read(code);
    assert.equal(lang.apiReportTitle, 'API');
    assert.equal(lang['api-endpoint'], 'API');
  }
});

console.log('\nupcomingBelarusianBulgarianTranslations: ' + passed + ' tests passed');

const belarusianRecovery = read('be');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const recoveryKeys = Object.keys(en).filter(key => key.startsWith('stuck-sync-operation-'));
assert.equal(recoveryKeys.length, 23);
for (const key of recoveryKeys) {
  assert.notEqual(belarusianRecovery[key], en[key], key);
  assert.deepEqual(translationTokens(belarusianRecovery[key]), translationTokens(en[key]), key);
}
assert.match(belarusianRecovery['stuck-sync-operation-description'], /ужо ўжытыя змены застаюцца/);
assert.match(belarusianRecovery['stuck-sync-operation-description'], /астатнія захаваныя змены ніколі не запісваюцца/);
assert.match(belarusianRecovery['stuck-sync-operation-reason-access-denied'], /права запісу ва ўсім спісе/);
assert.match(belarusianRecovery['stuck-sync-operation-replayable-now'], /нельга адкінуць/);
assert.match(belarusianRecovery['stuck-sync-operation-not-stuck'], /нельга адкінуць/);
assert.match(belarusianRecovery['stuck-sync-operation-truncated'], /50 найстарэйшых/);
assert.match(belarusianRecovery['stuck-sync-operation-busy'], /зараз сінхранізуецца/);

const interruptedImportKeys = Object.keys(en).filter(key => key.startsWith('interrupted-import-'));
assert.equal(interruptedImportKeys.length, 25);
for (const key of interruptedImportKeys) {
  assert.notEqual(belarusianRecovery[key], en[key], key);
  assert.deepEqual(translationTokens(belarusianRecovery[key]), translationTokens(en[key]), key);
}
assert.match(belarusianRecovery['interrupted-import-description'], /зыходны файл не захоўваецца/);
assert.match(belarusianRecovery['interrupted-import-description'], /ўсё, што было дададзена пазней/);
assert.match(belarusianRecovery['interrupted-import-counts'], /__swimlanes__ дарожак/);
assert.match(belarusianRecovery['interrupted-import-discard-confirm'], /выдаленыя назаўсёды/);
assert.match(belarusianRecovery['interrupted-import-keep-confirm'], /Нічога не выдаляецца/);
assert.match(belarusianRecovery['interrupted-import-foreign-board'], /не была зменена/);
assert.match(belarusianRecovery['interrupted-import-truncated'], /50 найстарэйшых/);
assert.match(belarusianRecovery['interrupted-import-scrum-busy'], /яшчэ запісваецца або аднаўляецца/);
