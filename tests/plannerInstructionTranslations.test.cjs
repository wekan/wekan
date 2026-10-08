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

for (const code of ['es', 'es-AR', 'es-CL', 'es-CO', 'es-LA', 'es-MX', 'es-PE', 'es-PY', 'es_CO']) {
  const locale = read(code);
  const literals = {...newerImportLiterals, ...Object.fromEntries(['pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja'].map(format => [format, importLiterals[format]]))};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /archivos adjuntos no se importan/);
  assert.match(locale['import-board-instruction-notion'], /relaciones, imágenes y archivos adjuntos no se importan/);
  assert.match(locale['import-board-instruction-plane'], /no contiene descripciones ni archivos adjuntos.*no se importan/);
  assert.match(locale['import-board-instruction-businessmap'], /cambia primero la fila de encabezados al inglés/);
  assert.match(locale['import-board-instruction-redmine'], /English en My account antes de exportar/);
  assert.match(locale['import-board-instruction-teamwork'], /un nivel más profundo/);
  assert.match(locale['import-board-instruction-superproductivity'], /tareas archivadas se convierten en tarjetas archivadas/);
}

for (const code of ['pt', 'pt-BR', 'pt-PT', 'pt_PT']) {
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
    assert.match(locale['import-board-instruction-' + format], /apenas o primeiro quadro é importado/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /todos os quadros são importados/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /tarefas concluídas mantêm a data de conclusão/);
  assert.match(locale['import-board-instruction-obsidian'], /arquivo torna-se cartões arquivados/);
  assert.match(locale['import-board-instruction-ticktick'], code === 'pt-BR' ? /uma raia/ : /uma pista/);
  assert.match(locale['import-board-instruction-planner'], code === 'pt-BR' ? /arquivo/ : /ficheiro/);
}

for (const code of ['pt', 'pt-BR', 'pt-PT', 'pt_PT']) {
  const locale = read(code);
  const literals = {...newerImportLiterals, ...Object.fromEntries(['pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja'].map(format => [format, importLiterals[format]]))};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /anexos não são importados/);
  assert.match(locale['import-board-instruction-notion'], /relações, imagens e anexos não são importados/);
  assert.match(locale['import-board-instruction-plane'], /não contém descrições nem anexos.*não são importados/);
  assert.match(locale['import-board-instruction-businessmap'], /mude primeiro a linha de cabeçalhos para inglês/);
  assert.match(locale['import-board-instruction-redmine'], /English em My account antes de exportar/);
  assert.match(locale['import-board-instruction-teamwork'], /um nível mais profundo/);
  assert.match(locale['import-board-instruction-superproductivity'], /tarefas arquivadas tornam-se cartões arquivados/);
  assert.match(locale['import-board-instruction-plane'], code === 'pt-BR' ? /raias/ : /pistas/);
}

{
  const locale = read('it');
  const literals = {...importLiterals, ...newerImportLiterals,
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV']};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /importata solo la prima bacheca/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /importate tutte le bacheche/);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /allegati non vengono importati/);
  assert.match(locale['import-board-instruction-notion'], /Relazioni, immagini e allegati non vengono importati/);
  assert.match(locale['import-board-instruction-plane'], /non contiene descrizioni né allegati.*non vengono importati/);
  assert.match(locale['import-board-instruction-businessmap'], /rinomina prima la riga delle intestazioni in inglese/);
  assert.match(locale['import-board-instruction-teamwork'], /un livello più profondo/);
  assert.match(locale['import-board-instruction-superproductivity'], /attività archiviate diventano schede archiviate/);
}

for (const code of ['nl', 'nl-NL']) {
  const locale = read(code);
  const literals = {...importLiterals, ...newerImportLiterals,
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV']};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /alleen het eerste bord geïmporteerd/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /alle borden geïmporteerd/);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Bijlagen worden niet geïmporteerd/);
  assert.match(locale['import-board-instruction-notion'], /Relaties, afbeeldingen en bijlagen worden niet geïmporteerd/);
  assert.match(locale['import-board-instruction-plane'], /geen beschrijvingen of bijlagen.*niet geïmporteerd/);
  assert.match(locale['import-board-instruction-businessmap'], /wijzig dan eerst de koprij naar het Engels/);
  assert.match(locale['import-board-instruction-redmine'], /vóór het exporteren.*English in My account/);
  assert.match(locale['import-board-instruction-teamwork'], /één niveau dieper/);
  assert.match(locale['import-board-instruction-superproductivity'], /gearchiveerde taken worden gearchiveerde kaarten/);
  assert.match(locale['import-board-instruction-meistertask'], /voltooide taken behouden hun voltooiingsdatum/);
}

{
  const locale = read('sv');
  const literals = {...importLiterals, ...newerImportLiterals,
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV']};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /importeras bara den första tavlan/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /alla tavlor importeras/);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Bilagor importeras inte/);
  assert.match(locale['import-board-instruction-notion'], /Relationer, bilder och bilagor importeras inte/);
  assert.match(locale['import-board-instruction-plane'], /inga beskrivningar eller bilagor.*importeras inte/);
  assert.match(locale['import-board-instruction-businessmap'], /först ändra rubrikraden till engelska/);
  assert.match(locale['import-board-instruction-redmine'], /English i My account före exporten/);
  assert.match(locale['import-board-instruction-teamwork'], /en nivå djupare/);
  assert.match(locale['import-board-instruction-superproductivity'], /arkiverade uppgifter blir arkiverade kort/);
  assert.match(locale['import-board-instruction-meistertask'], /slutförda uppgifter behåller sitt slutdatum/);
}

{
  const locale = read('da');
  const literals = {...importLiterals, ...newerImportLiterals,
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV']};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /importeres kun den første tavle/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /alle tavler importeres/);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Vedhæftninger importeres ikke/);
  assert.match(locale['import-board-instruction-notion'], /Relationer, billeder og vedhæftninger importeres ikke/);
  assert.match(locale['import-board-instruction-plane'], /ingen beskrivelser eller vedhæftninger.*importeres ikke/);
  assert.match(locale['import-board-instruction-businessmap'], /først ændre overskriftsrækken til engelsk/);
  assert.match(locale['import-board-instruction-redmine'], /English i My account før eksporten/);
  assert.match(locale['import-board-instruction-teamwork'], /ét niveau dybere/);
  assert.match(locale['import-board-instruction-superproductivity'], /arkiverede opgaver bliver til arkiverede kort/);
  assert.match(locale['import-board-instruction-meistertask'], /afsluttede opgaver beholder deres afslutningsdato/);
}

{
  const locale = read('nb');
  const literals = {...importLiterals, ...newerImportLiterals,
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV']};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /importeres bare den første tavlen/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /alle tavler importeres/);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Vedlegg importeres ikke/);
  assert.match(locale['import-board-instruction-notion'], /Relasjoner, bilder og vedlegg importeres ikke/);
  assert.match(locale['import-board-instruction-plane'], /ingen beskrivelser eller vedlegg.*importeres ikke/);
  assert.match(locale['import-board-instruction-businessmap'], /først endre overskriftsraden til engelsk/);
  assert.match(locale['import-board-instruction-redmine'], /English i My account før eksporten/);
  assert.match(locale['import-board-instruction-teamwork'], /ett nivå dypere/);
  assert.match(locale['import-board-instruction-superproductivity'], /arkiverte oppgaver blir arkiverte kort/);
  assert.match(locale['import-board-instruction-meistertask'], /fullførte oppgaver beholder fullføringsdatoen/);
}

for (const code of ['pl', 'pl-PL']) {
  const locale = read(code);
  const literals = {...importLiterals, ...newerImportLiterals,
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV']};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /importowana jest tylko pierwsza tablica/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /importowane są wszystkie tablice/);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Załączniki nie są importowane/);
  assert.match(locale['import-board-instruction-notion'], /Relacje, obrazy i załączniki nie są importowane/);
  assert.match(locale['import-board-instruction-plane'], /nie zawiera opisów ani załączników.*nie są one importowane/);
  assert.match(locale['import-board-instruction-businessmap'], /najpierw zmień wiersz nagłówków na angielski/);
  assert.match(locale['import-board-instruction-redmine'], /przed eksportem.*English w My account/);
  assert.match(locale['import-board-instruction-teamwork'], /poziom głębiej/);
  assert.match(locale['import-board-instruction-superproductivity'], /zarchiwizowane zadania stają się zarchiwizowanymi kartami/);
  assert.match(locale['import-board-instruction-meistertask'], /ukończone zadania zachowują datę ukończenia/);
}

for (const code of ['cs', 'cs-CZ']) {
  const locale = read(code);
  const literals = {...importLiterals, ...newerImportLiterals,
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV']};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /importuje pouze první tablo/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /importují všechna tabla/);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Přílohy se neimportují/);
  assert.match(locale['import-board-instruction-notion'], /Relace, obrázky a přílohy se neimportují/);
  assert.match(locale['import-board-instruction-plane'], /neobsahuje popisy ani přílohy.*neimportují/);
  assert.match(locale['import-board-instruction-businessmap'], /nejprve přejmenujte záhlaví sloupců na anglické názvy/);
  assert.match(locale['import-board-instruction-redmine'], /před exportem.*English v My account/);
  assert.match(locale['import-board-instruction-teamwork'], /o úroveň hlouběji/);
  assert.match(locale['import-board-instruction-superproductivity'], /archivované úkoly se převedou na archivované karty/);
  assert.match(locale['import-board-instruction-meistertask'], /dokončené úkoly si zachovají datum dokončení/);
}

{
  const locale = read('sk');
  const literals = {...importLiterals, ...newerImportLiterals,
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV']};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /importuje iba prvá nástenka/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /importujú všetky nástenky/);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Prílohy sa neimportujú/);
  assert.match(locale['import-board-instruction-notion'], /Vzťahy, obrázky a prílohy sa neimportujú/);
  assert.match(locale['import-board-instruction-plane'], /neobsahuje popisy ani prílohy.*neimportujú/);
  assert.match(locale['import-board-instruction-businessmap'], /najprv premenujte hlavičky stĺpcov na anglické názvy/);
  assert.match(locale['import-board-instruction-redmine'], /pred exportom.*English v My account/);
  assert.match(locale['import-board-instruction-teamwork'], /o úroveň hlbšie/);
  assert.match(locale['import-board-instruction-superproductivity'], /archivované úlohy sa zmenia na archivované karty/);
  assert.match(locale['import-board-instruction-meistertask'], /dokončené úlohy si zachovajú dátum dokončenia/);
}

for (const code of ['ro', 'ro-RO']) {
  const locale = read(code);
  const literals = {...importLiterals, ...newerImportLiterals,
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV']};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /se importă doar primul panou/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /se importă toate panourile/);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Atașamentele nu sunt importate/);
  assert.match(locale['import-board-instruction-notion'], /Relațiile, imaginile și atașamentele nu sunt importate/);
  assert.match(locale['import-board-instruction-plane'], /nu conține descrieri sau atașamente.*nu sunt importate/);
  assert.match(locale['import-board-instruction-businessmap'], /redenumește mai întâi anteturile în engleză/);
  assert.match(locale['import-board-instruction-redmine'], /înainte de export.*English în My account/);
  assert.match(locale['import-board-instruction-teamwork'], /un nivel mai adânc/);
  assert.match(locale['import-board-instruction-superproductivity'], /sarcinile arhivate devin carduri arhivate/);
  assert.match(locale['import-board-instruction-meistertask'], /sarcinile finalizate își păstrează data finalizării/);
}

{
  const locale = read('hu');
  const literals = {...importLiterals, ...newerImportLiterals,
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV']};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /csak az első tábla kerül importálásra/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /minden tábla importálásra kerül/);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /mellékletek nem kerülnek importálásra/);
  assert.match(locale['import-board-instruction-notion'], /kapcsolatok, képek és mellékletek nem kerülnek importálásra/);
  assert.match(locale['import-board-instruction-plane'], /nem tartalmaz leírásokat vagy mellékleteket.*nem kerülnek importálásra/);
  assert.match(locale['import-board-instruction-businessmap'], /előbb nevezze át a fejlécsor mezőit angolra/);
  assert.match(locale['import-board-instruction-redmine'], /exportálás előtt.*English.*My account/);
  assert.match(locale['import-board-instruction-teamwork'], /egy szinttel mélyebbet/);
  assert.match(locale['import-board-instruction-superproductivity'], /archivált feladatokból archivált kártyák lesznek/);
  assert.match(locale['import-board-instruction-meistertask'], /befejezett feladatok megőrzik a befejezés dátumát/);
}

{
  const locale = read('tr');
  const literals = {...importLiterals, ...newerImportLiterals,
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV']};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /yalnızca ilk pano içe aktarılır/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /tüm panolar içe aktarılır/);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Ekler içe aktarılmaz/);
  assert.match(locale['import-board-instruction-notion'], /İlişkiler, resimler ve ekler içe aktarılmaz/);
  assert.match(locale['import-board-instruction-plane'], /açıklama veya ek içermez.*içe aktarılmaz/);
  assert.match(locale['import-board-instruction-businessmap'], /önce başlık satırını İngilizce olarak yeniden adlandırın/);
  assert.match(locale['import-board-instruction-redmine'], /dışa aktarmadan önce My account.*English/);
  assert.match(locale['import-board-instruction-teamwork'], /bir seviye daha derini/);
  assert.match(locale['import-board-instruction-superproductivity'], /arşivlenmiş görevler arşivlenmiş kartlara dönüşür/);
  assert.match(locale['import-board-instruction-meistertask'], /tamamlanan görevlerin tamamlanma tarihleri korunur/);
}

for (const code of ['el', 'el-GR']) {
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
    assert.match(locale['import-board-instruction-' + format], /εισάγεται μόνο ο πρώτος πίνακας/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /εισάγονται όλοι οι πίνακες/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /ολοκληρωμένες εργασίες διατηρούν την ημερομηνία ολοκλήρωσής τους/);
  assert.match(locale['import-board-instruction-obsidian'], /μετατρέπεται σε αρχειοθετημένες κάρτες/);
  assert.match(locale['import-board-instruction-ticktick'], /γίνεται διάδρομος/);
}

for (const code of ['el', 'el-GR']) {
  const locale = read(code);
  const literals = {...newerImportLiterals, ...Object.fromEntries(['pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja'].map(format => [format, importLiterals[format]]))};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Τα συνημμένα δεν εισάγονται/);
  assert.match(locale['import-board-instruction-notion'], /Οι σχέσεις, οι εικόνες και τα συνημμένα δεν εισάγονται/);
  assert.match(locale['import-board-instruction-plane'], /δεν περιέχει περιγραφές ή συνημμένα.*δεν εισάγονται/);
  assert.match(locale['import-board-instruction-businessmap'], /μετονομάστε πρώτα τη γραμμή επικεφαλίδων στα αγγλικά/);
  assert.match(locale['import-board-instruction-redmine'], /πριν από την εξαγωγή.*English στο My account/);
  assert.match(locale['import-board-instruction-teamwork'], /ένα επίπεδο βαθύτερα/);
  assert.match(locale['import-board-instruction-superproductivity'], /αρχειοθετημένες εργασίες γίνονται αρχειοθετημένες κάρτες/);
}

for (const code of ['ja', 'ja-JP']) {
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
    assert.match(locale['import-board-instruction-' + format], /最初のボードだけがインポートされます/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /すべてのボードがインポートされます/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /完了済みタスクの完了日は保持されます/);
  assert.match(locale['import-board-instruction-obsidian'], /アーカイブはアーカイブ済みカードになります/);
  assert.match(locale['import-board-instruction-ticktick'], /リストはスイムレーンに/);
}

for (const code of ['ja', 'ja-JP']) {
  const locale = read(code);
  const literals = {...newerImportLiterals, ...Object.fromEntries(['pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja'].map(format => [format, importLiterals[format]]))};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], code + ': ' + key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), code + ': ' + key);
    for (const value of values) assert.ok(locale[key].includes(value), code + ': ' + value);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /添付ファイルはインポートされません/);
  assert.match(locale['import-board-instruction-notion'], /リレーション、画像、添付ファイルはインポートされません/);
  assert.match(locale['import-board-instruction-plane'], /説明と添付ファイルが含まれない.*インポートされません/);
  assert.match(locale['import-board-instruction-businessmap'], /先にヘッダー行を英語名に変更/);
  assert.match(locale['import-board-instruction-redmine'], /エクスポート前に My account.*English/);
  assert.match(locale['import-board-instruction-teamwork'], /さらに1階層深く/);
  assert.match(locale['import-board-instruction-superproductivity'], /アーカイブ済みタスクはアーカイブ済みカードになります/);
}

{
  const locale = read('ja-HI');
  const literals = {
    planner: ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
    meistertask: ['MeisterTask', 'Export project', 'CSV'],
    ...Object.fromEntries(['obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri'].map(format => [format, importLiterals[format]])),
  };
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    assert.match(locale[key], /\p{Script=Hiragana}/u, key);
    assert.doesNotMatch(locale[key], /[\p{Script=Han}\p{Script=Katakana}]/u, key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['nullboard', 'kanri']) {
    assert.match(locale['import-board-instruction-' + format], /さいしょの ぼおどだけが いんぽおとされます/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /すべての ぼおどが いんぽおとされます/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /かんりょうした たすくの かんりょうびは のこります/);
  assert.match(locale['import-board-instruction-obsidian'], /ああかいぶは ああかいぶずみの かあどに なります/);
}

{
  const locale = read('ja-HI');
  const literals = {...newerImportLiterals, ...Object.fromEntries(['pivotal', 'tasksorg', 'monday', 'superproductivity', 'taiga', 'vikunja'].map(format => [format, importLiterals[format]]))};
  for (const [format, values] of Object.entries(literals)) {
    const key = 'import-board-instruction-' + format;
    assert.notEqual(locale[key], read('en')[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(read('en')[key]), key);
    assert.match(locale[key], /\p{Script=Hiragana}/u, key);
    assert.doesNotMatch(locale[key], /[\p{Script=Han}\p{Script=Katakana}]/u, key);
    for (const value of values) assert.ok(locale[key].includes(value), key + ': ' + value);
  }
  for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /てんぷふぁいるは いんぽおとされません/);
  assert.match(locale['import-board-instruction-notion'], /りれえしょん、がぞう、てんぷふぁいるは いんぽおとされません/);
  assert.match(locale['import-board-instruction-plane'], /せつめいと てんぷふぁいるが ふくまれない.*いんぽおとされません/);
  assert.match(locale['import-board-instruction-businessmap'], /さきに へっだあぎょうを えいごの なまえに かえて/);
  assert.match(locale['import-board-instruction-redmine'], /えくすぽおとの まえに My account.*English/);
  assert.match(locale['import-board-instruction-teamwork'], /さらに ひとつ かいそうが ふかく/);
  assert.match(locale['import-board-instruction-superproductivity'], /ああかいぶずみの たすくは ああかいぶずみの かあどに なります/);
}

for (const code of ['ko', 'ko-KR']) {
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
    assert.match(locale['import-board-instruction-' + format], /첫 번째 보드만 가져옵니다/);
    assert.doesNotMatch(locale['import-board-instruction-' + format], /모든 보드를 가져옵니다/);
  }
  assert.match(locale['import-board-instruction-meistertask'], /완료된 작업의 완료 날짜는 유지됩니다/);
  assert.match(locale['import-board-instruction-obsidian'], /아카이브는 보관된 카드로 변환됩니다/);
  assert.match(locale['import-board-instruction-ticktick'], /목록은 스윔레인으로/);
}
