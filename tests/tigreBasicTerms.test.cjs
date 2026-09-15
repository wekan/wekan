'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname,'..');const read=c=>JSON.parse(fs.readFileSync(path.join(root,`imports/i18n/data/${c}.i18n.json`),'utf8'));const tig=read('tig'),ti=read('ti');const terms={
  "color-sky": "ሰመ",
  "operator-org": "መነዘመት",
  "color-pink": "ሸግራይ",
  "days": "አምዕል",
  "path": "ገበይ",
  "predicate-year": "ሰነት",
  "roles-status-role": "ተረት",
  "roles": "ተረታት",
  "board-view-table": "ጣውለት",
  "color-white": "ጸዕደ",
  "comment-reply": "ምብላስ",
  "font-size-small": "ንኢሽ",
  "heading-notes": "ምለሐዛት",
  "hours": "ሰዐታት",
  "stats-count": "ዐደድ",
  "testsReportTitle": "እምትሓናት",
  "today": "ዮም"
};for(const[k,v]of Object.entries(terms)){assert.equal(tig[k],v,`${k}: corpus-backed Tigre basic term`);assert.notEqual(tig[k],ti[k],`${k}: reject Tigrinya seed`)}console.log(`Checked ${Object.keys(terms).length} Tigre basic terms.`);
