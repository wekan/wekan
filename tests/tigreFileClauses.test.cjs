const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const locale = code => JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/' + code + '.i18n.json'), 'utf8'));
const tigre = locale('tig');
const tigrinya = locale('ti');
const reviewed = {
  "import-trello-zip-file-too-large": "ኣብቲ .zip ዘሎ ፈይል ንምእታው ኣዝዩ ዓቢ እዩ።",
  "import-trello-zip-unsafe-path": "እቲ .zip ዘይውሑሳት መንገድታት ፈይል ስለ ዝሓዘ ተነጺጉ።",
  "api-upload-limit-label": "ዝለዓለ ቅያስ ፈይል ምስቃል API",
  "api-download-limit-label": "ዝለዓለ ቅያስ ፈይል ምውራድ API",
  "allowed-avatar-filetypes": "ዝፍቀዱ ዓይነታት ፈይል ስእሊ መንነት፦",
  "gcs-key-filename": "ገበይ ፈይል መፍትሕ ሕሳብ ኣገልግሎት",
  "gridfs-enabled-description": "ንመክዘን ፈይል MongoDB GridFS ተጠቐም",
  "s3-enabled-description": "ንመክዘን ፈይል AWS S3 ወይ MinIO ተጠቐም"
};
for (const [key, value] of Object.entries(reviewed)) {
  assert.equal(tigre[key], value, key + ': exact reviewed Tigre value');
  assert.notEqual(tigre[key], tigrinya[key], key + ': Tigrinya seed removed');
  assert.match(tigre[key], /ፈይል/, key + ': corpus-attested File term');
  assert.doesNotMatch(tigre[key], /ፋይል/, key + ': no Tigrinya File spelling');
}
console.log('Tigre file clauses: ' + Object.keys(reviewed).length);
