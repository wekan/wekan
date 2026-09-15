'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname,'..');const read=c=>JSON.parse(fs.readFileSync(path.join(root,`imports/i18n/data/${c}.i18n.json`),'utf8'));const tig=read('tig'),ti=read('ti');const terms={
  "task": "ሹቁል",
  "operator-sort": "ስርዓም",
  "person": "ነፈር",
  "r-trigger": "መንሸጢ"
};for(const[k,v]of Object.entries(terms)){assert.equal(tig[k],v);assert.notEqual(tig[k],ti[k])}console.log('Checked Tigre conflicting-sense terms.');
