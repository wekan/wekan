'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const imports = read('client/imports.js');
const sidebar = read('client/components/sidebar/sidebar.js');
const htmlExport = read('client/lib/exportHTML.js');
const gantt = read('client/components/gantt/gantt.js');
const uploads = read('client/lib/attachmentUploadConfig.js');
const attachments = read('client/components/cards/attachments.js');

assert.doesNotMatch(imports, /import ['"]\/client\/lib\/exportHTML['"]/,
  'the uncommon HTML exporter is not part of every page bootstrap');
assert.match(sidebar,
  /click \.html-export-board[\s\S]{0,180}await import\('\/client\/lib\/exportHTML'\)/,
  'the board action loads its implementation only after the user requests it');
assert.match(htmlExport, /await import\('fflate'\)/,
  'the shared ZIP implementation remains behind the lazy feature boundary');
assert.doesNotMatch(htmlExport, /JSZip|from ['"]fflate['"]/,
  'no second ZIP package or eager fflate import reaches page startup');
assert.doesNotMatch(gantt, /markdown-it|markdownit/,
  'the Gantt page does not load an unused Markdown parser');
assert.match(uploads, /Random\.hexString\(24\)/,
  'attachment ids use the already-present Meteor random primitive');
assert.doesNotMatch(`${uploads}\n${attachments}`, /from ['"]bson['"]/,
  'attachment UI does not load BSON merely to create or display an id');

console.log('clientLazyLoading: HTML export and its ZIP writer are action-loaded');
