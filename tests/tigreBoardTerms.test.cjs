const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const locale = code => JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/' + code + '.i18n.json'), 'utf8'));
const tigre = locale('tig');
const tigrinya = locale('ti');
const reviewed = {
  "multi-selection-active": "ምዱዳት ንምምራጽ ሳጹናት ምልክት ጠውቕ",
  "no-boards-selected": "ዝመረጽካዮ ምዱድ የለን።",
  "select-only-one-board": "በጃኻ ሓደ ምዱድ ጥራይ ምረጽ",
  "set-selected-unstarred": "ካብ ዝተመርጹ ምዱዳት ኮከብ ኣልዕል",
  "board-creation-admin-only": "ኣመሓደርቲ ጥራይ ሓድሽ ምዱድ ክፈጥሩ ይኽእሉ",
  "restore-board": "ምዱድ መልስ",
  "board-not-found": "ምዱድ ኣይተረኽበን",
  "board-public-info": "እዚ ምዱድ <strong>ህዝባዊ</strong> ክኸውን እዩ።",
  "boardChangeColorPopup-title": "ድሕረ ባይታ ምዱድ ቀይር",
  "board-view-multiboard-cal": "ዓውደ ኣዋርሕ (ኩሎም ምዱዳት)",
  "bookmarksPopup-title": "ኮከብ ዝተገብረሎም ምዱዳት",
  "click-to-star": "ነዚ ምዱድ ኮከብ ንምግባር ጠውቕ።",
  "click-to-unstar": "ካብዚ ምዱድ ኮከብ ንምልዓል ጠውቕ።",
  "header-logo-title": "ናብ ገጽ ምዱዳትካ ተመለስ።",
  "my-boards": "ምዱዳተይ",
  "custom-public-desc-placeholder": "ነባሪ ንምጥቃም ባዶ ግደፎ ህዝባዊ ናይ ምዱድ ዋስፎ",
  "go-to-board": "ናብ ምዱድ ኪድ",
  "tableVisibilityMode": "ርኡይነት ምዱዳት",
  "r-board-button": "መልጎም ምዱድ",
  "cloneBoardPopup-title": "ምዱድ ይንቀል ዶ?",
  "allow-invite-to-board": "ናብ ምዱድ ምዕዳም ፍቐድ",
  "roles-status-manage": "ቅንብራት ምዱድ",
  "roles-status-empty": "ተራታት ምዱድ የለዉን።",
  "sort-boards": "ምዱዳት ስርዕ",
  "set-as-active": "ከም ድሕረ ባይታ ምዱድ ኣቐምጥ",
  "board-activities": "ንጥፈታት ምዱድ",
  "boardsReportTitle": "ጸብጻብ ምዱዳት",
  "board-cleanup-scheduled": "ምጽራይ ምዱድ ብዓወት ተመዲቡ",
  "schedule-board-cleanup": "ምጽራይ ምዱድ መድብ",
  "step-scan-users": "ስእልታት መንነት ኣባላት ምዱድ ይምርመሩ ኣለዉ",
  "converting-board": "ምዱድ ይቕየር ኣሎ"
};
for (const [key, value] of Object.entries(reviewed)) {
  assert.equal(tigre[key], value, key + ': exact reviewed Tigre value');
  assert.notEqual(tigre[key], tigrinya[key], key + ': Tigrinya seed removed');
  assert.match(tigre[key], /ምዱድ|ምዱዳ/, key + ': corpus-attested Board form');
  assert.doesNotMatch(tigre[key], /ሰሌዳ/, key + ': no Tigrinya Board stem');
}
assert.equal(tigre['copy-text-to-clipboard'], 'ክቱብ ናብ ሰሌዳ ቅዳሕ ቅዳሕ');
assert.notEqual(tigre['copy-text-to-clipboard'],
  tigrinya['copy-text-to-clipboard'], 'Tigre Text term is reviewed');
assert.match(tigre['copy-text-to-clipboard'], /ሰሌዳ/,
  'Clipboard keeps its separate meaning');
assert.equal(tigre['to-boards'], 'ናብ ምዱድ(ምዱዳት)');
assert.notEqual(tigre['to-boards'], tigrinya['to-boards'],
  'Tigre Board singular/plural shorthand is reviewed');
console.log('Tigre board terms: ' + Object.keys(reviewed).length);
