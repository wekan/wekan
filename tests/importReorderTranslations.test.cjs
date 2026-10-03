'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const en = read('en');
const keys = ['import-board-instruction-taskwarrior', 'import-board-instruction-focalboard', 'drag-to-reorder'];
const groups = [
  ['fi', 'ei tuoda', 'Ylä-', 'alanuoli'],
  ['sv', 'importeras inte', 'Uppåt-', 'nedåtpilarna'],
  ['da', 'importeres ikke', 'Pil op', 'pil ned'],
  ['nb', 'importeres ikke', 'Pil opp', 'pil ned'],
  ['de de-AT de-CH de_DE', 'nicht importiert', 'oben', 'unten'],
  ['fr fr-BE fr-CA fr-CH fr-FR', 'ne sont pas importées', 'Haut', 'Bas'],
  ['es es-AR es-CL es-CO es-LA es-MX es-PE es-PY es_CO', 'no se importan', 'arriba', 'abajo'],
  ['pt pt-PT pt_PT pt-BR', 'não são importados', 'cima', 'baixo'],
  ['it', 'non vengono importati', 'su', 'giù'],
  ['nl nl-NL vl-SS', 'niet geïmporteerd', 'omhoog', 'omlaag'],
];
let count = 0;
for (const [group, exclusion, up, down] of groups) {
  for (const code of group.split(' ')) {
    const locale = read(code);
    assert.deepEqual(Object.keys(locale), Object.keys(en), `${code}: source key order`);
    for (const key of keys) {
      assert.ok(locale[key]?.trim(), `${code}:${key}: missing text`);
      assert.notEqual(locale[key], en[key], `${code}:${key}: English placeholder`);
      assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${code}:${key}: exact tokens`);
    }
    for (const token of ['task export', 'JSON', 'Done', 'project', 'priority', 'annotations', 'depends']) {
      assert.ok(locale[keys[0]].includes(token), `${code}: Taskwarrior command, fields and destination must stay recognizable: ${token}`);
    }
    for (const token of ['.boardarchive', 'board.jsonl', exclusion]) {
      assert.ok(locale[keys[1]].includes(token), `${code}: Focalboard file format and import limitation: ${token}`);
    }
    for (const direction of [up, down]) {
      assert.ok(locale[keys[2]].includes(direction), `${code}: both keyboard directions must be explained`);
    }
    count++;
  }
}
console.log(`Import and reordering: ${keys.length} messages in ${count} locale variants passed`);
