'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const script = path.join(root, 'releases/translations/fill-translations.mjs');

test('fill rejects damaged variables atomically and preserves existing translations', async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  fs.mkdirSync(path.join(root, '.tools/tmp'), { recursive: true });
  const fixture = fs.mkdtempSync(path.join(root, '.tools/tmp/fill-tokens-'));
  try {
    const data = path.join(fixture, 'imports/i18n/data');
    fs.mkdirSync(data, { recursive: true });
    const source = { first: 'Save', human: 'Board', message: 'Card __card__ __card__ %s %1$d %1 %{value} %%' };
    const before = JSON.stringify({ ...source, human: 'Taulu' });
    const target = path.join(data, 'fi.i18n.json');
    fs.writeFileSync(path.join(data, 'en.i18n.json'), JSON.stringify(source));
    const proposal = path.join(fixture, 'proposal.json');
    const good = 'Kortti __card__ __card__ %s %1$d %1 %{value} %%';
    const run = value => {
      fs.writeFileSync(target, before);
      fs.writeFileSync(proposal, JSON.stringify({ first: 'Tallenna', human: 'Väärä', message: value }));
      return spawnSync(process.execPath, [script, '--apply', 'fi', proposal], { cwd: fixture, encoding: 'utf8' });
    };
    for (const bad of [good.replace('__card__', '__kortti__'), good.replace('__card__', '__карта__'),
      good.replace('__card__', ''), good + ' __карта__', good.replace('%1$d', '%d'),
      good.replace('%s', '%d'), good.replace('%1 ', '%2 '), good.replace('%{value}', '%{arvo}'),
      good.replace('%%', '%'), good + ' %s', good.replace('__card__', '_card_')]) {
      const result = run(bad);
      assert.equal(result.status, 1, result.stderr);
      assert.match(result.stderr, /broken source placeholders/);
      assert.equal(fs.readFileSync(target, 'utf8'), before, 'no partial batch is written');
    }
    const result = run(good);
    assert.equal(result.status, 0, result.stderr);
    const after = JSON.parse(fs.readFileSync(target));
    assert.equal(after.first, 'Tallenna');
    assert.equal(after.human, 'Taulu');
    assert.equal(after.message, good);
    assert.deepEqual(translationTokens(after.message), translationTokens(source.message));
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test('every locale preserves the complete source variable inventory', async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const directory = path.join(root, 'imports/i18n/data');
  const source = JSON.parse(fs.readFileSync(path.join(directory, 'en.i18n.json')));
  for (const file of fs.readdirSync(directory).filter(file => file.endsWith('.i18n.json'))) {
    const locale = JSON.parse(fs.readFileSync(path.join(directory, file)));
    for (const [key, value] of Object.entries(source)) {
      assert.deepEqual(translationTokens(locale[key]), translationTokens(value), `${file}:${key}`);
    }
  }
});

test('technical symbols do not hide adjacent Blockly prose or changed source text', () => {
  const fixture = fs.mkdtempSync(path.join(root, '.tools/tmp/blockly-symbols-'));
  try {
    const directory = path.join(fixture, 'imports/i18n/data');
    fs.mkdirSync(directory, { recursive: true });
    const source = {
      'blockly-CHROME_OS': 'ChromeOS', 'blockly-LOGIC_NULL': 'null',
      'blockly-MATH_TRIG_ACOS': 'acos', 'blockly-MATH_TRIG_ACOS_ARIA': 'inverse cosine',
      'blockly-LOGIC_NULL_TOOLTIP': 'Returns null.',
      'blockly-WINDOWS': 'Choose Windows as the operating system',
      ordinary: 'Keep the card __card__',
    };
    for (const code of ['en', 'xx']) fs.writeFileSync(path.join(directory, code + '.i18n.json'), JSON.stringify(source));
    const result = spawnSync(process.execPath, [script, '--list', 'xx'], { cwd: fixture, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), Object.fromEntries(Object.entries(source).slice(3)));
  } finally { fs.rmSync(fixture, { recursive: true, force: true }); }
});
