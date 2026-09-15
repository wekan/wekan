'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${code}.i18n.json`), 'utf8'));
const tigre = read('tig');
const tigrinya = read('ti');
const terms = {
  "status": "ሓላት",
  "operator-status": "ሓላት",
  "accounts-lockout-status": "ሓላት",
  "migration-progress-status": "ሓላት",
  "problems-status-title": "ሓላት",
  "board-change-color": "ሕብር ተቅዪር",
  "changeColorPopup-title": "ሕብር ተቅዪር",
  "allBoardsChangeColorPopup-title": "ሕብር ተቅዪር",
  "change-color": "ሕብር ተቅዪር",
  "select-color": "ሕሬ ሕብር",
  "setCardActionsColorPopup-title": "ሕሬ ሕብር",
  "setSwimlaneColorPopup-title": "ሕሬ ሕብር",
  "setListColorPopup-title": "ሕሬ ሕብር",
  "weight": "ሜዛን",
  "allboards.templates": "ሞደላት",
  "templates": "ሞደላት",
  "createBoardPopup-title": "ምዱድ ኽለቅ",
  "headerBarCreateBoardPopup-title": "ምዱድ ኽለቅ",
  "createLabelPopup-title": "እሻረት ኽለቅ",
  "label-create": "እሻረት ኽለቅ",
  "checklist-reset-interval-weekly": "ኩሉ እስቡዕ",
  "card-recurrence-interval-weekly": "ኩሉ እስቡዕ",
  "backup-frequency-weekly": "ኩሉ እስቡዕ",
  "checklist-reset-interval-monthly": "ኩሉ ወርሕ",
  "card-recurrence-interval-monthly": "ኩሉ ወርሕ",
  "backup-frequency-monthly": "ኩሉ ወርሕ",
  "team": "ፈሪቅ",
  "operator-team": "ፈሪቅ",
  "week": "እስቡዕ",
  "predicate-week": "እስቡዕ",
  "export-card-attachment-size": "ቅያስ",
  "size": "ቅያስ"
};
for (const [key, value] of Object.entries(terms)) {
  assert.equal(tigre[key], value, `${key} should use the reviewed Tigre family term`);
  assert.notEqual(tigre[key], tigrinya[key], `${key} should reject its Tigrinya seed`);
}
console.log(`Checked ${Object.keys(terms).length} Tigre repeated-family terms.`);
