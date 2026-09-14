const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
test('Veps server error label uses the Veps error noun instead of Finnish prose', () => {
  const data = JSON.parse(fs.readFileSync('imports/i18n/data/ve-PP.i18n.json', 'utf8'));
  assert.equal(data['server-error'], 'Serveran viga');
  assert.doesNotMatch(data['server-error'], /palvelin|virhe/i);
  assert.match(data['server-error-troubleshooting'], /serveran.*viga/);
});

test('Veps complete view and removal labels replace Finnish without changing action scope', () => {
  const data = JSON.parse(fs.readFileSync('imports/i18n/data/ve-PP.i18n.json', 'utf8'));
  assert.equal(data['view-all'], 'Ozuta kaik');
  assert.equal(data['delete-all'], 'Heitä kaik');
  assert.equal(data['remove-btn'], 'Heitä');
  assert.notEqual(data['delete-all'], data['remove-btn']);
  for (const key of ['view-all', 'delete-all', 'remove-btn']) {
    assert.doesNotMatch(data[key], /näytä|poista/i);
    assert.doesNotMatch(data[key], /kel'dä/i, 'removal is not disabling');
  }
});

test('Veps title and page nouns replace Finnish and retain existing native title terminology', () => {
  const data = JSON.parse(fs.readFileSync('imports/i18n/data/ve-PP.i18n.json', 'utf8'));
  assert.equal(data['text-note-title'], data.title);
  assert.equal(data['operator-title'], data.title.toLowerCase());
  assert.equal(data.page, "Lehtpol'");
  for (const key of ['text-note-title', 'operator-title', 'page']) {
    assert.doesNotMatch(data[key], /otsikko|sivu/i);
  }
});
