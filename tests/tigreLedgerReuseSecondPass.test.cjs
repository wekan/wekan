'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const locale = code =>
  JSON.parse(
    fs.readFileSync(
      path.join(root, 'imports/i18n/data', code + '.i18n.json'),
      'utf8',
    ),
  );
const tigre = locale('tig');
const tigrinya = locale('ti');
const reviewed = {
  'comment-in-reply-to': 'ምብላስ ን',
  'assign-member': 'አባል መድብ',
  'cardStartVotingPopup-title': 'ድምጺ ምሃብ አንብት',
  'cardStartPlanningPokerPopup-title': 'Planning Poker አንብት',
  'pomodoro-start': 'ፖሞዶሮ አንብት',
  'card-aging-days': 'ድሕሪ አምዕል ኣደብዝዝ (3 ደረጃታት)፦',
  'r-days-before': 'አምዕል ቅድሚ',
  'r-days-after': 'አምዕል ድሕሪ',
  'copy-text-to-clipboard': 'ክቱብ ናብ ሰሌዳ ቅዳሕ ቅዳሕ',
  'text-contains-trigger-label': 'ፈትሽ ክቱብ',
  'edit-checklist-items-as-text': 'ከም ክቱብ ኣርትዕ',
  'custom-field-currency-option': 'ኮድ ግሩሽ',
  'email-invite': 'ብኢመይል ዐዝም',
  'import-trello-zip-too-large': 'እቲ .zip ንምእታው ኣዝዩ ገዚፍ እዩ።',
  'trello-api-key': 'መፍቲሕ Trello API (ምን https://trello.com/app-key)',
  'trello-import-progress': 'ዐቦት ምእታው',
  'upload-avatar': 'ስእሊ መንነት ጸዐን',
  'upload-background': 'ስእሊ ድሕረ ባይታ ጸዐን',
  'to-boards': 'ናብ ምዱድ(ምዱዳት)',
  'email-templates-invite-subject': 'ዐዝም ኢመይል ኣርእስ፡',
  'new-outgoing-webhook': 'ሐዲስ ወጻኢ Webhook',
  'delete-duplicate-lists': 'ተደጋገምቲ ዝርዝራት ምሳሕ',
  'r-drop-trigger': 'መንሸጢ ኣብዚ ኣንብር',
  'r-set-scheduled-triggers': 'ዝተመደቡ መንሸጢታት',
  'r-when-scheduled': 'ብጀድወል',
  'authentication-type': 'ዐይነት ምርግጋጽ መንነት',
  'operator-status-invalid': "'%s' ቅቡል ሓላት ኣይኮነን",
  'sort-boards-title-asc': 'አርእስ (A → Z)',
  'sort-boards-title-desc': 'አርእስ (Z → A)',
  'dependency-type': 'ዐይነት ዝምድና',
  'new-problems': 'ሓደስቲ መሻክል',
  'no-new-problems': 'ሐዲስ ጸገም የለን።',
  'calculate-file-counts': "ዐደድ ፋይላት ኣስል",
  'calculating-counts': 'ዐደድ ይሕሰብ ኣሎ...',
  'mongodb-compact-run': 'MongoDB Compact ሰዔ',
  'support-info-not-added-yet': 'ሓበሬታ ሰዳየት ገና ኣይተወሰኸን',
  'support-content': 'ትሕዝቶ ሰዳየት',
  'accessibility-title': 'አርእስ ተበጻሕነት',
  'admin-people-last-active': 'ናይ መወዳእታ ህርኩት',
  'step-create-missing-lists': 'ዝጎደሉ ዝርዝራት ኽለቅ',
  'days-old': 'ዕድመ ብምዕል',
  'login-allow': 'መእተዪ፦ ፍቐድ',
  'more-options': 'ዚያደት ኣማራጺታት',
  'list-sync-clear': 'ምስምማዕ ከሬ',
};

for (const [key, value] of Object.entries(reviewed)) {
  assert.equal(tigre[key], value, key + ': reviewed Tigre value');
  assert.notEqual(tigre[key], tigrinya[key], key + ': Tigrinya seed removed');
}
console.log('Tigre second ledger-reuse pass: ' + Object.keys(reviewed).length);
