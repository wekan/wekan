'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname,'..');const read=c=>JSON.parse(fs.readFileSync(path.join(root,`imports/i18n/data/${c}.i18n.json`),'utf8'));const tig=read('tig'),ti=read('ti');const terms={
  "text-note-text": "ክቱብ",
  "custom-field-text": "ክቱብ",
  "text": "ክቱብ",
  "text-note-title": "አርእስ",
  "operator-title": "አርእስ",
  "move-source": "መበገሲ",
  "event-source": "መበገሲ",
  "list-sync-source-type": "መበገሲ",
  "support": "ሰዳየት",
  "supportPopup-title": "ሰዳየት",
  "public": "ናይ ገቢል",
  "predicate-public": "ናይ ገቢል",
  "boards": "ምዱዳት",
  "myCardsViewChange-choice-boards": "ምዱዳት",
  "cardLabelsPopup-title": "እሻራት",
  "labels": "እሻራት",
  "avatars-upload-blocked-label": "ተምሳላት መንነት",
  "move-scope-avatars": "ተምሳላት መንነት",
  "avatars": "ተምሳላት መንነት"
};for(const[k,v]of Object.entries(terms)){assert.equal(tig[k],v,`${k}: reviewed Tigre noun`);assert.notEqual(tig[k],ti[k],`${k}: reject Tigrinya seed`)}console.log(`Checked ${Object.keys(terms).length} Tigre interface nouns.`);
