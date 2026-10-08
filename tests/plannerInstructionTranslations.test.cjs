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

// Finnish instructions retain actionable source commands and import mappings.
{
  const locale = read('fi');
  const literalsByFormat = {
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
    ...Object.fromEntries(['obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri'].map(format => [format, importLiterals[format]])),
  };
  for (const [format, literals] of Object.entries(literalsByFormat)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const literal of literals) assert.ok(locale[key].includes(literal), key + ': ' + literal);
  }
  for (const format of ['nullboard', 'kanri']) assert.match(locale['import-board-instruction-' + format], /tuodaan ensimmäinen taulu/);
  assert.match(locale['import-board-instruction-obsidian'], /arkiston korteista tulee arkistoituja kortteja/);
  assert.match(locale['import-board-instruction-meistertask'], /Valmiiden tehtävien valmistumispäivä säilyy/);
  assert.match(locale['import-board-instruction-planner'], /Säilöistä tulee listoja ja tehtävistä kortteja/);
  assert.doesNotMatch(locale['import-board-instruction-kanri'], /tuodaan kaikki taulut/);
}

const newerImportLiterals = {
  quire: ['Quire', 'Export CSV', 'CSV'],
  wrike: ['Wrike', 'Excel', '.xlsx', 'Status', 'Key', 'Priority', 'Duration'],
  teamwork: ['Teamwork.com', 'Excel', '.xlsx', 'Tasklist', 'Task', 'Description', 'Assign to', 'Start date', 'Due date', 'Priority', 'Estimated time', 'Tags', 'Status', 'Complete', '--', '##', '>>'],
  businessmap: ['Businessmap', 'Kanbanize', 'Advanced Search', 'Configure results', 'Excel', '.xlsx', 'Title', 'Column', 'Lane', 'Owner', 'Deadline', 'Priority', 'Size', 'Type'],
  redmine: ['Redmine', 'Issues', 'Also available in: CSV', 'All columns', 'Description', 'My account', 'English', '% Done'],
  notion: ['Notion', '•••', 'Export', 'Markdown & CSV', '.zip', 'Status'],
  plane: ['Plane', 'Workspace Settings', 'Exports', 'JSON', 'CSV', 'Excel', '.zip'],
};
for (const code of ['wuu-Hans', 'pap', 'yi']) {
  const locale = read(code);
  for (const [format, literals] of Object.entries(newerImportLiterals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const literal of literals) assert.ok(locale[key].includes(literal), key + ': ' + literal);
  }
}
assert.match(read('wuu-Hans')['import-board-instruction-quire'], /呒没评论搭附件/);
assert.match(read('wuu-Hans')['import-board-instruction-notion'], /关系、图片搭附件勿导入/);
assert.match(read('wuu-Hans')['import-board-instruction-plane'], /呒没描述搭附件.*勿导入/);
assert.match(read('wuu-Hans')['import-board-instruction-businessmap'], /先把表头行改成英文/);
assert.match(read('wuu-Hans')['import-board-instruction-teamwork'], /子任务.*再深一层/);

assert.match(read('pap')['import-board-instruction-quire'], /Komentarionan i atachimentunan no ta den/);
assert.match(read('pap')['import-board-instruction-notion'], /Relashonnan, imágennan i atachimentunan no ta wordu importá/);
assert.match(read('pap')['import-board-instruction-plane'], /no tin deskripshonnan ni atachimentunan.*no ta wordu importá/);
assert.match(read('pap')['import-board-instruction-businessmap'], /kambia e rèi di enkabesado pa ingles promé/);
assert.match(read('pap')['import-board-instruction-teamwork'], /subtarea.*nivel mas profundo/);

assert.match(read('yi')['import-board-instruction-quire'], /בײַלאַגעס זענען נישט/);
assert.match(read('yi')['import-board-instruction-notion'], /בײַלאַגעס ווערן נישט אימפּאָרטירט/);
assert.match(read('yi')['import-board-instruction-plane'], /האָט נישט קיין באַשרײַבונגען.*ווערן זיי נישט אימפּאָרטירט/);
assert.match(read('yi')['import-board-instruction-businessmap'], /בײַט ערשט די קעפּל־שורה אויף ענגליש/);
assert.match(read('yi')['import-board-instruction-teamwork'], /איין ניוואָ טיפֿער/);

{
  const locale = read('fi');
  for (const [format, literals] of Object.entries({...newerImportLiterals, ...Object.fromEntries(['pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja'].map(format => [format, importLiterals[format]]))})) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const literal of literals) assert.ok(locale[key].includes(literal), key + ': ' + literal);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Liitteitä ei tuoda/);
  assert.match(locale['import-board-instruction-notion'], /Relaatioita, kuvia ja liitteitä ei tuoda/);
  assert.match(locale['import-board-instruction-plane'], /ei sisällä kuvauksia eikä liitteitä/);
  assert.match(locale['import-board-instruction-businessmap'], /muuta otsikkorivi ensin englanninkieliseksi/);
  assert.match(locale['import-board-instruction-teamwork'], /yhtä tasoa syvempää/);
  assert.match(locale['import-board-instruction-monday'], /päivityksistä kommentteja/);
  assert.match(locale['import-board-instruction-superproductivity'], /Arkistoiduista tehtävistä tulee arkistoituja kortteja/);
  assert.deepEqual(translationTokens(locale['login-origin-mismatch']), translationTokens(read('en')['login-origin-mismatch']));
  assert.ok(locale['login-origin-mismatch'].includes('ROOT_URL'));
  assert.match(locale['login-origin-mismatch'], /määritetty osoitteelle __expected__.*avattiin osoitteessa __actual__/);
}

// German variants preserve actionable commands and information-loss warnings.
for (const code of ['de', 'de-AT', 'de-CH', 'de_DE']) {
  const locale = read(code);
  const literals = {
    ...importLiterals, ...newerImportLiterals,
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /das erste Board importiert/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /alle Boards importiert/);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Anhänge werden nicht importiert/);
  assert.match(locale['import-board-instruction-notion'], /Beziehungen, Bilder und Anhänge werden nicht importiert/);
  assert.match(locale['import-board-instruction-plane'], /keine Beschreibungen oder Anhänge.*nicht importiert/);
  assert.match(locale['import-board-instruction-businessmap'], /zuerst die Kopfzeile auf Englisch/);
  assert.match(locale['import-board-instruction-teamwork'], /eine Ebene tiefer/);
  assert.match(locale['import-board-instruction-meistertask'], /erledigte Aufgaben behalten ihr Abschlussdatum/);
  assert.match(locale['import-board-instruction-superproductivity'], /archivierte Aufgaben werden zu archivierten Karten/);
}

for (const code of ['fr', 'fr-BE', 'fr-CA', 'fr-CH', 'fr-FR']) {
  const locale = read(code);
  const literals = {
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
    ...Object.fromEntries(['obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri'].map(format => [format, importLiterals[format]])),
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /seul le premier tableau est importé/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /tous les tableaux sont importés/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /tâches terminées conservent leur date de fin/);
  assert.match(locale['import-board-instruction-obsidian'], /archives deviennent des cartes archivées/);
  assert.match(locale['import-board-instruction-planner'], /compartiments deviennent des listes et les tâches deviennent des cartes/);
}

for (const code of ['fr', 'fr-BE', 'fr-CA', 'fr-CH', 'fr-FR']) {
  const locale = read(code);
  const literals = {...newerImportLiterals, ...Object.fromEntries(['pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja'].map(format => [format, importLiterals[format]]))};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /pièces jointes ne sont pas importées/);
  assert.match(locale['import-board-instruction-notion'], /relations, images et pièces jointes ne sont pas importées/);
  assert.match(locale['import-board-instruction-plane'], /ne contient ni descriptions ni pièces jointes.*pas importées/);
  assert.match(locale['import-board-instruction-businessmap'], /renommez d’abord la ligne d’en-tête en anglais/);
  assert.match(locale['import-board-instruction-redmine'], /English dans My account avant l’exportation/);
  assert.match(locale['import-board-instruction-teamwork'], /un niveau supplémentaire/);
  assert.match(locale['import-board-instruction-superproductivity'], /tâches archivées deviennent des cartes archivées/);
}

for (const code of ['es', 'es-AR', 'es-CL', 'es-CO', 'es-LA', 'es-MX', 'es-PE', 'es-PY', 'es_CO']) {
  const locale = read(code);
  const literals = {
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
    ...Object.fromEntries(['obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri'].map(format => [format, importLiterals[format]])),
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /solo se importa el primer tablero/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /se importan todos los tableros/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /tareas completadas conservan su fecha de finalización/);
  assert.match(locale['import-board-instruction-obsidian'], /archivo se convierte en tarjetas archivadas/);
  assert.match(locale['import-board-instruction-planner'], /depósitos se convierten en listas y las tareas en tarjetas/);
}
