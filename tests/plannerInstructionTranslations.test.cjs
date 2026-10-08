'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const key = 'import-board-instruction-planner';
const source = read('en')[key];
for (const code of ['wuu-Hans', 'pap', 'yi']) {
  const value = read(code)[key];
  assert.notEqual(value, source, code);
  assert.deepEqual(translationTokens(value), translationTokens(source), code);
  for (const literal of ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By']) {
    assert.ok(value.includes(literal), `${code}: ${literal}`);
  }
}
assert.match(read('wuu-Hans')[key], /变成列表.*任务变成卡片.*负责人、日期、标签、清单搭描述/);
assert.match(read('pap')[key], /Gruponan ta bira listanan i tareanan ta bira karchinan/);
assert.match(read('yi')[key], /גרופּעס ווערן רשימות און אויפֿגאַבעס ווערן קאַרטן/);
console.log('Planner instructions: translations, mapping meanings and literals passed');

assert.doesNotMatch(read('wuu-Hans')[key], /存储桶/);

const meisterKey = 'import-board-instruction-meistertask';
for (const code of ['wuu-Hans', 'pap', 'yi']) {
  const value = read(code)[meisterKey];
  assert.notEqual(value, read('en')[meisterKey], code);
  assert.deepEqual(translationTokens(value), translationTokens(read('en')[meisterKey]), code);
  for (const literal of ['MeisterTask', 'Export project', 'CSV']) assert.ok(value.includes(literal), code + ': ' + literal);
}
assert.match(read('wuu-Hans')[meisterKey], /分段变成列表，任务变成卡片.*保留完成日期.*自家导入格式/);
assert.match(read('pap')[meisterKey], /tareanan terminá ta warda nan fecha di terminashon/);
assert.match(read('yi')[meisterKey], /פֿאַרענדיקטע אויפֿגאַבעס האַלטן זייער פֿאַרענדיקונג־דאַטע/);

// Source-product commands and file extensions must remain usable when following
// a translated import instruction. These are literals, not placeholder variables.
const importLiterals = {
  superproductivity: ['Super Productivity', 'Settings', 'Sync & Backup', 'Export Data', 'sp-backup', '.json', 'To Do', 'In Progress', 'Backlog', 'Done'],
  taiga: ['Taiga', 'Admin > Project > Export', '.json.gz', 'JSON'],
  vikunja: ['Vikunja', 'Settings', 'Data Export', '.zip', 'data.json'],
  tasksorg: ['Tasks.org', 'Settings', 'Backups', 'Export tasks', '.json'],
  monday: ['monday.com', 'More actions', 'Export board to Excel', '.xlsx', 'Status'],
  pivotal: ['Pivotal Tracker', 'MORE', 'Export CSV', 'Bulk Actions', 'Estimate'],
  obsidian: ['Obsidian', 'Markdown', '.md'],
  linear: ['Linear', 'CSV', 'Settings', 'Import / Export', 'Export data'],
  ticktick: ['TickTick', 'Settings', 'Account', 'Backup & Import', 'CSV'],
  clickup: ['ClickUp', 'CSV', 'Settings', 'Imports / Exports', 'Export Items'],
  nullboard: ['Nullboard', 'Export this board...', '.nbx', 'raw'],
  kanri: ['Kanri', 'Import & Export', 'Export individual board', 'Export all data', '.json'],
};
for (const code of ['wuu-Hans', 'pap', 'yi']) {
  const locale = read(code);
  for (const [format, literals] of Object.entries(importLiterals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + format);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + format);
    for (const literal of literals) assert.ok(locale[key].includes(literal), code + ': ' + format + ': ' + literal);
  }
}
// Multi-board exports must not promise that every board is imported.
for (const format of ['nullboard', 'kanri']) {
  const key = 'import-board-instruction-' + format;
  assert.match(read('wuu-Hans')[key], /只导入第一只/);
  assert.match(read('pap')[key], /importá (?:su|e) promé tablero/);
  assert.match(read('yi')[key], /ערשטע ברעט/);
}
assert.match(read('wuu-Hans')['import-board-instruction-obsidian'], /归档区变成归档卡片/);
assert.match(read('pap')['import-board-instruction-obsidian'], /karchinan archivá/);
assert.match(read('yi')['import-board-instruction-obsidian'], /אַרכיווירטע קאַרטן/);
console.log('Additional import formats: literals, tokens, first-board and archive semantics passed');

assert.match(read('wuu-Hans')['import-board-instruction-tasksorg'], /保留完成日期，优先级变成自定义字段/);
assert.match(read('pap')['import-board-instruction-tasksorg'], /fecha di terminashon, i prioridat ta bira un kampo personalisá/);
assert.match(read('yi')['import-board-instruction-tasksorg'], /פֿאַרענדיקונג־דאַטע, און פּריאָריטעט ווערט אַ אייגענער פֿעלד/);
assert.match(read('wuu-Hans')['import-board-instruction-monday'], /更新变成评论/);
assert.match(read('pap')['import-board-instruction-monday'], /aktualisashonnan ta bira komentarionan/);
assert.match(read('yi')['import-board-instruction-monday'], /דערהײַנטיקונגען ווערן באַמערקונגען/);

for (const format of ['taiga', 'vikunja']) {
  const key = 'import-board-instruction-' + format;
  assert.match(read('wuu-Hans')[key], /附件勿导入/);
  assert.match(read('pap')[key], /No ta importá atachimentunan/);
  assert.match(read('yi')[key], /בײַלאַגעס ווערן נישט אימפּאָרטירט/);
}
assert.match(read('wuu-Hans')['import-board-instruction-superproductivity'], /归档任务变成归档卡片/);
assert.match(read('pap')['import-board-instruction-superproductivity'], /tareanan archivá ta bira karchinan archivá/);
assert.match(read('yi')['import-board-instruction-superproductivity'], /אַרכיווירטע אויפֿגאַבעס ווערן אַרכיווירטע קאַרטן/);
