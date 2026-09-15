const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const locale = code => JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/' + code + '.i18n.json'), 'utf8'));
const tigre = locale('tig');
const tigrinya = locale('ti');
const reviewed = {
  "attachment-soft-delete-pop": "እቲ መተሓሓዚ ካብዚ ወረቀት ካርድ ይእለ፣ ፋይሉ ግን ይዕቀብ። ነቲ ወረቀት ካርድ ከመሓይሽ ዝኽእል ዝኾነ ሰብ ካብ ታሪኽ ወረቀት ካርድ ክመልሶ ይኽእል።",
  "filter-cards": "ወረቀት ካርዳት ወይ ዝርዝራት ኣጻሪ",
  "shortcut-filter-my-cards": "ወረቀት ካርዳተይ ኣጻሪ",
  "starred-cards": "ኮከብ ዝተገብረሎም ወረቀት ካርዳት",
  "toggle-labels": "ንወረቀት ካርድ እሻራት 1-9 ቀያይር። ብዙሕ ምርጫ እሻራት 1-9 ይውስኽ",
  "external-link-pattern-description": "ኣብ ጽሑፍ ወረቀት ካርድ ዝርከቡ ከም \"#1234\" ዝኣመሰሉ ምልክታት ብቐጥታ ናብ ናይ ደገ ናይ ጸገማት ተከታታሊ የራኽቦም። ንምስራዝ ሓደ ካብቶም ቦታታት ባዶ ግደፍ።",
  "card-sorting-by-number": "ወረቀት ካርዳት ብቁጽሪ ምስራዕ",
  "cover-attachment-on-minicard": "ስእሊ ሽፋን ኣብ ንኡስ ወረቀት ካርድ",
  "card-sorting-by-number-on-minicard": "ወረቀት ካርዳት ብቁጽሪ ምስራዕ ኣብ ንኡስ ወረቀት ካርድ",
  "r-of-cards-in-list": "ንወረቀት ካርዳት ኣብ ዝርዝር",
  "open-many-cards-at-once": "ብዙሓት ወረቀት ካርዳት ብሓንሳብ ክፈት",
  "roles-status-sees": "ወረቀት ካርዳት ይርኢ",
  "myCardsViewChange-title": "ርእይቶ ወረቀት ካርዳተይ",
  "myCardsViewChangePopup-title": "ርእይቶ ወረቀት ካርዳተይ",
  "globalSearchViewChange-choice-me": "ወረቀት ካርዳተይ",
  "cardsReportTitle": "ጸብጻብ ወረቀት ካርዳት",
  "step-restore-cards": "ወረቀት ካርዳት መልስ"
};
for (const [key, value] of Object.entries(reviewed)) {
  assert.equal(tigre[key], value, key + ': exact reviewed Tigre value');
  assert.notEqual(tigre[key], tigrinya[key], key + ': Tigrinya seed removed');
  assert.match(tigre[key], /ወረቀት ካርድ|ወረቀት ካርዳ/, key + ': Tigre Card form');
}
console.log('Tigre remaining card terms: ' + Object.keys(reviewed).length);
