const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const locale = code => JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/' + code + '.i18n.json'), 'utf8'));
const tigre = locale('tig');
const tigrinya = locale('ti');
const reviewed = {
  "boardChangeWatchPopup-title": "ምክትታል ተቅዪር",
  "convert-to-markdown": "ዲብ markdown ተቅዪር",
  "step-convert-shared-lists": "ዝተኻፈሉ ዝርዝራት ተቅዪር",
  "show-parent-in-minicard": "ወላዲ ዲብ ንኡስ ወረቀት ካርድ ኣርኤ፦",
  "display-authentication-method": "ኣገባብ ምርግጋጽ መንነት ኣርኤ",
  "show-subtasks-field": "ዓውዲ ንኡሳን ዕማማት ኣርኤ",
  "importDependenciesPopup-title": "ጽግዕተኛነታት አምጸአ",
  "trello-api-import": "ብመፍቲሕን tokenን API ብቐጥታ ካብ Trello አምጸአ",
  "import-source-heading": "ካብዚ አምጸአ፦",
  "see-all-starred-items": "ክሎም ኮከብ ዝተገብረሎም ኣቕንዖት ርአ",
  "delete-all-notifications": "ክሎም ምልክታታት ደምስስ",
  "delete-duplicate-lists-confirm": "ርግጸኛ ዲኻ? እዚ ሓደ ስሜት ዘለዎምን ወረቀት ካርድ ዘይሓዙን ክሎም ተደጋገምቲ ዝርዝራት ክድምስስ እዩ።",
  "Node_memory_usage_rss": "ኣጠቓቕማ መዘክር Node፦ ቅያስ ነባሪ ስብስብ",
  "gridfs-size": "ቅያስ GridFS",
  "migration-batch-size": "ቅያስ ጉጅለ",
  "subtext-with-full-path": "ንኡስ ጽሑፍ ምስ ምሉእ ገበይ",
  "avatars-path": "ገበይ ስእልታት መንነት",
  "avatars-path-description": "ፋይላት ስእሊ መንነት ዝዕቀቡሉ ገበይ",
  "mapImportedMemberPopup-title": "ምስ ዘሎ መትነፍዓይ ኣዛምድ",
  "map-to-existing-user": "ምስ ዘሎ መትነፍዓይ ኣዛምድ",
  "map-to-existing-user-no-results": "ዝሰማማዕ መትነፍዓይ ኣይተረኽበን።",
  "error-user-doesNotExist": "እዚ መትነፍዓይ የለን",
  "error-user-notCreated": "እዚ መትነፍዓይ ኣይተፈጥረን",
  "deleted-user": "ዝተደምሰሰ መትነፍዓይ",
  "accounts-allowUserDelete": "መትነፍዓይ ሕሳቡ ባዕሉ ይደምስስ",
  "user-username-not-found": "ስሜት መትነፍዓይ '%s' ኣይተረኽበን።",
  "username-password-required": "ስሜት መትነፍዓይን መሕለፊ ቃልን የድልዩ",
  "user-exists": "መትነፍዓይ ድሮ ኣሎ",
  "userAnonymizePopup-title": "ዝኣትዉ መትነፍዕያም ስሞም ሕባእ",
  "support-info-only-for-logged-in-users": "ሓበሬታ ደገፍ ንዝኣተዉ መትነፍዕያም ጥራይ እዩ።",
  "anonymize-import-users": "ዝኣትዉ መትነፍዕያም ስሞም ሕባእ",
  "anonymize-account": "ዝኣትዉ መትነፍዕያም ስሞም ሕባእ"
};
for (const [key, value] of Object.entries(reviewed)) {
  assert.equal(tigre[key], value, key + ': exact reviewed Tigre value');
  assert.notEqual(tigre[key], tigrinya[key], key + ': Tigrinya seed removed');
}
for (const key of ["importDependenciesPopup-title","trello-api-import","import-source-heading"]) assert.match(tigre[key], /አምጸአ/, key + ': Import verb');
for (const key of ["mapImportedMemberPopup-title","map-to-existing-user","map-to-existing-user-no-results","error-user-doesNotExist","error-user-notCreated","deleted-user","accounts-allowUserDelete","user-username-not-found","username-password-required","user-exists","userAnonymizePopup-title","support-info-only-for-logged-in-users","anonymize-import-users","anonymize-account"]) assert.match(tigre[key], /መትነፍዓይ|መትነፍዕያም/, key + ': User form');
console.log('Tigre repeated components: ' + Object.keys(reviewed).length);
