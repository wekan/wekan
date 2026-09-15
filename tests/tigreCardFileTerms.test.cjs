const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const locale = code => JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/' + code + '.i18n.json'),
  'utf8',
));
const tigre = locale('tig');
const tigrinya = locale('ti');
const reviewed = {
  "add-existing-card-as-subtask": "ዘሎ ወረቀት ካርድ ከም ንኡስ ዕዮ ወስኽ",
  "cardDeletePopup-title": "ወረቀት ካርድ ይደምሰስ?",
  "restoreArchivedCardToListPopup-title": "ወረቀት ካርድ ናብ ዝርዝር መልስ",
  "moveCardPopup-title": "ወረቀት ካርድ ኣንቀሳቕስ",
  "shortcut-assign-self": "ንገዛእ ርእስኻ ናብ እዋናዊ ወረቀት ካርድ መድብ",
  "r-w-card-created": "ወረቀት ካርድ ይፍጠር",
  "r-when-card-in-list": "ወረቀት ካርድ ኣብ ዝርዝር ምስ ዝጸንሕ",
  "r-card-button": "መልጎም ወረቀት ካርድ",
  "r-when-a-card-matches-advanced-filter": "ወረቀት ካርድ ምስ ዝማዕበለ መጻረይ ምስ ዝሰማማዕ",
  "r-d-move-to-top-spec": "ወረቀት ካርድ ናብ ላዕሊ ዝርዝር ኣዛውር",
  "r-d-move-to-bottom-spec": "ወረቀት ካርድ ናብ ታሕቲ ዝርዝር ኣዛውር",
  "card-counter-list": "ዝርዝር ቆጻሪ ወረቀት ካርድ",
  "show-on-card": "ኣብ ወረቀት ካርድ ኣርኢ",
  "maximize-card": "ወረቀት ካርድ ኣዕብይ",
  "minimize-card": "ወረቀት ካርድ ኣንእስ",
  "subtask-inherit-parent-labels": "ናይ ወላዲ ወረቀት ካርድ ስያመታት ውረስ",
  "import-excel-file": "ፈይል Excel (.xlsx)",
  "import-trello-json-file": "ፈይል Trello .json",
  "import-trello-zip-file": "ፈይል Trello .zip",
  "move-storage-fs": "ስርዓም ፈይል",
  "gridfs-file-id": "መለለዪ ፈይል GridFS"
};

for (const [key, value] of Object.entries(reviewed)) {
  assert.equal(tigre[key], value, key + ': exact reviewed Tigre value');
  assert.notEqual(tigre[key], tigrinya[key], key + ': Tigrinya seed removed');
}
for (const key of Object.keys(reviewed).slice(0, 16)) {
  assert.match(tigre[key], /ወረቀት ካርድ/, key + ': corpus-attested Card term');
}
for (const key of Object.keys(reviewed).slice(16)) {
  assert.match(tigre[key], /ፈይል/, key + ': corpus-attested File term');
}
console.log('Tigre card and file terms: ' + Object.keys(reviewed).length);
